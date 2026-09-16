"""Read-only GitHub issue sync using the user's existing GitHub CLI login."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
from datetime import datetime

ROOT = Path(__file__).resolve().parent


def command(args):
    gh = shutil.which('gh') or r'C:\Program Files\GitHub CLI\gh.exe'
    result = subprocess.run([gh, *args], capture_output=True, text=True, encoding='utf-8',
                            timeout=45, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    if result.returncode:
        raise RuntimeError('GitHub request failed')
    return result.stdout


def sync():
    target = ROOT / 'github-data.js'
    try:
        saved = json.loads(target.read_text(encoding='utf-8').split('=', 1)[1].strip().rstrip(';'))
    except (OSError, ValueError, IndexError):
        saved = {'version': 1, 'login': '', 'issues': [], 'updatedAt': None}
    try:
        login = command(['api', 'user', '--jq', '.login']).strip()
        if not login or not all(c.isascii() and (c.isalnum() or c == '-') for c in login):
            raise RuntimeError('Invalid GitHub account')
        if saved.get('login', '').lower() != login.lower():
            saved = {'version': 1, 'login': login, 'issues': [], 'updatedAt': None}
        data = json.loads(command(['api', 'search/issues', '--method', 'GET', '-f',
                                  f'q=is:issue is:open author:{login}', '-f', 'sort=updated',
                                  '-f', 'order=desc', '-f', 'per_page=30']))
        if not isinstance(data.get('items'), list) or not isinstance(data.get('total_count'), int) or data.get('incomplete_results'):
            raise ValueError('Incomplete GitHub result')
        issues = []
        for item in data['items']:
            if 'pull_request' in item or item.get('state') != 'open':
                continue
            issues.append({'number': item['number'], 'title': item['title'], 'url': item['html_url'],
                           'repository': item['repository_url'].split('/repos/', 1)[1],
                           'labels': [label['name'] for label in item.get('labels', [])][:3]})
        saved = {'version': 1, 'login': login, 'status': 'connected', 'issues': issues,
                 'total': data['total_count'], 'updatedAt': datetime.now().astimezone().isoformat()}
    except Exception:
        saved['status'] = 'unavailable'
    saved['checkedAt'] = datetime.now().astimezone().isoformat()
    temp = target.with_suffix('.js.tmp')
    temp.write_text('window.DAYBREAK_GITHUB = ' + json.dumps(saved, ensure_ascii=True) + ';\n', encoding='utf-8')
    os.replace(temp, target)
    return saved


def worker():
    while True:
        try:
            sync()
        except OSError:
            pass  # A temporarily locked file must not stop future refreshes.
        time.sleep(300)


if __name__ == '__main__':
    result = sync()
    print(json.dumps({'status': result['status'], 'count': len(result['issues'])}))
