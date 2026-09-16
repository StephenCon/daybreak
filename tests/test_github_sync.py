import importlib.util
import json
from pathlib import Path
import tempfile
import unittest


class GitHubSyncTests(unittest.TestCase):
    def test_account_switch_clears_previous_private_cache_even_on_search_failure(self):
        spec = importlib.util.spec_from_file_location('sync', Path(__file__).resolve().parents[1] / 'github-sync.py')
        sync = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(sync)
        with tempfile.TemporaryDirectory() as folder:
            sync.ROOT = Path(folder)
            target = sync.ROOT / 'github-data.js'
            old = {'login': 'previous-user', 'issues': [{'title': 'Private old issue'}], 'updatedAt': '2026-01-01'}
            target.write_text('window.DAYBREAK_GITHUB = ' + json.dumps(old) + ';', encoding='utf-8')

            def command(args):
                if args[1] == 'user':
                    return 'new-user\n'
                raise RuntimeError('Search unavailable')

            sync.command = command
            result = sync.sync()
            self.assertEqual(result['login'], 'new-user')
            self.assertEqual(result['issues'], [])
            self.assertEqual(result['status'], 'unavailable')
            self.assertNotIn('Private old issue', target.read_text(encoding='utf-8'))

    def test_uses_authenticated_author_and_excludes_pull_requests(self):
        spec = importlib.util.spec_from_file_location('sync', Path(__file__).resolve().parents[1] / 'github-sync.py')
        sync = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(sync)
        with tempfile.TemporaryDirectory() as folder:
            sync.ROOT = Path(folder)
            calls = []

            def command(args):
                calls.append(args)
                if args[1] == 'user':
                    return 'example-user\n'
                return json.dumps({'total_count': 1, 'items': [
                    {'number': 1, 'title': 'Example issue', 'html_url': 'https://github.com/example/repo/issues/1',
                     'repository_url': 'https://api.github.com/repos/example/repo', 'labels': [], 'state': 'open'},
                    {'pull_request': {}, 'state': 'open'}]})

            sync.command = command
            result = sync.sync()
            self.assertIn('q=is:issue is:open author:example-user', calls[1])
            self.assertEqual(result['status'], 'connected')
            self.assertEqual(len(result['issues']), 1)


if __name__ == '__main__':
    unittest.main()
