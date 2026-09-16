"""Spotify remote: PKCE, Windows-encrypted tokens, and a short-lived local cache."""
import base64
import hashlib
import json
import re
import secrets
import threading
import time
import urllib.error
import urllib.parse
import urllib.request


class SpotifyService:
    SCOPE = 'user-read-playback-state user-modify-playback-state'
    ACTIONS = {'play': ('PUT', 'play'), 'pause': ('PUT', 'pause'),
               'next': ('POST', 'next'), 'previous': ('POST', 'previous')}

    def __init__(self, root, protect, atomic, base):
        self.root, self.protect, self.atomic = root, protect, atomic
        self.redirect = base + '/spotify/callback'
        self.vault = root / '.spotify-credentials'
        self.credentials = {}
        self.pending = None
        self.access = ''
        self.expires = 0
        self.retry_at = 0
        self.active_until = 0
        self.lock = threading.RLock()
        self.wake = threading.Event()
        # This authorizes only the four local playback actions; never a Spotify token.
        self.control_key = secrets.token_urlsafe(32)
        self.snapshot = {'status': 'disconnected'}
        if self.vault.exists():
            try:
                saved = json.loads(protect(self.vault.read_bytes(), decrypt=True))
                if not saved.get('client_id') or not saved.get('refresh_token'):
                    raise ValueError()
                self.credentials = saved
                self.snapshot = {'status': 'connecting'}
            except Exception:
                self.snapshot = {'status': 'reconnect'}

    def write(self, data):
        self.snapshot = dict(data, checkedAt=int(time.time() * 1000))
        if self.credentials:
            self.snapshot['controlKey'] = self.control_key
        self.atomic(self.root / 'spotify-data.js',
                    ('window.DAYBREAK_SPOTIFY = ' + json.dumps(self.snapshot, ensure_ascii=True) + ';\n').encode())

    def authorize(self, client_id):
        if not re.fullmatch(r'[a-fA-F0-9]{32}', client_id):
            raise ValueError('Use the Client ID from your Spotify app settings.')
        with self.lock:
            verifier = secrets.token_urlsafe(48)
            self.pending = {'client_id': client_id, 'state': secrets.token_urlsafe(32),
                            'verifier': verifier, 'at': time.time()}
            challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip('=')
            return 'https://accounts.spotify.com/authorize?' + urllib.parse.urlencode({
                'client_id': client_id, 'response_type': 'code', 'redirect_uri': self.redirect,
                'scope': self.SCOPE, 'state': self.pending['state'],
                'code_challenge_method': 'S256', 'code_challenge': challenge})

    def token_request(self, form):
        req = urllib.request.Request('https://accounts.spotify.com/api/token',
                                     data=urllib.parse.urlencode(form).encode())
        with urllib.request.urlopen(req, timeout=15) as response:
            return json.load(response)

    def callback(self, query):
        with self.lock:
            attempt = self.pending
            if not attempt or time.time() - attempt['at'] > 600 or not secrets.compare_digest(query.get('state', [''])[0], attempt['state']):
                raise ValueError('Spotify sign-in expired. Please try again.')
            self.pending = None
            if 'code' not in query:
                raise ValueError('Spotify sign-in was cancelled. Your existing connection is unchanged.')
            tokens = self.token_request({'grant_type': 'authorization_code', 'code': query['code'][0],
                                         'redirect_uri': self.redirect, 'client_id': attempt['client_id'],
                                         'code_verifier': attempt['verifier']})
            if not tokens.get('refresh_token') or not tokens.get('access_token'):
                raise ValueError('Spotify did not return the required tokens.')
            saved = {'client_id': attempt['client_id'], 'refresh_token': tokens['refresh_token']}
            self.atomic(self.vault, self.protect(json.dumps(saved).encode()))
            self.credentials = saved
            self.access, self.expires = tokens['access_token'], time.time() + float(tokens.get('expires_in', 3600)) - 60
            self.control_key = secrets.token_urlsafe(32)
            self.retry_at = 0
            self.active_until = time.time() + 45
            self.write({'status': 'connecting'})
            self.wake.set()

    def token(self):
        if self.access and time.time() < self.expires:
            return self.access
        tokens = self.token_request({'grant_type': 'refresh_token', 'refresh_token': self.credentials['refresh_token'],
                                     'client_id': self.credentials['client_id']})
        if not tokens.get('access_token'):
            raise ValueError('Missing access token')
        if tokens.get('refresh_token'):
            saved = dict(self.credentials, refresh_token=tokens['refresh_token'])
            self.atomic(self.vault, self.protect(json.dumps(saved).encode()))
            self.credentials = saved
        self.access, self.expires = tokens['access_token'], time.time() + float(tokens.get('expires_in', 3600)) - 60
        return self.access

    def api(self, method, suffix=''):
        req = urllib.request.Request('https://api.spotify.com/v1/me/player' + suffix,
                                     headers={'Authorization': 'Bearer ' + self.token()}, method=method)
        with urllib.request.urlopen(req, timeout=15) as response:
            return None if response.status == 204 else json.loads(response.read() or b'null')

    @staticmethod
    def web_url(value, artwork=False):
        try:
            parsed = urllib.parse.urlparse(value or '')
            allowed = parsed.hostname == 'i.scdn.co' if artwork else parsed.hostname == 'open.spotify.com'
            return value if allowed and parsed.scheme == 'https' and not parsed.username else ''
        except (ValueError, TypeError):
            return ''

    def failure(self, error):
        status, message = 'offline', 'Spotify is unavailable. The helper will retry.'
        if isinstance(error, urllib.error.HTTPError):
            if error.code in (400, 401):
                self.access = ''
                status, message = 'reconnect', 'Reconnect Spotify in Connect accounts.'
                self.retry_at = time.time() + 60
            elif error.code == 403:
                status, message = 'restricted', 'Check Premium, the app user allowlist, and Spotify playback restrictions.'
                self.retry_at = time.time() + 60
            elif error.code == 404:
                status, message = 'idle', 'Open Spotify and start playing on a device first.'
            elif error.code == 429:
                try:
                    delay = max(10, int(error.headers.get('Retry-After', '60')))
                except (ValueError, TypeError):
                    delay = 60
                self.retry_at = time.time() + delay
                status, message = 'rate-limited', 'Spotify asked us to wait. Retrying automatically.'
        self.write({'status': status, 'message': message})
        return message

    def poll(self):
        with self.lock:
            if not self.credentials:
                self.write({'status': self.snapshot.get('status', 'disconnected')})
                return
            if time.time() < self.retry_at:
                self.write(self.snapshot)
                return
            try:
                data = self.api('GET', '?additional_types=track,episode')
                if not data:
                    self.write({'status': 'idle', 'message': 'Open Spotify and start playing on a device first.'})
                    return
                item, device = data.get('item') or {}, data.get('device') or {}
                images = (item.get('album') or {}).get('images') or item.get('images') or []
                artists = ', '.join(a.get('name', '') for a in item.get('artists', [])) or (item.get('show') or {}).get('publisher', '')
                disallows = (data.get('actions') or {}).get('disallows') or {}
                restricted = device.get('is_restricted', False) or data.get('currently_playing_type') == 'ad'
                allowed = {action: bool(device) and not restricted and not disallows.get(key, False)
                           for action, key in [('play', 'resuming'), ('pause', 'pausing'), ('next', 'skipping_next'), ('previous', 'skipping_prev')]}
                self.write({'status': 'connected', 'title': item.get('name') or 'Spotify playback', 'artist': artists,
                            'url': self.web_url((item.get('external_urls') or {}).get('spotify')),
                            'artwork': self.web_url(images[-1].get('url'), True) if images else '',
                            'duration': max(0, item.get('duration_ms') or 0), 'progress': max(0, data.get('progress_ms') or 0),
                            'playing': bool(data.get('is_playing')), 'device': device.get('name') or 'Spotify',
                            'allowed': allowed})
            except Exception as error:
                self.failure(error)

    def control(self, action):
        with self.lock:
            if action == 'poll':
                if not self.credentials:
                    return 409, 'Connect Spotify first.'
                was_inactive = time.time() >= self.active_until
                self.active_until = time.time() + 45
                if was_inactive:
                    self.wake.set()
                return 200, 'Playback refresh active.'
            if action not in self.ACTIONS:
                return 400, 'Unknown playback action.'
            if time.time() < self.retry_at:
                return 429, 'Spotify asked us to wait. Try again shortly.'
            if not self.credentials or self.snapshot.get('status') != 'connected':
                return 409, 'Open Spotify and start playback, or reconnect your account.'
            if not self.snapshot.get('allowed', {}).get(action):
                return 403, 'Spotify does not allow this action on the current device.'
            try:
                method, endpoint = self.ACTIONS[action]
                self.api(method, '/' + endpoint)
                self.wake.set()
                return 200, 'Playback command sent.'
            except Exception as error:
                return 409, self.failure(error)

    def disconnect(self):
        with self.lock:
            self.vault.unlink(missing_ok=True)
            self.credentials, self.pending, self.access, self.expires = {}, None, '', 0
            self.control_key = secrets.token_urlsafe(32)
            self.retry_at = 0
            self.write({'status': 'disconnected'})

    def worker(self):
        while True:
            try:
                if not self.snapshot.get('checkedAt'):
                    self.write(self.snapshot)
                if not self.credentials or time.time() < self.active_until:
                    self.poll()
            except OSError:
                pass
            self.wake.wait(10)
            self.wake.clear()
