<div align="center">

# Daybreak

### A little space for your day.

A personal homepage with useful widgets, expressive themes, and a layout you can make your own.

**[Download for Windows](https://github.com/StephenCon/daybreak/releases/latest/download/Daybreak-Windows.zip)** · **[Latest release](https://github.com/StephenCon/daybreak/releases/latest)** · **[Report an issue](https://github.com/StephenCon/daybreak/issues)**

Local files · No frontend dependencies · Nine themes · Optional account connections

</div>

---

## Make yourself at home

Daybreak brings your daily essentials into one calm, customisable page. Search the web, capture a thought, check your schedule, and settle into a focus session.

| Your everyday essentials                            | Make it yours                                           |
| --------------------------------------------------- | ------------------------------------------------------- |
| Google, DuckDuckGo and YouTube search               | Drag and resize widgets on a transparent editing grid   |
| Favourite links, tasks and an autosaving scratchpad | Hide widgets and pack the layout neatly with **Done**   |
| Local clock and focus/break timer                   | Choose from nine themes with distinct fonts and styling |
| Weather for your chosen city                        | Follow your system's light/dark appearance              |
| Optional Google Calendar and GitHub issues          | Use **Ctrl+K** for quick actions and theme switching    |
| Spotify Now Playing with playback controls          | Album art and a progress bar that follow your theme     |

The core homepage runs directly from a folder. No server, account, Python installation or build step is needed to use search, links, tasks, notes, clock and timer.

## Install on Windows

1. **[Download Daybreak-Windows.zip](https://github.com/StephenCon/daybreak/releases/latest/download/Daybreak-Windows.zip)**.
2. Right-click the ZIP and select **Extract all**.
3. Open the extracted folder and double-click **Install Daybreak.cmd**.

Setup installs to `%LOCALAPPDATA%\Daybreak` and creates two desktop shortcuts:

- **Daybreak** opens your homepage in Chrome, or your default browser if Chrome isn't installed.
- **Daybreak Accounts** opens the optional account helper, once Python is installed.

A text window shows your homepage address and Chrome setup instructions. No administrator access is required. After setup, you can delete the extracted download folder.

<details>
<summary><strong>Prefer a portable copy, or use another operating system?</strong></summary>

Download the source using **Code → Download ZIP** and extract it to a permanent folder.

- **Windows:** run **Open Daybreak.cmd**.
- **Other systems:** copy the three `.js` files in `templates/` into the root folder, then open `index.html` in your browser.

The homepage itself is browser-based. The installer and Google Calendar helper currently require Windows. Keep the whole folder together and at a stable path.

</details>

### Set it as your Chrome homepage

Open Daybreak in Chrome and copy its `file:///.../index.html` address, or find it in the installed **Homepage setup.txt** file.

| When Daybreak should open | Chrome setting                                                                    |
| ------------------------- | --------------------------------------------------------------------------------- |
| Clicking the Home button  | **Settings → Appearance → Show Home button → Custom address**                     |
| Starting Chrome           | **Settings → On startup → Open a specific page or set of pages → Add a new page** |

Paste your Daybreak address into each setting you want to use. Setup does not change these settings automatically. This does not replace Chrome's **New Tab** page. [Chrome's setup guide](https://support.google.com/chrome/answer/95314?hl=en) explains the separate Home and startup settings.

## Nine ways to start your day

Press **Ctrl+K**, type **theme**, and choose a look.

| Theme                  | Feel                                                  |
| ---------------------- | ----------------------------------------------------- |
| **Daybreak** — default | Warm cream, sage and quiet editorial typography       |
| **Fireside**           | Walnut, candlelight, bookish headings and soft panels |
| **Nord**               | Cool slate and airy blue                              |
| **Gruvbox**            | Earthy colours and soft amber                         |
| **Rose Pine**          | Dusty rose and muted violet                           |
| **Tokyo Night**        | Midnight blue and lavender                            |
| **Hacker**             | Terminal green and monospace lettering                |
| **Retro**              | Parchment, burnt orange and typewriter styling        |
| **Cyberpunk**          | Ink violet, cyan and pink                             |

Every theme has light and dark colours. Appearance follows your system by default; **Settings → Appearance** lets you override it. Theme changes have a dramatic reveal, with a special ember effect for Fireside. Reduced-motion preferences skip the animation.

### Quick actions

| Type in Ctrl+K     | What happens                    |
| ------------------ | ------------------------------- |
| A favourite's name | Open that link                  |
| `task buy milk`    | Add a task                      |
| `focus 25`         | Start a 25-minute focus session |
| `theme`            | Choose a theme                  |
| `accounts`         | Open Connect accounts           |

In **Edit layout**, drag tile headings to move them and corners to resize. Keyboard users can use arrow keys on a heading to move, **Shift + arrows** to resize, and **Escape** to cancel a drag. **Done** packs tiles together; **Pack tiles** previews the result.

## Connect your accounts

Open **Settings → Connect accounts**, or type **accounts** in **Ctrl+K**. The screen explains setup and shows the last local sync status.

### First, start the helper

1. Install [Python 3 for Windows](https://www.python.org/downloads/windows/) with its launcher.
2. Open the **Daybreak Accounts** desktop shortcut, or run **Connect accounts.cmd** in the app folder.
3. The helper opens its connection page at `http://127.0.0.1:18743/`.

If the helper is already running, use **Open connection page** from Daybreak. A webpage cannot start the helper executable itself. Keep the helper running for automatic updates; you can close its browser tab.

### Google Calendar

The connection page walks you through creating your own Google Cloud project, enabling Calendar, and creating a **Desktop app OAuth client**. Paste that client's JSON into the local connection page, then choose **Sign in with Google**.

- Reads scheduled events from your **primary calendar**, including recurring and all-day events.
- Requests read-only access; it cannot edit events.
- Refreshes every minute, with the homepage checking the saved output every 30 seconds.
- Stores credentials encrypted for your Windows account.

Each person currently needs their own OAuth client. Google Tasks and additional calendars are not included. See the full [Calendar setup guide](CALENDAR-SETUP.md), including disconnecting and automatic startup.

### GitHub issues

Install [GitHub CLI](https://cli.github.com/), then choose **Sign in with GitHub** on the helper's connection page. A terminal guides you through GitHub's browser sign-in. Existing CLI logins are detected automatically; you can also run `gh auth login` yourself.

- Shows open issues **you created**, ordered by most recently updated.
- Displays the latest 30, with a link to the full list. Pull requests are excluded.
- Includes private issues when your CLI account can access them.
- Refreshes every five minutes; the homepage checks saved output every 30 seconds.

Google sign-in is not required for GitHub. For a one-time refresh, run `python github-sync.py` from the app folder.

### Weather

Choose a city directly in the weather widget. Forecasts and city search use [Open-Meteo](https://open-meteo.com/), with no API key. Requests begin after you choose a location, and a saved forecast remains available offline.

### Spotify Now Playing

The **Now playing** tile shows the current track, artist, album art, active device and progress, with **previous / play-pause / next** controls. It acts as a remote for Spotify: open Spotify on your computer, phone or web player and start playing first. Daybreak does not stream audio itself.

1. Start **Daybreak Accounts** and open the connection page.
2. Create a personal Web API app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
3. Set its redirect URI to exactly `http://127.0.0.1:18743/spotify/callback` and add your Spotify account to the app's user allowlist.
4. Paste the **Client ID** into the Spotify section and choose **Sign in with Spotify**. No client secret is required.
5. Approve playback access, return to Daybreak, and start music in Spotify.

[Playback controls require Premium](https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback). [Development-mode apps](https://developer.spotify.com/documentation/web-api/concepts/quota-modes) also require a Premium app owner and are limited to five allowlisted users. Each installation can connect its own developer app; this is not a shared public Spotify OAuth service.

The helper checks playback about every ten seconds while the tile is visible, stopping within 45 seconds after you hide it or leave the page. It respects rate-limit backoff. Progress advances between updates. Controls are disabled when the helper is stale, no player is active, or Spotify restricts an action. If Chrome asks for local network access, allow it so the tile can refresh and send playback commands to the helper. Use **Disconnect and clear Spotify** on the connection page to remove its local tokens and cached playback; access can also be revoked in [Spotify's connected apps](https://www.spotify.com/account/apps/).

## Updates, backups and privacy

**To update:** download the latest Windows ZIP, extract it, and run **Install Daybreak.cmd** again. Setup updates the same installation folder while preserving integration caches, credentials and weather configuration. Restart a running helper after updating; signing out of Windows and back in also stops the old process. Only one helper folder can use port 18743 at a time.

**Before moving folders:** use **Settings → Save backup**. Restore it through Settings at the new location, and keep your old installation until you have checked your data. Browser storage for local files can depend on the file path and browser profile.

| Data                                              | Where it lives                                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Tasks, notes, favourites, layout, theme and timer | Browser storage; included in Daybreak JSON backups                                                              |
| Weather preferences and cached forecast           | Separate browser storage; not included in those backups                                                         |
| Google credentials                                | Encrypted `.calendar-credentials` file on Windows                                                               |
| Calendar events and GitHub issues                 | Readable local cache files beside the app                                                                       |
| Spotify credentials                               | Windows-encrypted `.spotify-credentials`; not included in desktop backups                                       |
| Current Spotify playback                          | Ignored `spotify-data.js` cache, with a helper-session key limited to playback actions; no Spotify OAuth tokens |

The repository and releases contain empty integration templates only. Generated caches and credentials are excluded by `.gitignore`. Do not force-add personal caches, OAuth JSON or backups to Git.

**Share the GitHub download, rather than your used installation folder.** Daybreak is designed for local use; personal integration caches should never be deployed to a public web host.

<details>
<summary><strong>Troubleshooting</strong></summary>

- **Connection page won't open:** start **Daybreak Accounts** first. Install Python if prompted.
- **GitHub sign-in is unavailable:** install GitHub CLI, then reload the connection page.
- **Google needs sign-in again:** reconnect through the helper. Google test-mode authorizations may need renewal.
- **An update isn't visible:** reload with **Ctrl+Shift+R**. Restart the helper for connection-page changes.
- **Theme changes happen instantly:** the current browser may be reporting reduced motion; Daybreak shows a message when it skips the animation.
- **Data appears missing after moving:** reopen the old file in the original browser profile, export a backup, then restore it at the new location.

</details>

## Development

Plain HTML, CSS and JavaScript, plus optional Python standard-library helpers. Edit the source and reload; there is no frontend build step.

Run the checks with Node.js and Python:

```sh
npm test
python -m unittest discover -s tests -p "test_*.py"
```

For consistent source formatting, install the pinned development tools once with `npm ci`,
then use `npm run format` to format HTML, CSS, JavaScript and documentation.
Run `npm run format:check` to check formatting without changing files.
Prettier is a development-only dependency; the homepage still runs without Node.js or a build step.

On Windows, test installation and updates in a disposable folder without opening a browser:

```powershell
powershell -NoProfile -File tests/check-install.ps1 -TestRoot "$env:TEMP\Daybreak-install-test"
```

Checks cover saved-state migration, theme contrast and animation cleanup, command-menu behaviour, GitHub account changes, protected connection endpoints, and installer data preservation. Visual appearance and interactive account consent also need manual verification.

## Licence

[MIT](LICENSE). Make yourself at home.
