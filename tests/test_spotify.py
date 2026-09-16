import io
import json
from pathlib import Path
import sys
import tempfile
import time
import unittest
from unittest.mock import Mock, MagicMock, patch
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from spotify_service import SpotifyService


class SpotifyTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.root = Path(self.folder.name)
        self.service = SpotifyService(self.root, lambda data, decrypt=False: data,
                                      lambda path, data: path.write_bytes(data), 'http://127.0.0.1:18743')

    def tearDown(self):
        self.folder.cleanup()

    def connect(self):
        s = self.service
        query = parse_qs(urlparse(s.authorize('a' * 32)).query)
        self.assertEqual(query['code_challenge_method'], ['S256'])
        self.assertEqual(query['redirect_uri'], ['http://127.0.0.1:18743/spotify/callback'])
        s.token_request = Mock(return_value={'access_token': 'TEST_ACCESS', 'refresh_token': 'TEST_REFRESH', 'expires_in': 3600})
        s.callback({'state': query['state'], 'code': ['test-code']})

    def test_pkce_state_replay_and_no_oauth_tokens_in_cache(self):
        s = self.service
        with self.assertRaises(ValueError):
            s.authorize('not-a-client-id')
        s.authorize('a' * 32)
        with self.assertRaises(ValueError):
            s.callback({'state': ['wrong'], 'code': ['test']})
        self.connect()
        with self.assertRaises(ValueError):
            s.callback({'state': ['wrong'], 'code': ['replay']})
        cache = (self.root / 'spotify-data.js').read_text()
        self.assertNotIn('TEST_ACCESS', cache)
        self.assertNotIn('TEST_REFRESH', cache)
        self.assertIn('controlKey', cache)

    def test_cancel_keeps_existing_credentials(self):
        self.connect()
        s = self.service
        query = parse_qs(urlparse(s.authorize('b' * 32)).query)
        with self.assertRaises(ValueError):
            s.callback({'state': query['state'], 'error': ['access_denied']})
        self.assertEqual(s.credentials['client_id'], 'a' * 32)

    def test_playback_commands_device_restrictions_and_idle(self):
        self.connect()
        s = self.service
        s.api = Mock(return_value={'item': {'name': 'Test song', 'artists': [{'name': 'Test artist'}],
                                             'duration_ms': 180000, 'album': {'images': [{'url': 'https://i.scdn.co/image/example'}]}},
                                   'device': {'name': 'Desktop'}, 'is_playing': True, 'progress_ms': 1000,
                                   'actions': {'disallows': {'skipping_next': True}}})
        s.poll()
        self.assertTrue(s.snapshot['playing'])
        self.assertEqual(s.control('next')[0], 403)
        for action, method in [('play','PUT'),('pause','PUT'),('previous','POST')]:
            self.assertEqual(s.control(action)[0], 200)
            s.api.assert_called_with(method, '/' + action)
        self.assertEqual(s.control('delete')[0], 400)
        s.api.return_value = None
        s.poll()
        self.assertEqual(s.snapshot['status'], 'idle')
        self.assertEqual(s.control('play')[0], 409)

    def test_backoff_reconnect_and_disconnect(self):
        self.connect()
        s = self.service
        s.api = Mock(side_effect=HTTPError('https://api.spotify.com/', 429, 'limit', {'Retry-After': '120'}, io.BytesIO()))
        s.poll()
        self.assertEqual(s.snapshot['status'], 'rate-limited')
        self.assertGreater(s.retry_at, time.time() + 100)
        s.poll()
        self.assertEqual(s.api.call_count, 1)
        self.assertEqual(s.control('play')[0], 429)
        s.retry_at = 0
        s.api.side_effect = HTTPError('https://api.spotify.com/', 401, 'expired', {}, io.BytesIO())
        s.poll()
        self.assertEqual(s.snapshot['status'], 'reconnect')
        old_key = s.control_key
        s.disconnect()
        self.assertFalse(s.vault.exists())
        self.assertNotEqual(s.control_key, old_key)
        self.assertNotIn('controlKey', s.snapshot)

    def test_successful_commands_do_not_require_json(self):
        self.connect()
        s = self.service
        s.snapshot = {'status': 'connected', 'allowed': dict.fromkeys(s.ACTIONS, True)}
        for status, body in [(200, b'OK'), (202, b'Accepted'), (204, b'')]:
            for action in s.ACTIONS:
                response = MagicMock()
                response.__enter__.return_value = response
                response.status = status
                response.read.return_value = body
                with patch('spotify_service.urllib.request.urlopen', return_value=response):
                    self.assertEqual(s.control(action)[0], 200)
                response.read.assert_not_called()
                self.assertEqual(s.snapshot['status'], 'connected')
        with patch('spotify_service.urllib.request.urlopen', side_effect=HTTPError(
                'https://api.spotify.com/', 403, 'Forbidden', {}, io.BytesIO())):
            self.assertEqual(s.control('play')[0], 409)
        self.assertEqual(s.snapshot['status'], 'restricted')

    def test_playback_reads_still_parse_and_validate_json(self):
        self.connect()
        response = MagicMock()
        response.__enter__.return_value = response
        response.status = 200
        response.read.return_value = b'{"is_playing": true}'
        with patch('spotify_service.urllib.request.urlopen', return_value=response):
            self.assertEqual(self.service.api('GET'), {'is_playing': True})
            response.read.return_value = b'not JSON'
            with self.assertRaises(ValueError):
                self.service.api('GET')

    def test_refresh_rotation_and_safe_artwork(self):
        self.connect()
        s = self.service
        s.expires = 0
        s.token_request.return_value = {'access_token': 'NEW_ACCESS', 'refresh_token': 'NEW_REFRESH', 'expires_in': 3600}
        self.assertEqual(s.token(), 'NEW_ACCESS')
        self.assertEqual(json.loads(s.vault.read_text())['refresh_token'], 'NEW_REFRESH')
        self.assertEqual(s.web_url('https://evil.example/art', True), '')
        self.assertEqual(s.web_url('javascript:alert(1)'), '')

    def test_refresh_lease_is_limited_and_needs_connection(self):
        s = self.service
        self.assertEqual(s.control('poll')[0], 409)
        self.connect()
        s.active_until = 0
        self.assertEqual(s.control('poll')[0], 200)
        self.assertLessEqual(s.active_until, time.time() + 45)
        self.assertGreater(s.active_until, time.time() + 40)


if __name__ == '__main__':
    unittest.main()
