# Connect Google Calendar (Windows)

The optional helper reads scheduled events from your primary Google Calendar. It requires Python 3 on PATH and your own Google Cloud project. There are no Python packages to install.

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/) and enable the Google Calendar API.
2. Configure Google Auth Platform's Branding, Audience and Data Access. For personal Google accounts, use External and add yourself as a test user while the app is in Testing.
3. Add the read-only scope `https://www.googleapis.com/auth/calendar.events.readonly`.
4. Create an OAuth client with type **Desktop app** and download its JSON. Keep it private, outside this repository.
5. Run **Connect accounts.cmd** or the **Daybreak Accounts** desktop shortcut. It starts the helper hidden and opens its connection screen at `http://127.0.0.1:18743/`. The same guide is available inside Settings → Connect accounts.
6. Paste the downloaded client's JSON into that local screen and select **Sign in with Google**. Check the app and requested scope before granting consent.
7. Return to Daybreak. The helper refreshes every minute; the homepage checks its output every 30 seconds.

See [Google's Calendar setup guide](https://developers.google.com/workspace/calendar/api/quickstart/python) for project and desktop-client configuration. Daybreak supplies its own helper, so you do not need that guide's example client-library installation.

Credentials are encrypted with Windows DPAPI in `.calendar-credentials`. Event titles, times and links are stored unencrypted in the ignored `calendar-data.js`. Neither is included in desktop JSON backups. Never share your used installation folder as a public download.

Use **Calendar connection → Disconnect and clear saved calendar** to delete the local credentials and event cache. Revoke access separately through [Google account connections](https://myaccount.google.com/connections). Test-mode authorizations may require reconnecting; see [Google's token-expiration documentation](https://developers.google.com/identity/protocols/oauth2#expiration).

For automatic startup, create a shortcut to **Start Calendar.cmd** in the Windows Startup folder (`Win+R`, then `shell:startup`). Remove it to stop future automatic launches. Signing out of Windows stops the running helper. Running the launcher again while the helper is active opens its connection screen.

Only one Daybreak helper can use port 18743 at a time. Keep your installation in one stable folder. The helper refreshes GitHub independently if the GitHub CLI is signed in; Google sign-in is not required for GitHub.
