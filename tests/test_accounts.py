import http.client
import importlib.util
from pathlib import Path
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch, Mock
from urllib.parse import urlencode

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


class AccountEndpoints(unittest.TestCase):
    def setUp(self):
        spec = importlib.util.spec_from_file_location('helper', Path(__file__).resolve().parents[1] / 'calendar-helper.py')
        self.helper = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.helper)
        self.folder = tempfile.TemporaryDirectory()
        self.helper.ROOT = Path(self.folder.name)
        self.helper.credentials = {'refresh_token': 'TEST_SECRET_MUST_NOT_RENDER'}
        self.server = self.helper.HTTPServer(('127.0.0.1', 0), self.helper.Handler)
        self.helper.PORT = self.server.server_port
        self.helper.BASE = f'http://127.0.0.1:{self.server.server_port}'
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.folder.cleanup()

    def request(self, method, path, form=None, origin=None):
        conn = http.client.HTTPConnection('127.0.0.1', self.server.server_port)
        headers = {'Origin': origin or self.helper.BASE, 'Content-Type': 'application/x-www-form-urlencoded'}
        conn.request(method, path, urlencode(form or {}), headers)
        response = conn.getresponse()
        result = response.status, response.read().decode()
        conn.close()
        return result

    def test_page_has_both_flows_and_never_renders_credentials(self):
        status, page = self.request('GET', '/')
        self.assertEqual(status, 200)
        self.assertIn('Sign in with Google', page)
        self.assertIn('Sign in with GitHub', page)
        self.assertNotIn('TEST_SECRET_MUST_NOT_RENDER', page)

    def test_github_login_requires_origin_and_csrf_and_only_launches_once(self):
        process = Mock()
        process.poll.return_value = None
        with patch.object(self.helper.subprocess, 'Popen', return_value=process) as start:
            self.assertEqual(self.request('POST', '/github-connect', {'csrf': 'wrong'})[0], 403)
            self.assertEqual(self.request('POST', '/github-connect', {'csrf': self.helper.CSRF}, 'https://example.com')[0], 403)
            start.assert_not_called()
            for _ in range(2):
                self.assertEqual(self.request('POST', '/github-connect', {'csrf': self.helper.CSRF})[0], 200)
            start.assert_called_once()
            self.assertEqual(start.call_args.args[0], [sys.executable, str(self.helper.ROOT / 'github-login.py')])

    def test_malformed_google_client_keeps_existing_connection(self):
        self.assertEqual(self.request('POST', '/connect', {'csrf': self.helper.CSRF, 'client': '{}'})[0], 400)
        self.assertEqual(self.helper.credentials['refresh_token'], 'TEST_SECRET_MUST_NOT_RENDER')


if __name__ == '__main__':
    unittest.main()
