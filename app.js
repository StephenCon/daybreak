(() => {
  'use strict';
  const KEY = 'neon-desktop.v1',
    IDS = [
      'greeting',
      'spotify',
      'weather',
      'search',
      'links',
      'clock',
      'agenda',
      'tasks',
      'notes',
      'github',
      'timer',
    ];
  const titles = {
    greeting: 'Greeting',
    weather: 'Weather',
    search: 'Search',
    links: 'Your favourites',
    clock: 'Here & now',
    tasks: 'A little intention',
    notes: 'A place for your thoughts',
    timer: 'Focus time',
    agenda: 'On your calendar',
    github: 'On your GitHub',
    spotify: 'Now playing',
  };
  const symbols = {
    greeting: '☀',
    weather: '☁',
    search: '⌘',
    links: '↗',
    clock: '◷',
    tasks: '☷',
    notes: '≡',
    timer: '◴',
    agenda: '▦',
    github: '◉',
    spotify: '♫',
  };
  const $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  const uid = () => crypto.randomUUID();
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const defaults = () => ({
    version: 1,
    links: [
      ['Google', 'https://www.google.com/'],
      ['YouTube', 'https://www.youtube.com/'],
      ['Gmail', 'https://mail.google.com/'],
      ['GitHub', 'https://github.com/'],
    ].map(([name, url]) => ({ id: uid(), name, url })),
    tasks: [],
    notes: '',
    order: [...IDS],
    hidden: [],
    provider: 'google',
    theme: 'system',
    palette: 'daybreak',
    themeRevision: 2,
    scanlines: false,
    motion: false,
    timer: { duration: 1500, remaining: 1500, end: null, mode: 'focus', completed: false },
  });
  function validURL(s) {
    try {
      return ['https:', 'http:'].includes(new URL(s).protocol);
    } catch {
      return false;
    }
  }
  function validate(s) {
    let expandPage = false;
    if (
      s &&
      Array.isArray(s.order) &&
      s.order.length === 6 &&
      !s.order.includes('agenda') &&
      new Set(s.order).size === 6 &&
      s.order.every((id) => IDS.includes(id))
    ) {
      s = { ...s, order: [...s.order] };
      s.order.splice(3, 0, 'agenda');
    }
    const str = (v, n) => typeof v === 'string' && v.length <= n;
    if (
      s &&
      Array.isArray(s.order) &&
      s.order.length === 7 &&
      !s.order.includes('github') &&
      new Set(s.order).size === 7 &&
      s.order.every((id) => IDS.includes(id))
    ) {
      s = { ...s, order: [...s.order] };
      s.order.splice(s.order.indexOf('timer'), 0, 'github');
    }
    if (
      s &&
      Array.isArray(s.order) &&
      s.order.length === 8 &&
      !s.order.includes('spotify') &&
      new Set(s.order).size === 8 &&
      s.order.every((id) => IDS.includes(id))
    ) {
      s = { ...s, order: [...s.order] };
      s.order.splice(s.order.indexOf('timer'), 0, 'spotify');
    }
    if (
      s &&
      Array.isArray(s.order) &&
      s.order.length === 9 &&
      !s.order.includes('greeting') &&
      !s.order.includes('weather') &&
      new Set(s.order).size === 9 &&
      s.order.every((id) => IDS.includes(id))
    ) {
      s = {
        ...s,
        order: ['greeting', 'spotify', 'weather', ...s.order.filter((id) => id !== 'spotify')],
      };
      expandPage = true;
    }
    if (
      !s ||
      s.version !== 1 ||
      !Array.isArray(s.links) ||
      s.links.length > 500 ||
      !s.links.every(
        (l) =>
          l &&
          str(l.id, 100) &&
          str(l.name, 60) &&
          l.name.trim() &&
          str(l.url, 4096) &&
          validURL(l.url),
      ) ||
      new Set(s.links.map((l) => l.id)).size !== s.links.length
    )
      throw Error('Invalid links or backup version.');
    if (
      !Array.isArray(s.tasks) ||
      s.tasks.length > 10000 ||
      !s.tasks.every(
        (t) =>
          t && str(t.id, 100) && str(t.text, 500) && t.text.trim() && typeof t.done === 'boolean',
      ) ||
      new Set(s.tasks.map((t) => t.id)).size !== s.tasks.length ||
      !str(s.notes, 1000000)
    )
      throw Error('Invalid notes or tasks.');
    if (
      !Array.isArray(s.order) ||
      s.order.length !== IDS.length ||
      new Set(s.order).size !== IDS.length ||
      !s.order.every((id) => IDS.includes(id)) ||
      !Array.isArray(s.hidden) ||
      new Set(s.hidden).size !== s.hidden.length ||
      !s.hidden.every((id) => IDS.includes(id))
    )
      throw Error('Invalid desktop layout.');
    if (
      (s.theme !== undefined && !['system', 'light', 'evening'].includes(s.theme)) ||
      !['google', 'duckduckgo', 'youtube'].includes(s.provider) ||
      typeof s.scanlines !== 'boolean' ||
      typeof s.motion !== 'boolean'
    )
      throw Error('Invalid preferences.');
    if (
      s.palette !== undefined &&
      (typeof s.palette !== 'string' || !Object.hasOwn(window.DAYBREAK_THEMES.themes, s.palette))
    )
      throw Error('Invalid colour palette.');
    const t = s.timer;
    if (
      !t ||
      !Number.isInteger(t.duration) ||
      t.duration < 60 ||
      t.duration > 10800 ||
      !Number.isFinite(t.remaining) ||
      t.remaining < 0 ||
      t.remaining > 10800 ||
      !(
        t.end === null ||
        (Number.isFinite(t.end) && t.end > 0 && t.end <= Date.now() + 10800000)
      ) ||
      !['focus', 'break'].includes(t.mode) ||
      typeof t.completed !== 'boolean'
    )
      throw Error('Invalid timer.');
    return {
      version: 1,
      layouts: window.DAYBREAK_LAYOUT.expandPage(
        window.DAYBREAK_LAYOUT.validate(s.layouts, IDS, expandPage ? 3000 : 10000),
        expandPage,
      ),
      links: s.links.map(({ id, name, url }) => ({ id, name, url })),
      tasks: s.tasks.map(({ id, text, done }) => ({ id, text, done })),
      notes: s.notes,
      order: [...s.order],
      hidden: [...s.hidden],
      provider: s.provider,
      theme: s.theme || 'system',
      palette: s.palette || 'daybreak',
      themeRevision: s.themeRevision === 2 ? 2 : 0,
      scanlines: s.scanlines,
      motion: s.motion,
      timer: {
        duration: t.duration,
        remaining: t.remaining,
        end: t.end,
        mode: t.mode,
        completed: t.completed,
      },
    };
  }
  let state = defaults(),
    editing = false,
    linkEditing = false,
    editingLink = null,
    dragId = null,
    toastTimeout,
    agendaMinute = -1,
    storageOK = true,
    corrupt = false;
  function warning(message) {
    $('#storage-warning').hidden = false;
    $('#storage-warning').textContent = message;
    $('#storage-label').textContent = 'EXPORT TO KEEP YOUR CHANGES';
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        state = validate(JSON.parse(raw));
      } catch {
        corrupt = true;
        warning(
          'Saved data could not be read. It has been left untouched. Import a valid backup to recover, or export this desktop before clearing the damaged data.',
        );
      }
    }
    const probe = KEY + '.probe';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
  } catch {
    storageOK = false;
    warning(
      'This browser cannot save changes here. You can still use the desktop; export a backup before closing it.',
    );
  }
  function save() {
    if (!storageOK || corrupt) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch {
      storageOK = false;
      warning('Changes could not be saved. Export a backup before closing this page.');
      return false;
    }
  }
  // Adopt system appearance once; retain any later explicit override.
  if (state.themeRevision !== 2) {
    state.theme = 'system';
    state.themeRevision = 2;
    save();
  }
  function toast(message) {
    clearTimeout(toastTimeout);
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    toastTimeout = setTimeout(() => ($('#toast').hidden = true), 5000);
  }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function btn(text, action, cls = '', label) {
    const b = el('button', cls, text);
    b.type = 'button';
    if (label) b.setAttribute('aria-label', label);
    b.onclick = action;
    return b;
  }
  function applyPrefs() {
    document.documentElement.dataset.palette = state.palette || 'daybreak';
    const dark = state.theme === 'evening' || (state.theme === 'system' && systemTheme.matches);
    document.documentElement.dataset.theme = dark ? 'evening' : 'light';
    document.body.classList.toggle('evening', dark);
    $('#theme-mode').value = state.theme;
    const label = { system: 'System', light: 'Light', evening: 'Dark' }[state.theme];
    $('#theme-toggle').setAttribute('aria-label', 'Appearance: ' + label + '. Open theme settings');
    $('#theme-toggle').title = 'Appearance: ' + label;
    document.body.classList.toggle('no-motion', !state.motion);
    $('#setting-provider').value = state.provider;
    $('#motion').checked = state.motion;
  }
  systemTheme.addEventListener('change', () => {
    if (state.theme === 'system') applyPrefs();
  });
  const persistentWidgets = { greeting: $('#greeting-content'), weather: $('#weather-widget') };
  function render() {
    const desktop = $('#desktop');
    // Keep the weather instance and its event listeners alive across layout edits.
    $('#widget-parking').append(...Object.values(persistentWidgets));
    desktop.replaceChildren();
    desktop.classList.remove('custom-grid');
    desktop.style.minHeight = '';
    document.body.classList.toggle('editing', editing);
    $('#layout-tools').hidden = !editing;
    $('#edit-layout').textContent = editing ? 'Done' : 'Edit layout';
    $('#edit-layout').setAttribute('aria-pressed', String(editing));
    $('#visibility').replaceChildren();
    IDS.forEach((id) => {
      const label = el('label');
      const cb = el('input');
      cb.type = 'checkbox';
      cb.checked = !state.hidden.includes(id);
      cb.onchange = () => {
        state.hidden = cb.checked ? state.hidden.filter((x) => x !== id) : [...state.hidden, id];
        save();
        render();
      };
      label.append(cb, document.createTextNode(titles[id]));
      $('#visibility').append(label);
    });
    state.order
      .filter((id) => !state.hidden.includes(id))
      .forEach((id) => {
        const tile = el('section', 'tile');
        tile.dataset.widget = id;
        tile.setAttribute('aria-label', titles[id]);
        const head = el('div', 'tile-head');
        head.draggable = editing;
        head.append(
          el('span', 'tile-symbol', symbols[id]),
          el('h2', '', titles[id]),
          el('span', 'tile-code', String(IDS.indexOf(id) + 1).padStart(2, '0')),
        );
        const controls = el('div', 'edit-controls');
        const pos = state.order.indexOf(id);
        const up = btn('←', () => move(id, -1), '', 'Move ' + titles[id] + ' earlier');
        up.disabled = pos === 0;
        const down = btn('→', () => move(id, 1), '', 'Move ' + titles[id] + ' later');
        down.disabled = pos === IDS.length - 1;
        controls.append(
          up,
          down,
          btn(
            '×',
            () => {
              state.hidden.push(id);
              save();
              render();
            },
            '',
            'Hide ' + titles[id],
          ),
        );
        head.append(controls);
        head.ondragstart = (e) => {
          dragId = id;
          e.dataTransfer.setData('text/plain', id);
          e.dataTransfer.effectAllowed = 'move';
        };
        head.ondragend = () => {
          $$('.drag-over').forEach((e) => e.classList.remove('drag-over'));
          dragId = null;
        };
        tile.ondragover = (e) => {
          if (editing && dragId && dragId !== id) {
            e.preventDefault();
            tile.classList.add('drag-over');
          }
        };
        tile.ondragleave = () => tile.classList.remove('drag-over');
        tile.ondrop = (e) => {
          e.preventDefault();
          if (!editing || !dragId || dragId === id) return;
          const from = state.order.indexOf(dragId),
            to = state.order.indexOf(id);
          state.order.splice(from, 1);
          state.order.splice(to, 0, dragId);
          save();
          render();
        };
        const body = el('div', 'tile-body');
        tile.append(head, body);
        desktop.append(tile);
        renderers[id](body);
      });
    applyPrefs();
    window.DAYBREAK_LAYOUT.attach({ state, editing, save, announce: toast });
    tick();
  }
  function move(id, delta) {
    const p = state.order.indexOf(id),
      q = p + delta;
    if (q < 0 || q >= IDS.length) return;
    [state.order[p], state.order[q]] = [state.order[q], state.order[p]];
    save();
    render();
    const target = $(`[data-widget="${id}"] .edit-controls button`);
    target?.focus();
  }
  const renderers = {
    greeting(body) {
      body.append(persistentWidgets.greeting);
    },
    weather(body) {
      body.append(persistentWidgets.weather);
    },
    spotify(body) {
      window.DAYBREAK_RENDER_SPOTIFY(body);
    },
    github(body) {
      window.DAYBREAK_RENDER_ISSUES(body);
    },
    agenda(body) {
      const source = window.DAYBREAK_CALENDAR;
      const data = source
        ? { ...source, timezone: source.timezone === 'local' ? undefined : source.timezone }
        : null;
      const link = el('a', 'calendar-open', 'Open Google Calendar ↗');
      link.href = 'https://calendar.google.com/calendar/u/0/r/agenda';
      const connect = el('a', 'calendar-open', 'Calendar connection ↗');
      connect.href = 'http://127.0.0.1:18743/';
      connect.target = '_blank';
      connect.rel = 'noopener';
      if (!data || !Array.isArray(data.events) || data.status === 'disconnected') {
        body.append(
          el(
            'p',
            'agenda-empty',
            'Run Start Calendar.cmd in your homepage folder, then connect with Google.',
          ),
          connect,
        );
        return;
      }
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: data.timezone || undefined,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
      const isToday = today === data.date;
      const note = el(
        'div',
        'agenda-summary',
        isToday ? "Today's schedule" : 'Saved schedule · ' + data.date,
      );
      const tag = el(
        'span',
        'agenda-count',
        data.events.length + (data.events.length === 1 ? ' event' : ' events'),
      );
      note.append(tag);
      body.append(note);
      const list = el('div', 'agenda-list');
      list.setAttribute('aria-label', 'Scheduled events');
      const events = [...data.events]
        .filter(
          (e) =>
            e &&
            typeof e.title === 'string' &&
            Number.isFinite(Date.parse(e.start)) &&
            Number.isFinite(Date.parse(e.end)),
        )
        .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
      const next = events.find((e) => Date.parse(e.end) > Date.now());
      events.forEach((e) => {
        const row = el('a', 'agenda-event');
        row.href = validURL(e.url) ? e.url : link.href;
        row.dataset.end = e.end;
        row.dataset.start = e.start;
        if (Date.parse(e.end) < Date.now()) row.classList.add('past');
        if (isToday && e === next) row.classList.add('up-next');
        const time = el(
          'span',
          'event-time',
          e.start.length === 10
            ? 'All day'
            : new Date(e.start).toLocaleTimeString('en-GB', {
                timeZone: data.timezone,
                hour: '2-digit',
                minute: '2-digit',
              }),
        );
        const text = el('span', 'event-copy');
        text.append(el('span', 'event-title', e.title));
        if (e === next && isToday)
          text.append(
            el(
              'span',
              'event-next',
              Date.parse(e.start) <= Date.now() ? 'Happening now' : 'Up next',
            ),
          );
        row.append(time, text);
        list.append(row);
      });
      if (!events.length)
        list.append(
          el(
            'p',
            'agenda-empty',
            isToday
              ? 'A little breathing room. No events today.'
              : 'No events in this saved schedule.',
          ),
        );
      body.append(list);
      const foot = el('div', 'agenda-foot');
      const stamp = new Date(data.updatedAt);
      const updated = Number.isFinite(stamp.getTime())
        ? stamp.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: data.timezone,
          })
        : 'unknown';
      let status = isToday ? 'Saved snapshot · ' + updated : 'Saved schedule · out of date';
      if (data.mode === 'live')
        status =
          data.status === 'reconnect'
            ? 'Sign in again · saved events'
            : data.status === 'offline'
              ? 'Offline · saved events'
              : data.status === 'error'
                ? 'Sync unavailable · saved events'
                : !isToday || Date.now() - stamp.getTime() > 150000
                  ? 'Sync paused · saved events'
                  : 'Live · updated ' + updated;
      foot.append(el('span', 'agenda-sync', status), link);
      body.append(foot);
      const connection = el('div', 'widget-bottom');
      connection.append(
        connect,
        btn(
          'Refresh',
          () => document.dispatchEvent(new Event('daybreak-calendar-refresh')),
          'text-button',
          'Reload calendar from local helper',
        ),
      );
      body.append(connection);
    },
    search(body) {
      const form = el('form', 'search-form');
      const input = el('input');
      input.id = 'search-query';
      input.type = 'search';
      input.placeholder = 'Search the web, or follow a thought…';
      input.setAttribute('aria-label', 'Search query');
      input.required = true;
      const provider = el('select');
      provider.setAttribute('aria-label', 'Search engine');
      [
        ['google', 'Google'],
        ['duckduckgo', 'DuckDuckGo'],
        ['youtube', 'YouTube'],
      ].forEach(([v, t]) => {
        const o = el('option', '', t);
        o.value = v;
        provider.append(o);
      });
      provider.value = state.provider;
      provider.onchange = () => {
        state.provider = provider.value;
        save();
        applyPrefs();
      };
      const go = el('button', '', 'Search ↗');
      go.type = 'submit';
      form.append(el('span', 'search-prompt', '⌕'), input, provider, go);
      form.onsubmit = (e) => {
        e.preventDefault();
        const q = input.value.trim();
        if (!q) return;
        const base = {
          google: 'https://www.google.com/search?q=',
          duckduckgo: 'https://duckduckgo.com/?q=',
          youtube: 'https://www.youtube.com/results?search_query=',
        };
        location.href = base[provider.value] + encodeURIComponent(q);
      };
      body.append(form);
    },
    links(body) {
      const grid = el('div', 'links-grid');
      state.links.forEach((l, i) => {
        const card = el('div', 'link-card'),
          a = el('a');
        a.href = l.url;
        const icon =
          l.name === 'YouTube'
            ? '▷'
            : l.name === 'Gmail'
              ? '✉'
              : l.name === 'GitHub'
                ? '>_'
                : l.name[0].toUpperCase();
        a.append(el('span', 'link-icon', icon), el('span', 'link-label', l.name));
        card.append(a);
        if (linkEditing) {
          const c = el('div', 'link-edit');
          const up = btn(
            '←',
            () => {
              [state.links[i - 1], state.links[i]] = [state.links[i], state.links[i - 1]];
              save();
              render();
            },
            '',
            'Move ' + l.name + ' earlier',
          );
          up.disabled = i === 0;
          const down = btn(
            '→',
            () => {
              [state.links[i + 1], state.links[i]] = [state.links[i], state.links[i + 1]];
              save();
              render();
            },
            '',
            'Move ' + l.name + ' later',
          );
          down.disabled = i === state.links.length - 1;
          c.append(
            up,
            btn('Edit', () => openLink(l), '', 'Edit ' + l.name),
            btn(
              '×',
              () => {
                state.links = state.links.filter((x) => x.id !== l.id);
                save();
                render();
              },
              '',
              'Delete ' + l.name,
            ),
            down,
          );
          card.append(c);
        }
        grid.append(card);
      });
      body.append(grid);
      const bottom = el('div', 'widget-bottom');
      bottom.append(
        btn('+ Add a favourite', () => openLink(), 'text-button'),
        el('span', '', state.links.length + ' favourites'),
        btn(
          linkEditing ? 'Done' : 'Edit',
          () => {
            linkEditing = !linkEditing;
            render();
          },
          'text-button',
        ),
      );
      body.append(bottom);
    },
    clock(body) {
      const time = el('div', 'clock-time');
      time.id = 'clock-time';
      body.append(time);
      const date = el('div', 'clock-date');
      date.id = 'clock-date';
      body.append(date);
      body.append(
        el(
          'div',
          'clock-zone',
          Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll('_', ' ') + '',
        ),
      );
    },
    tasks(body) {
      const form = el('form', 'task-form');
      const input = el('input');
      input.placeholder = 'What would you like to do?';
      input.maxLength = 500;
      input.required = true;
      input.setAttribute('aria-label', 'New task');
      const add = el('button', '', '+');
      add.setAttribute('aria-label', 'Add task');
      form.append(input, add);
      form.onsubmit = (e) => {
        e.preventDefault();
        if (!input.value.trim()) return;
        state.tasks.push({ id: uid(), text: input.value.trim(), done: false });
        save();
        render();
        $('[aria-label="New task"]')?.focus();
      };
      body.append(form);
      const list = el('ul', 'tasks-list');
      state.tasks.forEach((t) => {
        const li = el('li', 'task-row' + (t.done ? ' done' : '')),
          cb = el('input');
        cb.type = 'checkbox';
        cb.checked = t.done;
        cb.setAttribute('aria-label', 'Complete ' + t.text);
        cb.onchange = () => {
          t.done = cb.checked;
          save();
          render();
        };
        const text = btn(
          t.text,
          () => {
            const edit = el('input');
            edit.value = t.text;
            edit.maxLength = 500;
            edit.setAttribute('aria-label', 'Edit task');
            text.replaceWith(edit);
            edit.focus();
            let finished = false;
            const finish = (commit) => {
              if (finished) return;
              finished = true;
              if (commit && edit.value.trim()) t.text = edit.value.trim();
              save();
              render();
            };
            edit.onblur = () => finish(true);
            edit.onkeydown = (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                finish(true);
              }
              if (e.key === 'Escape') finish(false);
            };
          },
          'task-text',
          'Edit task: ' + t.text,
        );
        li.append(
          cb,
          text,
          btn(
            '×',
            () => {
              state.tasks = state.tasks.filter((x) => x.id !== t.id);
              save();
              render();
            },
            'delete',
            'Delete task: ' + t.text,
          ),
        );
        list.append(li);
      });
      body.append(list);
      if (!state.tasks.length) {
        const empty = el('div', 'empty');
        empty.append(
          el('div', 'empty-symbol', '○'),
          document.createTextNode('Start small. Add your first task.'),
        );
        body.append(empty);
      } else {
        const bottom = el('div', 'widget-bottom');
        bottom.append(
          el('span', '', state.tasks.filter((t) => !t.done).length + ' left for today'),
          btn(
            'Clear completed',
            () => {
              state.tasks = state.tasks.filter((t) => !t.done);
              save();
              render();
            },
            'text-button',
          ),
        );
        body.append(bottom);
      }
    },
    notes(body) {
      const note = el('textarea', 'notes');
      note.setAttribute('aria-label', 'Scratchpad notes');
      note.placeholder = 'An idea, a reminder, the start of something…';
      note.value = state.notes;
      note.maxLength = 1000000;
      const bottom = el('div', 'note-bottom'),
        status = el(
          'span',
          '',
          storageOK && !corrupt ? 'All changes saved' : 'Save a backup to keep this',
        ),
        count = el('span', '', state.notes.length + ' characters');
      note.oninput = () => {
        state.notes = note.value;
        status.textContent = save() ? 'All changes saved' : 'Save a backup to keep this';
        count.textContent = state.notes.length + ' characters';
      };
      bottom.append(status, count);
      body.append(note, bottom);
    },
    timer(body) {
      body.classList.add('timer-body');
      const number = el('div', 'timer-number');
      number.id = 'timer-number';
      const details = el('div', 'timer-details');
      const label = el('strong');
      label.id = 'timer-label';
      details.append(label, el('p', '', 'One thing at a time. You’ve got this.'));
      const controls = el('div', 'timer-controls');
      const start = btn(
        'Start',
        () => {
          const t = state.timer;
          if (t.end !== null) {
            t.remaining = Math.max(0, (t.end - Date.now()) / 1000);
            t.end = null;
          } else {
            if (t.remaining <= 0) t.remaining = t.duration;
            t.completed = false;
            t.end = Date.now() + t.remaining * 1000;
          }
          save();
          tick();
        },
        'primary',
      );
      start.id = 'timer-start';
      const duration = el('input', 'duration');
      duration.type = 'number';
      duration.min = 1;
      duration.max = 180;
      duration.step = 1;
      duration.value = state.timer.duration / 60;
      duration.setAttribute('aria-label', 'Timer duration in minutes');
      duration.onchange = () => {
        if (!duration.checkValidity()) {
          duration.reportValidity();
          return;
        }
        setTimer(Number(duration.value) * 60, state.timer.mode);
      };
      controls.append(
        btn('Focus', () => setTimer(1500, 'focus')),
        btn('Break', () => setTimer(300, 'break')),
        duration,
        el('span', 'timer-caption', 'MIN'),
        start,
        btn('↺', () => setTimer(state.timer.duration, state.timer.mode), '', 'Reset timer'),
      );
      body.append(number, details, controls);
    },
  };
  function setTimer(seconds, mode) {
    state.timer = { duration: seconds, remaining: seconds, end: null, mode, completed: false };
    save();
    render();
  }
  function tick() {
    const now = new Date();
    const minute = Math.floor(now.getTime() / 60000);
    const agendaBody = $('[data-widget=agenda] .tile-body');
    if (agendaBody && minute !== agendaMinute) {
      agendaMinute = minute;
      const scroll = agendaBody.querySelector('.agenda-list')?.scrollTop || 0;
      agendaBody.replaceChildren();
      renderers.agenda(agendaBody);
      const list = agendaBody.querySelector('.agenda-list');
      if (list) list.scrollTop = scroll;
    }
    const hour = now.getHours();
    $('#greeting').textContent =
      hour < 12 ? 'Good morning.' : hour < 18 ? 'Good afternoon.' : 'Good evening.';
    $('#greeting-date').textContent = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    $('#top-date').textContent =
      now.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' }) +
      ' / ' +
      now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    if ($('#clock-time')) {
      const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      $('#clock-time').replaceChildren(
        document.createTextNode(time),
        el('span', 'clock-seconds', ' ' + String(now.getSeconds()).padStart(2, '0')),
      );
      $('#clock-date').textContent = now.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
    const t = state.timer;
    let remaining = t.end === null ? t.remaining : Math.max(0, (t.end - Date.now()) / 1000);
    if (t.end !== null && remaining === 0) {
      t.end = null;
      t.remaining = 0;
      t.completed = true;
      save();
      toast(
        t.mode === 'focus'
          ? 'Session complete. Take a well-earned break.'
          : 'Break complete. Ready when you are.',
      );
    }
    if ($('#timer-number')) {
      $('#timer-number').textContent =
        String(Math.floor(Math.ceil(remaining) / 60)).padStart(2, '0') +
        ':' +
        String(Math.ceil(remaining) % 60).padStart(2, '0');
      $('#timer-start').textContent = t.end !== null ? 'Pause' : t.completed ? 'Restart' : 'Start';
      $('#timer-label').textContent = t.completed
        ? 'Nicely done. Take a moment.'
        : t.end !== null
          ? 'A little time, just for this.'
          : t.mode === 'break'
            ? 'A moment to recharge.'
            : 'Make a little room to focus.';
    }
  }
  function openLink(link) {
    editingLink = link?.id ?? null;
    $('#link-dialog-title').textContent = link ? 'Edit your favourite' : 'Add a favourite';
    $('#link-name').value = link?.name ?? '';
    $('#link-url').value = link?.url ?? '';
    $('#link-error').textContent = '';
    $('#link-dialog').showModal();
    $('#link-name').focus();
  }
  $('#link-cancel').onclick = () => $('#link-dialog').close();
  $('#link-form').onsubmit = (e) => {
    e.preventDefault();
    const name = $('#link-name').value.trim(),
      url = $('#link-url').value.trim();
    if (!name || !validURL(url)) {
      $('#link-error').textContent = 'Enter a name and an http:// or https:// web address.';
      return;
    }
    if (editingLink) {
      const l = state.links.find((l) => l.id === editingLink);
      l.name = name;
      l.url = url;
    } else state.links.push({ id: uid(), name, url });
    save();
    render();
    $('#link-dialog').close();
  };
  $('#edit-layout').onclick = () => {
    if (editing) {
      window.DAYBREAK_LAYOUT.packCurrent(state);
      save();
    }
    editing = !editing;
    render();
  };
  $('#pack-layout').onclick = () => {
    window.DAYBREAK_LAYOUT.packCurrent(state);
    save();
    render();
    $('#pack-layout').focus();
    toast('Tiles packed together.');
  };
  $('#restore-layout').onclick = () => {
    state.order = [...IDS];
    state.hidden = [];
    state.layouts = {};
    editing = false;
    save();
    render();
    toast('Default layout restored. Your content is unchanged.');
  };
  $('#settings-open').onclick = () => {
    applyPrefs();
    $('#settings').showModal();
  };
  $('#setting-provider').onchange = (e) => {
    state.provider = e.target.value;
    save();
    render();
  };
  $('#theme-mode').onchange = (e) => {
    state.theme = e.target.value;
    save();
    applyPrefs();
  };
  $('#theme-toggle').onclick = () => {
    applyPrefs();
    $('#settings').showModal();
    $('#theme-mode').focus();
  };
  $('#motion').onchange = (e) => {
    state.motion = e.target.checked;
    save();
    applyPrefs();
  };
  $('#export').onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }),
      url = URL.createObjectURL(blob),
      a = el('a');
    a.href = url;
    a.download = 'daybreak-' + new Date().toISOString().slice(0, 10) + '.json';
    a.hidden = true;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast('Desktop backup download started.');
  };
  $('#import').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.size > 5000000) throw Error('Backup is too large (maximum 5 MB).');
      const next = validate(JSON.parse(await file.text()));
      if (
        !confirm(
          'Replace your current notes, tasks, links, layout, and timer with this backup? Export first if you want to keep them.',
        )
      )
        return;
      state = next;
      corrupt = false;
      save();
      if (storageOK) {
        $('#storage-warning').hidden = true;
        $('#storage-label').textContent = 'Saved on this device';
      }
      render();
      toast('Desktop restored from backup.');
    } catch (error) {
      toast('Import rejected. Your desktop is unchanged. ' + error.message);
    } finally {
      e.target.value = '';
    }
  };
  document.addEventListener('keydown', (e) => {
    if (
      e.key === '/' &&
      !e.ctrlKey &&
      !e.metaKey &&
      !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) &&
      !document.querySelector('dialog[open]')
    ) {
      const q = $('#search-query');
      if (q) {
        e.preventDefault();
        q.focus();
      }
    }
  });
  document.addEventListener('daybreak-calendar-update', () => {
    agendaMinute = -1;
    tick();
  });
  window.DAYBREAK_COMMANDS = {
    favourites: () => state.links.map(({ name, url }) => ({ name, url })),
    theme: () => state.theme,
    palette: () => state.palette || 'daybreak',
    palettes: () => Object.entries(window.DAYBREAK_THEMES.themes),
    run(action, value) {
      const reveal = (id) => {
        if (state.hidden.includes(id)) {
          state.hidden = state.hidden.filter((x) => x !== id);
          save();
          render();
        }
        const tile = $(`[data-widget="${id}"]`);
        tile?.scrollIntoView({ block: 'center', behavior: 'instant' });
        return tile;
      };
      if (action === 'palette' && Object.hasOwn(window.DAYBREAK_THEMES.themes, value)) {
        const result = window.DAYBREAK_THEMES.switchTo(value, () => {
          state.palette = value;
          save();
          applyPrefs();
        });
        if (result === 'reduced-motion')
          toast(
            'Theme applied. Your browser reports reduced motion, so the animation was skipped.',
          );
        return;
      }
      if (action === 'theme' && ['system', 'light', 'evening'].includes(value)) {
        state.theme = value;
        save();
        applyPrefs();
        toast('Appearance: ' + { system: 'System', light: 'Light', evening: 'Dark' }[value]);
        return;
      }
      if (action === 'task') {
        const text = String(value || '').trim();
        if (!text || text.length > 500) return;
        if (state.tasks.length >= 10000) {
          toast('Task list is full. Clear completed tasks first.');
          return;
        }
        state.tasks.push({ id: uid(), text, done: false });
        save();
        render();
        toast('Task added');
        return;
      }
      if (action === 'focus') {
        const minutes = Number(value);
        if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) return;
        setTimer(minutes * 60, 'focus');
        state.timer.end = Date.now() + minutes * 60000;
        save();
        reveal('timer');
        tick();
        return;
      }
      if (action === 'break') {
        setTimer(300, 'break');
        state.timer.end = Date.now() + 300000;
        save();
        reveal('timer');
        tick();
        return;
      }
      if (action === 'layout') {
        if (!editing) {
          editing = true;
          render();
        }
        $('#layout-tools').scrollIntoView({ block: 'start' });
        return;
      }
      if (action === 'settings') {
        $('#settings-open').click();
        return;
      }
      if (action === 'accounts') {
        window.DAYBREAK_OPEN_ACCOUNTS();
        return;
      }
      if (action === 'weather') {
        $('#weather-settings').click();
        return;
      }
      if (action === 'backup') {
        $('#export').click();
        return;
      }
      if (action === 'new-task') {
        reveal('tasks');
        $('[aria-label="New task"]')?.focus();
        return;
      }
      if (action === 'notes') {
        reveal('notes');
        $('[aria-label="Scratchpad notes"]')?.focus();
        return;
      }
      if (action === 'search') {
        reveal('search');
        $('#search-query')?.focus();
        return;
      }
      if (['agenda', 'github', 'timer'].includes(action)) {
        const tile = reveal(action);
        const target = tile?.querySelector('a,button,input');
        target?.focus();
        return;
      }
    },
  };
  render();
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', tick);
})();
