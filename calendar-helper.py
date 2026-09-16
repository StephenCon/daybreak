"""Daybreak's local Google Calendar reader. Python standard library, Windows only."""
import base64
import ctypes
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import sys
import threading
import time
import urllib.parse as url
import urllib.request as request
import urllib.error
import webbrowser
from datetime import datetime, timedelta
from http.server import ThreadingHTTPServer as HTTPServer, BaseHTTPRequestHandler
from accounts_page import render as render_accounts

ROOT = Path(__file__).resolve().parent
VAULT = ROOT / '.calendar-credentials'
PORT = 18743
BASE = f'http://127.0.0.1:{PORT}'
SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly'
LOCK = threading.RLock()
WAKE = threading.Event()
CSRF = secrets.token_urlsafe(32)
pending = None
credentials = {}
github_login_process = None


class Blob(ctypes.Structure):
    _fields_ = [('length', ctypes.c_ulong), ('data', ctypes.POINTER(ctypes.c_ubyte))]


def protect(data, decrypt=False):
    """Windows DPAPI: credentials can only be decrypted by this Windows user."""
    buffer = ctypes.create_string_buffer(data)
    source = Blob(len(data), ctypes.cast(buffer, ctypes.POINTER(ctypes.c_ubyte)))
    target = Blob()
    fn = ctypes.windll.crypt32.CryptUnprotectData if decrypt else ctypes.windll.crypt32.CryptProtectData
    if not fn(ctypes.byref(source), None, None, None, None, 1, ctypes.byref(target)):
        raise OSError('Windows credential protection failed')
    try:
        return ctypes.string_at(target.data, target.length)
    finally:
        ctypes.windll.kernel32.LocalFree(target.data)


def atomic(path, data):
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_bytes(data)
    os.replace(temp, path)


def save_credentials():
    atomic(VAULT, protect(json.dumps(credentials).encode()))


def api(endpoint, form=None, token=None):
    headers = {'Authorization': 'Bearer ' + token} if token else {}
    body = url.urlencode(form).encode() if form is not None else None
    with request.urlopen(request.Request(endpoint, data=body, headers=headers), timeout=20) as response:
        return json.load(response)


def read_cache():
    try:
        return json.loads((ROOT / 'calendar-data.js').read_text(encoding='utf-8').split('=', 1)[1].strip().rstrip(';'))
    except (OSError, ValueError, IndexError):
        return {'version': 1, 'events': [], 'date': '', 'timezone': 'Europe/London'}


def write_calendar(data):
    data['checkedAt'] = datetime.now().astimezone().isoformat()
    atomic(ROOT / 'calendar-data.js', ('window.DAYBREAK_CALENDAR = ' + json.dumps(data, ensure_ascii=True) + ';\n').encode())


def sync():
    with LOCK:
        if not credentials.get('refresh_token'):
            return
        saved = read_cache()
        try:
            token = api('https://oauth2.googleapis.com/token', {
                'client_id': credentials['client_id'], 'client_secret': credentials['client_secret'],
                'refresh_token': credentials['refresh_token'], 'grant_type': 'refresh_token'})['access_token']
            # Use Windows local date and each midnight's own offset (including DST).
            today = datetime.now().date()
            start = datetime.combine(today, datetime.min.time()).astimezone()
            end = datetime.combine(today + timedelta(days=1), datetime.min.time()).astimezone()
            params = {'timeMin': start.isoformat(), 'timeMax': end.isoformat(),
                      'singleEvents': 'true', 'orderBy': 'startTime', 'maxResults': 2500}
            events = []
            while True:
                page = api('https://www.googleapis.com/calendar/v3/calendars/primary/events?' + url.urlencode(params), token=token)
                for item in page.get('items', []):
                    if item.get('status') == 'cancelled':
                        continue
                    events.append({'id': item['id'], 'title': item.get('summary', '(Untitled event)'),
                                   'start': item['start'].get('dateTime', item['start'].get('date')),
                                   'end': item['end'].get('dateTime', item['end'].get('date')),
                                   'url': item.get('htmlLink', 'https://calendar.google.com/')})
                if not page.get('nextPageToken'):
                    break
                params['pageToken'] = page['nextPageToken']
            write_calendar({'version': 1, 'mode': 'live', 'status': 'connected', 'calendarLabel': 'Google Calendar',
                            'timezone': 'local', 'date': today.isoformat(),
                            'updatedAt': datetime.now().astimezone().isoformat(), 'events': events})
        except Exception as error:
            status = ('reconnect' if error.code in (400, 401) else 'error') if isinstance(error, urllib.error.HTTPError) else 'offline'
            saved.update(mode='live', status=status)
            write_calendar(saved)


