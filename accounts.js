(() => {
  const dialog = document.createElement('dialog');
  dialog.id = 'accounts';
  dialog.setAttribute('aria-labelledby', 'accounts-title');
  dialog.innerHTML = /* HTML */ `<form method="dialog" class="dialog-head">
      <h2 id="accounts-title">Connect accounts</h2>
      <button aria-label="Close accounts">×</button>
    </form>
    <div class="dialog-body">
      <p>Bring your schedule and open issues into Daybreak. Your accounts stay on this PC.</p>
      <section class="account-card">
        <h3>1. Start your local helper</h3>
        <p>
          Open <strong>Connect accounts.cmd</strong> in your Daybreak folder, or use the
          <strong>Daybreak Accounts</strong> desktop shortcut. The helper opens a connection page in
          your browser.
        </p>
        <p>
          First time? Install
          <a href="https://www.python.org/downloads/windows/" target="_blank" rel="noopener"
            >Python 3</a
          >
          with its launcher, then run Connect accounts again.
        </p>
        <a class="button" href="http://127.0.0.1:18743/" target="_blank" rel="noopener"
          >Open connection page ↗</a
        >
        <p class="settings-detail">
          If the page cannot be reached, the helper is not running. A local webpage cannot start
          programs itself.
        </p>
      </section>
      <section class="account-card">
        <h3>Google Calendar</h3>
        <p class="account-status" id="account-google" role="status"></p>
        <p>
          On the connection page, follow the Google setup guide, paste your Desktop OAuth client
          JSON, and choose <strong>Sign in with Google</strong>. Each person needs their own Google
          Cloud project.
        </p>
      </section>
      <section class="account-card">
        <h3>GitHub issues</h3>
        <p class="account-status" id="account-github" role="status"></p>
        <p>
          Install <a href="https://cli.github.com/" target="_blank" rel="noopener">GitHub CLI</a>,
          then choose <strong>Sign in with GitHub</strong> on the connection page. A terminal guides
          you through browser sign-in. Daybreak reads open issues you created.
        </p>
      </section>
      <section class="account-card">
        <h3>Spotify</h3>
        <p class="account-status" id="account-spotify" role="status"></p>
        <p>
          On the connection page, follow the Spotify app setup guide, enter your
          <strong>Client ID</strong>, and choose <strong>Sign in with Spotify</strong>. Requires
          Premium and an app with your account allowlisted. Open Spotify and play something first;
          Daybreak controls that active player.
        </p>
      </section>
      <p class="settings-detail">
        Statuses below come from the last local sync. Leave the helper running for automatic
        updates. No account tokens are stored in this page.
      </p>
    </div>`;
  document.body.append(dialog);
  const style = document.createElement('style');
  style.textContent = `
#accounts {
  width: min(640px, calc(100% - 32px));
  max-height: 85vh;
}
#accounts .dialog-body {
  padding-top: 8px;
}
.account-card {
  margin-top: 16px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--soft);
}
#accounts .account-card p {
  margin: 9px 0;
}
.account-status {
  font-weight: 600;
  color: var(--accent) !important;
}
#accounts a:not(.button) {
  text-decoration: underline;
  text-underline-offset: 3px;
}
`;
  document.head.append(style);
  function status(data, maxAge) {
    const stamp = Date.parse(data?.updatedAt);
    return Number.isFinite(stamp) && Date.now() - stamp < maxAge && Date.now() >= stamp;
  }
  function render() {
    const g = window.DAYBREAK_CALENDAR,
      h = window.DAYBREAK_GITHUB;
    document.querySelector('#account-google').textContent =
      g?.status === 'reconnect'
        ? 'Sign-in needs renewing'
        : g?.status === 'disconnected' || !g?.updatedAt
          ? 'Not connected yet'
          : g?.status === 'connected' && status(g, 150000)
            ? 'Connected · recent sync'
            : 'Saved calendar · check connection page';
    document.querySelector('#account-github').textContent =
      h?.status === 'connected' && status(h, 420000)
        ? 'Connected' + (h.login ? ' · ' + h.login : '')
        : h?.updatedAt
          ? 'Saved issues · check connection page'
          : 'Not connected yet';
    const s = window.DAYBREAK_SPOTIFY,
      age = Date.now() - Number(s?.checkedAt);
    document.querySelector('#account-spotify').textContent =
      s?.status === 'reconnect'
        ? 'Sign-in needs renewing'
        : ['connected', 'idle'].includes(s?.status) && age >= 0 && age < 40000
          ? 'Connected · ' + (s.status === 'idle' ? 'waiting for playback' : 'recent sync')
          : s?.status === 'disconnected' || !s
            ? 'Not connected yet'
            : 'Check the connection page';
  }
  window.DAYBREAK_OPEN_ACCOUNTS = () => {
    document.querySelector('#settings')?.close();
    render();
    if (!dialog.open) dialog.showModal();
  };
  document.querySelector('#accounts-open').onclick = window.DAYBREAK_OPEN_ACCOUNTS;
  document.addEventListener('daybreak-calendar-update', () => {
    if (dialog.open) render();
  });
  setInterval(() => {
    if (dialog.open) render();
  }, 5000);
})();
