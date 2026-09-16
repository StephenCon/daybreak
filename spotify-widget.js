(() => {
  const views = new WeakMap();
  let loading = false,
    busy = false,
    message = '',
    pingBusy = false;
  const make = (tag, cls, text) => {
    const e = document.createElement(tag);
    e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const safeURL = (value, art = false) => {
    try {
      const u = new URL(value);
      return u.protocol === 'https:' &&
        !u.username &&
        u.hostname === (art ? 'i.scdn.co' : 'open.spotify.com')
        ? u.href
        : '';
    } catch {
      return '';
    }
  };
  const time = (ms) => {
    const seconds = Math.floor(Math.max(0, ms) / 1000);
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  };
  const state = () => {
    const d = window.DAYBREAK_SPOTIFY || { status: 'disconnected' },
      age = Date.now() - Number(d.checkedAt);
    return { d, fresh: Number.isFinite(age) && age >= 0 && age < 40000 };
  };
  function paint(body) {
    let v = views.get(body);
    if (!v) {
      const top = make('div', 'spotify-track'),
        art = make('img', 'spotify-art');
      art.alt = 'Album artwork';
      art.referrerPolicy = 'no-referrer';
      art.width = 88;
      art.height = 88;
      art.onerror = () => {
        art.hidden = true;
      };
      const copy = make('div', 'spotify-copy'),
        label = make('span', 'spotify-label', 'SPOTIFY'),
        title = make('a', 'spotify-title'),
        artist = make('p', 'spotify-artist'),
        status = make('p', 'spotify-status');
      title.target = '_blank';
      title.rel = 'noopener';
      copy.append(label, title, artist, status);
      top.append(art, copy);
      const progress = make('progress', 'spotify-progress');
      progress.setAttribute('aria-label', 'Playback progress');
      progress.max = 1;
      progress.value = 0;
      const timing = make('div', 'spotify-timing'),
        elapsed = make('span', ''),
        duration = make('span', '');
      timing.append(elapsed, duration);
      const controls = make('div', 'spotify-controls'),
        buttons = {};
      for (const [action, text, labelText] of [
        ['previous', '⏮', 'Previous track'],
        ['toggle', '▶', 'Play'],
        ['next', '⏭', 'Next track'],
      ]) {
        const b = make('button', action === 'toggle' ? 'spotify-play' : '', text);
        b.type = 'button';
        b.setAttribute('aria-label', labelText);
        b.onclick = () =>
          control(action === 'toggle' ? (state().d.playing ? 'pause' : 'play') : action);
        buttons[action] = b;
        controls.append(b);
      }
      const open = make('a', 'text-button', 'Open Spotify ↗');
      open.href = 'https://open.spotify.com/';
      open.target = '_blank';
      open.rel = 'noopener';
      const connect = make('button', 'text-button', 'Connect');
      connect.type = 'button';
      connect.onclick = () => window.DAYBREAK_OPEN_ACCOUNTS?.();
      controls.append(open, connect);
      const notice = make('p', 'spotify-notice');
      notice.setAttribute('role', 'status');
      body.append(top, progress, timing, controls, notice);
      v = { art, title, artist, status, progress, elapsed, duration, buttons, connect, notice };
      views.set(body, v);
    }
    const { d, fresh } = state(),
      connected = d.status === 'connected',
      current = connected && fresh;
    const notices = {
      disconnected: 'Connect Spotify to bring your music here.',
      connecting: 'Connecting to Spotify…',
      idle: 'Open Spotify and start playing on a device.',
      reconnect: 'Your Spotify sign-in needs renewing.',
      offline: 'Spotify is unavailable. Retrying…',
      restricted: 'Check Premium and your Spotify app allowlist.',
      'rate-limited': 'Spotify asked us to wait. Retrying automatically.',
    };
    v.title.textContent = connected ? d.title || 'Spotify playback' : 'A soundtrack for your day';
    v.title.href = safeURL(d.url) || 'https://open.spotify.com/';
    v.artist.textContent = connected ? d.artist || '' : '';
    const art = safeURL(d.artwork, true);
    v.art.hidden = !connected || !art;
    if (art && v.art.getAttribute('src') !== art) v.art.src = art;
    if (!art) v.art.removeAttribute('src');
    v.status.textContent = connected
      ? fresh
        ? (d.playing ? 'Playing' : 'Paused') + ' · ' + (d.device || 'Spotify')
        : 'Helper paused · saved track'
      : d.checkedAt && !fresh
        ? 'Start the local helper to reconnect.'
        : notices[d.status] || 'Open Connect accounts to set up Spotify.';
    const total = Number.isFinite(d.duration) ? Math.max(0, d.duration) : 0,
      base = Number.isFinite(d.progress) ? Math.max(0, d.progress) : 0;
    const position = Math.min(
      total,
      base + (current && d.playing ? Math.max(0, Date.now() - d.checkedAt) : 0),
    );
    v.progress.max = total || 1;
    v.progress.value = position;
    v.progress.hidden = !connected;
    v.elapsed.textContent = connected ? time(position) : '';
    v.duration.textContent = connected ? time(total) : '';
    const toggle = d.playing ? 'pause' : 'play';
    v.buttons.toggle.textContent = d.playing ? 'Ⅱ' : '▶';
    v.buttons.toggle.setAttribute('aria-label', d.playing ? 'Pause' : 'Play');
    for (const [action, b] of Object.entries(v.buttons))
      b.disabled = busy || !current || !d.allowed?.[action === 'toggle' ? toggle : action];
    v.connect.textContent = connected ? 'Account' : 'Connect';
    v.notice.textContent = message;
  }
  function repaint() {
    const body = document.querySelector('[data-widget=spotify] .tile-body');
    if (body) paint(body);
  }
  async function control(action) {
    const { d, fresh } = state();
    if (busy || !fresh || !d.controlKey) return;
    busy = true;
    message = '';
    repaint();
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('http://127.0.0.1:18743/spotify/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Daybreak-Spotify': d.controlKey },
        body: JSON.stringify({ action }),
        signal: controller.signal,
        credentials: 'omit',
        cache: 'no-store',
      });
      const result = await response.json();
      message = response.ok ? '' : result.message || 'Playback command failed.';
      if (response.ok) setTimeout(refresh, 1000);
    } catch {
      message =
        'Could not confirm playback. Check Spotify, start Daybreak Accounts, and allow local network access if Chrome asks.';
    } finally {
      clearTimeout(timeout);
      busy = false;
      repaint();
    }
  }
  function refresh() {
    if (loading || document.hidden) return;
    loading = true;
    const script = document.createElement('script');
    script.src = 'spotify-data.js?t=' + Date.now();
    const done = () => {
      loading = false;
      script.remove();
      repaint();
    };
    script.onload = done;
    script.onerror = done;
    document.head.append(script);
  }
  async function heartbeat() {
    const { d } = state();
    if (
      pingBusy ||
      document.hidden ||
      !document.querySelector('[data-widget=spotify]') ||
      !d.controlKey
    )
      return;
    pingBusy = true;
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 5000);
    try {
      await fetch('http://127.0.0.1:18743/spotify/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Daybreak-Spotify': d.controlKey },
        body: JSON.stringify({ action: 'poll' }),
        credentials: 'omit',
        signal: controller.signal,
      });
    } catch {
      /* Stale-state handling disables controls when the local helper cannot be reached. */
    } finally {
      clearTimeout(timeout);
      pingBusy = false;
    }
  }
  window.DAYBREAK_RENDER_SPOTIFY = paint;
  setInterval(() => {
    if (!document.hidden) repaint();
  }, 1000);
  setInterval(refresh, 5000);
  setInterval(heartbeat, 10000);
  document.addEventListener('visibilitychange', () => {
    refresh();
    heartbeat();
  });
})();