def worker():
    while True:
        sync()
        WAKE.wait(60)
        WAKE.clear()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # OAuth codes and secrets must never enter access logs.

    def respond(self, text, status=200, kind='text/html; charset=utf-8'):
        self.send_response(status)
        self.send_header('Content-Type', kind)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'strict-origin')
        self.send_header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self' https://accounts.google.com; frame-ancestors 'none'")
        self.end_headers()
        self.wfile.write(text.encode())

    def allowed(self):
        return self.headers.get('Host') == f'127.0.0.1:{PORT}'

    def do_GET(self):
        global pending, credentials
        if not self.allowed():
            return self.respond('Forbidden', 403)
        parsed = url.urlparse(self.path)
        if parsed.path == '/callback':
            query = url.parse_qs(parsed.query)
            with LOCK:
                attempt = pending
                if not attempt or time.time() - attempt['at'] > 600 or not secrets.compare_digest(query.get('state', [''])[0], attempt['state']):
                    return self.respond('This sign-in expired. Return to Calendar connection and try again.', 400)
                pending = None
                if 'code' not in query:
                    return self.respond('Sign-in was cancelled. <a href="/">Try again</a>.')
                try:
                    tokens = api('https://oauth2.googleapis.com/token', {
                        'client_id': attempt['client_id'], 'client_secret': attempt['client_secret'],
                        'code': query['code'][0], 'code_verifier': attempt['verifier'],
                        'redirect_uri': BASE + '/callback', 'grant_type': 'authorization_code'})
                    if not tokens.get('refresh_token'):
                        raise ValueError('Missing refresh token')
                    new = {k: attempt[k] for k in ('client_id', 'client_secret')}
                    new['refresh_token'] = tokens['refresh_token']
                    old = credentials
                    credentials = new
                    try:
                        save_credentials()
                    except Exception:
                        credentials = old
                        raise
                    WAKE.set()
                    return self.respond('Connected. Your homepage will update within a minute. You can close this tab. <a href="/">Manage connection</a>')
                except Exception:
                    return self.respond('Google sign-in could not be saved. Check your OAuth client and try again. Your existing connection is unchanged. <a href="/">Return</a>', 400)
        if parsed.path != '/':
            return self.respond('Not found', 404)
        try:
            github_status = json.loads((ROOT / 'github-data.js').read_text(encoding='utf-8').split('=', 1)[1].strip().rstrip(';')).get('status')
        except (OSError, ValueError, IndexError, AttributeError):
            github_status = None
        available = bool(shutil.which('gh') or Path(r'C:\Program Files\GitHub CLI\gh.exe').is_file())
        self.respond(render_accounts(CSRF, bool(credentials.get('refresh_token')), read_cache().get('status'), github_status, available))

    def do_POST(self):
        global pending, credentials, github_login_process
        if not self.allowed() or self.headers.get('Origin') != BASE:
            return self.respond('Forbidden', 403)
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 32000:
                raise ValueError()
            form = url.parse_qs(self.rfile.read(length).decode())
            if not secrets.compare_digest(form.get('csrf', [''])[0], CSRF):
                return self.respond('Expired form. Reload this page.', 403)
            if self.path == '/github-connect':
                with LOCK:
                    if github_login_process is None or github_login_process.poll() is not None:
                        try:
                            github_login_process = subprocess.Popen(
                                [sys.executable, str(ROOT / 'github-login.py')], cwd=str(ROOT),
                                creationflags=getattr(subprocess, 'CREATE_NEW_CONSOLE', 0))
                        except OSError:
                            return self.respond('Could not open GitHub sign-in. Run gh auth login in a terminal. <a href="/">Return</a>', 500)
                return self.respond('GitHub sign-in is open in a terminal. Follow its instructions, then return to Daybreak. <a href="/">Refresh connections</a>')
            if self.path == '/disconnect':
                with LOCK:
                    credentials = {}
                    pending = None
                    VAULT.unlink(missing_ok=True)
                    write_calendar({'version': 1, 'mode': 'live', 'status': 'disconnected', 'date': '', 'timezone': 'local', 'events': []})
                return self.respond('Disconnected locally. To revoke Google access too, remove Daybreak from <a href="https://myaccount.google.com/connections">your Google account connections</a>. <a href="/">Connect again</a>')
            if self.path != '/connect':
                return self.respond('Not found', 404)
            client = json.loads(form['client'][0])['installed']
            if not isinstance(client.get('client_id'), str) or not client['client_id'].endswith('.apps.googleusercontent.com') or not isinstance(client.get('client_secret'), str):
                raise ValueError()
            verifier = secrets.token_urlsafe(48)
            attempt = {'client_id': client['client_id'], 'client_secret': client['client_secret'], 'verifier': verifier,
                       'state': secrets.token_urlsafe(32), 'at': time.time()}
            with LOCK:
                pending = attempt
            query = {'client_id': client['client_id'], 'redirect_uri': BASE + '/callback', 'response_type': 'code',
                     'scope': SCOPE, 'state': attempt['state'], 'access_type': 'offline', 'prompt': 'consent',
                     'code_challenge': base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip('='),
                     'code_challenge_method': 'S256'}
            self.send_response(303)
            self.send_header('Location', 'https://accounts.google.com/o/oauth2/v2/auth?' + url.urlencode(query))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
        except (ValueError, KeyError, TypeError):
            self.respond('Use the complete JSON downloaded for a Desktop app OAuth client. <a href="/">Try again</a>', 400)


def main():
    global credentials
    try:
        server = HTTPServer(('127.0.0.1', PORT), Handler)
    except OSError:
        webbrowser.open(BASE)
        return
    if VAULT.exists():
        try:
            credentials = json.loads(protect(VAULT.read_bytes(), decrypt=True))
        except Exception:
            print('Saved credentials could not be opened. Reconnect in the setup page.')
    threading.Thread(target=worker, daemon=True).start()
    spec = importlib.util.spec_from_file_location('daybreak_github', ROOT / 'github-sync.py')
    github = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(github)
    threading.Thread(target=github.worker, daemon=True).start()
    if not credentials or '--setup' in sys.argv:
        webbrowser.open(BASE)
    server.serve_forever()


if __name__ == '__main__':
    main()
