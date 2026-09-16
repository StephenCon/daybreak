"""Interactive GitHub CLI sign-in. Invoked only by the connection-page button."""
import importlib.util
from pathlib import Path
import shutil
import subprocess


def main():
    gh = shutil.which('gh')
    fallback = Path(r'C:\Program Files\GitHub CLI\gh.exe')
    if not gh and fallback.is_file():
        gh = str(fallback)
    if not gh:
        print('Install GitHub CLI from https://cli.github.com/ and try again.')
    else:
        result = subprocess.run([gh, 'auth', 'login', '--hostname', 'github.com', '--git-protocol', 'https', '--web'])
        if result.returncode == 0:
            spec = importlib.util.spec_from_file_location('daybreak_github', Path(__file__).with_name('github-sync.py'))
            sync = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(sync)
            data = sync.sync()
            print('Connected. Return to Daybreak.' if data['status'] == 'connected' else 'Signed in, but issue sync is unavailable. The helper will retry.')
        else:
            print('Sign-in was cancelled or failed. You can try again from Connect accounts.')
    input('Press Enter to close this window.')


if __name__ == '__main__':
    main()
