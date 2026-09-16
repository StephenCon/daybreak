(() => {
  const make = (tag, cls, text) => {
    const node = document.createElement(tag);
    node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  window.DAYBREAK_RENDER_ISSUES = (body) => {
    const data = window.DAYBREAK_GITHUB || { issues: [] };
    const issues = Array.isArray(data.issues) ? data.issues : [];
    const date = Date.parse(data.updatedAt);
    const saved = Number.isFinite(date);
    const fresh = saved && Date.now() - date < 420000;
    const summary = make('div', 'agenda-summary');
    summary.append(
      make('span', '', 'Open issues you created'),
      make('span', '', saved ? `${data.total ?? issues.length} open` : ''),
    );
    body.append(summary);
    const list = make('div', 'github-list');
    list.setAttribute('aria-label', 'Your open GitHub issues');
    issues.forEach((issue) => {
      let destination;
      try {
        destination = new URL(issue.url);
      } catch {
        return;
      }
      if (
        destination.origin !== 'https://github.com' ||
        !/^\/[^/]+\/[^/]+\/issues\/\d+$/.test(destination.pathname)
      )
        return;
      const row = make('a', 'github-issue');
      row.href = destination.href;
      row.append(make('span', 'github-dot', '◉'));
      const copy = make('span', 'github-copy');
      copy.append(
        make('span', 'event-title', issue.title),
        make('span', 'github-repo', `${issue.repository} · #${issue.number}`),
      );
      const labels = make('span', 'github-labels');
      (Array.isArray(issue.labels) ? issue.labels : [])
        .slice(0, 2)
        .forEach((label) => labels.append(make('span', 'github-label', label)));
      copy.append(labels);
      row.append(copy);
      list.append(row);
    });
    if (!issues.length)
      list.append(
        make(
          'p',
          'agenda-empty',
          saved
            ? 'A clear list. You have no open issues.'
            : 'Issues are unavailable right now. The local helper will try again.',
        ),
      );
    body.append(list);
    const footer = make('div', 'agenda-foot');
    let status = !saved
      ? 'Waiting for GitHub'
      : data.status !== 'connected'
        ? 'Sync unavailable · saved issues'
        : !fresh
          ? 'Sync paused · saved issues'
          : 'Live · updated ' +
            new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    if (saved && data.total > issues.length) status += ` · latest ${issues.length}`;
    footer.append(make('span', 'agenda-sync', status));
    const open = make('a', 'calendar-open', 'View all on GitHub ↗');
    const author = /^[a-z\d-]+$/i.test(data.login || '') ? data.login : '@me';
    open.href =
      'https://github.com/issues?q=' + encodeURIComponent('is:issue is:open author:' + author);
    footer.append(open);
    body.append(footer);
  };
  let loading = false;
  function refresh() {
    if (loading || document.hidden) return;
    loading = true;
    const script = document.createElement('script');
    script.src = 'github-data.js?t=' + Date.now();
    script.onload = script.onerror = () => {
      loading = false;
      script.remove();
      const body = document.querySelector('[data-widget=github] .tile-body');
      if (!body) return;
      const scroll = body.querySelector('.github-list')?.scrollTop || 0;
      // Avoid removing a keyboard user's focused issue link during an update.
      if (body.contains(document.activeElement)) return;
      body.replaceChildren();
      window.DAYBREAK_RENDER_ISSUES(body);
      body.querySelector('.github-list').scrollTop = scroll;
    };
    document.head.append(script);
  }
  setInterval(refresh, 30000);
  document.addEventListener('visibilitychange', refresh);
})();
