"""Server-rendered connection UI. No secrets are rendered into the page."""
from html import escape


def render(csrf, google_connected, google_status, github_status, github_available, spotify_status='disconnected'):
    token = escape(csrf, quote=True)
    google = ('Sign-in needs renewing' if google_status == 'reconnect' else
              'Signed in - helper refreshes every minute' if google_connected else 'Not connected')
    github = ('GitHub CLI is not installed' if not github_available else
              'Last sync connected - refreshes every five minutes' if github_status == 'connected' else
              'Not synced - sign in below or check your GitHub CLI account')
    return '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Connect accounts - Daybreak</title><style>
    :root{color-scheme:light dark;--bg:#f5f3ed;--card:#fdfcf9;--text:#333a33;--muted:#62695e;--line:#d7dace;--accent:#536148}
    @media(prefers-color-scheme:dark){:root{--bg:#242922;--card:#2d332b;--text:#dedfd2;--muted:#adb4a4;--line:#414a3b;--accent:#b6c59e}}
    *{box-sizing:border-box}body{font:15px/1.65 'Segoe UI',sans-serif;background:var(--bg);color:var(--text);max-width:820px;margin:45px auto;padding:20px}
    h1{font:normal 42px/1.15 Georgia,serif;margin:15px 0}h2{font:normal 25px Georgia,serif}p{color:var(--muted)}section{background:var(--card);padding:25px;border:1px solid var(--line);border-radius:18px;margin:22px 0}
    a{color:inherit;text-underline-offset:3px}button{font:inherit;border:1px solid var(--line);border-radius:8px;padding:10px 17px;cursor:pointer;background:var(--accent);color:var(--bg)}button:disabled{opacity:.5;cursor:default}button.secondary{background:transparent;color:var(--text);margin-top:14px}
    textarea{width:100%;min-height:130px;padding:12px;background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:8px;font:13px monospace;margin:10px 0}summary{cursor:pointer;font-weight:600}li{margin:10px 0}:focus-visible{outline:3px solid var(--accent);outline-offset:4px}.status{color:var(--accent);font-weight:600}.tag{letter-spacing:2px;font-size:11px;text-transform:uppercase}
    </style><body><div class="tag">Daybreak / Accounts</div><h1>A little more connected.</h1><p>Connect either account, or both. Keep this helper running for updates.</p>
    <section><h2>Google Calendar</h2><p class="status">''' + escape(google) + '''</p>
    <details><summary>First time? Create your Google sign-in client</summary><ol>
    <li>Open <a href="https://console.cloud.google.com/" target="_blank" rel="noopener">Google Cloud Console</a>, create a project and enable <strong>Google Calendar API</strong>.</li>
    <li>In Google Auth Platform, configure Branding and Audience. For a personal account, choose External and add yourself as a test user.</li>
    <li>In Data Access, add <code>https://www.googleapis.com/auth/calendar.events.readonly</code>.</li>
    <li>In Clients, create a <strong>Desktop app</strong> OAuth client. Download its JSON, open it in a text editor and paste the contents below.</li></ol>
    <p>Use your own project. Daybreak reads scheduled events from your primary calendar; it cannot edit them. See <a href="https://developers.google.com/workspace/calendar/api/quickstart/python" target="_blank" rel="noopener">Google's setup guide</a>.</p></details>
    <form method="post" action="/connect"><input type="hidden" name="csrf" value="''' + token + '''"><p><label for="client">Your Desktop OAuth client JSON</label></p><textarea id="client" name="client" required spellcheck="false" autocomplete="off" placeholder='Paste the complete downloaded JSON here'></textarea><button>Sign in with Google</button></form>
    <p>Your credentials are encrypted for this Windows account. Test-mode sign-ins may need periodic renewal.</p>
    <form method="post" action="/disconnect"><input type="hidden" name="csrf" value="''' + token + '''"><button class="secondary">Disconnect and clear saved calendar</button></form></section>
    <section><h2>GitHub issues</h2><p class="status">''' + escape(github) + '''</p>
    <p>Shows open issues you created. Uses your GitHub CLI account, including any private issues it can access.</p>
    <details><summary>First time? Install GitHub CLI</summary><p>Install it from <a href="https://cli.github.com/" target="_blank" rel="noopener">cli.github.com</a>, then return here and reload. No token needs to be pasted into Daybreak.</p></details>
    <form method="post" action="/github-connect"><input type="hidden" name="csrf" value="''' + token + '''"><button''' + ('' if github_available else ' disabled') + '''>Sign in with GitHub</button></form>
    <p>A terminal opens for GitHub's browser sign-in instructions. When it finishes, return to your homepage. Existing GitHub CLI logins are detected automatically.</p>
    <p>To sign out of GitHub CLI, run <code>gh auth logout --hostname github.com</code> in a terminal. This also affects other tools using that CLI login. To remove saved issues, delete <code>github-data.js</code> from your Daybreak folder after stopping the helper.</p></section>
    <section><h2>Spotify</h2><p class="status">''' + escape({'connected': 'Connected', 'idle': 'Connected - open Spotify to start playback', 'connecting': 'Connecting', 'reconnect': 'Sign in again'}.get(spotify_status, 'Not connected or unavailable')) + '''</p>
    <p>Now playing, album art, play/pause and track skipping. Controls an active Spotify app or web player; music does not play inside Daybreak. Spotify Premium is required.</p>
    <details><summary>First time? Create your Spotify app</summary><ol>
    <li>Open the <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener">Spotify Developer Dashboard</a> and create an app for personal use, with Web API access.</li>
    <li>Add this exact redirect URI: <code>http://127.0.0.1:18743/spotify/callback</code>.</li>
    <li>In the app's user management, add the Spotify accounts that will use it. Development apps support up to five allowlisted users and require a Premium app owner.</li>
    <li>Copy the app's <strong>Client ID</strong> below. Daybreak does not need its client secret.</li></ol>
    <p><a href="https://developer.spotify.com/documentation/web-api/concepts/quota-modes" target="_blank" rel="noopener">Spotify's development-mode requirements</a></p></details>
    <form method="post" action="/spotify/connect"><input type="hidden" name="csrf" value="''' + token + '''"><p><label for="spotify-client">Spotify Client ID</label></p><input id="spotify-client" name="client_id" required pattern="[a-fA-F0-9]{32}" maxlength="32" autocomplete="off" style="width:100%;padding:12px;margin-bottom:14px"><button>Sign in with Spotify</button></form>
    <p>Access is limited to reading playback and controlling playback. Tokens are encrypted for this Windows account.</p>
    <form method="post" action="/spotify/disconnect"><input type="hidden" name="csrf" value="''' + token + '''"><button class="secondary">Disconnect and clear Spotify</button></form></section>
    <p><a href="/">Refresh connection status</a> · You can close this tab; the helper keeps running.</p></body></html>'''
