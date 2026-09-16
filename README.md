# Daybreak

A quiet place to start your day. A personal homepage that runs from a folder on your computer: no build step, account or hosted backend required for the core widgets.

## Get started

1. Select **Code → Download ZIP** on GitHub, then extract it to a permanent folder. Or clone this repository.
2. On Windows, double-click **Open Daybreak.cmd**. It creates empty, ignored integration caches and opens the homepage in your default browser. If needed, open `index.html` in Chrome afterwards.
3. Add your links, choose your weather city, and make yourself at home.

On other systems, copy `templates/calendar-data.js` and `templates/github-data.js` into the root folder once, then open `index.html`. The core homepage is browser-based; the optional Google Calendar helper currently requires Windows.

Keep the folder at a stable path. Browser storage for local files varies by browser; use **Settings → Save backup** before moving the folder or clearing browser data. Backups include tasks, notes, links, layout, theme and timer state. Weather preferences and integration caches are separate.

## What's inside

- Google, DuckDuckGo and YouTube search.
- Editable favourite links, tasks, autosaving notes, a clock and a timestamp-based focus timer.
- Optional local weather, Google Calendar events and open GitHub issues you created.
- Drag and resize tiles in **Edit layout**. **Done** packs them together; keyboard controls and hide/show options are included.
- **Ctrl+K** quick actions: search favourites, type `task buy milk`, `focus 25`, or `theme`.
- Nine themes: Daybreak, Fireside, Nord, Gruvbox, Rose Pine, Tokyo Night, Hacker, Retro and Cyberpunk. Daybreak is the default; light/dark follows your system unless overridden.
- Dramatic theme transitions with reduced-motion support. Fireside adds a cosy ember reveal.
- Plain HTML, CSS and JavaScript, with local system-font stacks. No frontend dependencies or build tools.

## Make it your Chrome homepage

Open `index.html` in Chrome and copy its `file:///.../index.html` address.

- **Home button:** Settings → Appearance → Show Home button → enter the custom address.
- **Startup:** Settings → On startup → Open a specific page or set of pages → Add a new page → paste the same address.

These are separate settings. This does not replace Chrome's New Tab page. See [Chrome's setup guide](https://support.google.com/chrome/answer/95314?hl=en).

## Optional integrations

### Weather

Choose a city in the widget. Forecasts and city search use [Open-Meteo](https://open-meteo.com/); no API key is needed. Requests begin after you select a location. A saved forecast remains available offline.

### Google Calendar

See [Calendar setup](CALENDAR-SETUP.md). Each person connects their own account using their own Google Cloud desktop OAuth client. The Windows helper uses Python's standard library and stores credentials encrypted for that Windows account.

### GitHub issues

Install Python 3 and the [GitHub CLI](https://cli.github.com/), then run `gh auth login`. Daybreak uses that CLI account automatically; it reads open issues you authored, including private issues your login can access.

Run `python github-sync.py` for a one-time refresh, or run **Start Calendar.cmd** to keep the shared helper refreshing GitHub every five minutes. Google sign-in is optional for GitHub: you can close the calendar connection page. The homepage picks up refreshed files every 30 seconds. Only one helper folder can use port 18743 at a time.

## Your data

The core homepage saves data in your browser. Live integrations write private caches beside the app. The repository contains empty templates only; generated caches, OAuth files and backups are excluded by `.gitignore`.

Do not force-add `calendar-data.js`, `github-data.js`, `.calendar-credentials`, downloaded OAuth JSON or personal backups. GitHub issue and calendar caches contain readable private content even though OAuth credentials are encrypted. Share the GitHub download rather than zipping your used installation. This app is designed for local use, not deployment with personal caches to a public web host.

## Development

Edit the source files and reload the page. Node.js is needed only for checks:

```sh
npm test
python -m unittest discover -s tests -p "test_*.py"
```

Checks cover saved-state migration, palettes/contrast, transition cleanup, command-menu behavior, and GitHub account changes. Browser appearance and integration sign-in still need manual checks. The development environment could not visually inspect the final public package.

Licensed under [MIT](LICENSE).
