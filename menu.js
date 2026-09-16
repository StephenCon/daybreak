(() => {
  const api = window.DAYBREAK_COMMANDS,
    dialog = document.querySelector('#command-menu');
  const input = document.querySelector('#command-query'),
    list = document.querySelector('#command-results');
  let selected = 0,
    results = [];
  const item = (label, icon, action, value, hint = '') => ({ label, icon, action, value, hint });
  function choices() {
    const favourites = api
      .favourites()
      .filter((x) => {
        try {
          return ['http:', 'https:'].includes(new URL(x.url).protocol);
        } catch {
          return false;
        }
      })
      .map((x) => item(x.name, '↗', 'url', x.url, 'Favourite'));
    return [
      ...favourites,
      item('Add a task', '+', 'new-task', null, 'task buy milk'),
      item('Focus for 25 minutes', '◷', 'focus', 25, 'focus 25'),
      item('Take a 5-minute break', '◴', 'break'),
    ];
  }
  function resolve(query) {
    const text = query.trim();
    if (/^task\s+\S/i.test(text)) {
      const task = text.replace(/^task\s+/i, '');
      return task.length <= 500 ? [item('Add: ' + task, '+', 'task', task)] : [];
    }
    if (/^focus\s+\d+$/i.test(text)) {
      const minutes = Number(text.split(/\s+/)[1]);
      return minutes >= 1 && minutes <= 180
        ? [item(`Focus for ${minutes} minutes`, '◷', 'focus', minutes)]
        : [];
    }
    const palettes = api.palettes().map(([id, palette]) => ({
      ...item(
        'Theme: ' + palette.name,
        '◐',
        'palette',
        id,
        api.palette() === id ? 'Selected' : palette.description,
      ),
      swatches: document.documentElement.dataset.theme === 'evening' ? palette.dark : palette.light,
    }));
    const all = [
      ...choices(),
      ...palettes,
      item(
        'Connect accounts',
        '↗',
        'accounts',
        null,
        'Google Calendar GitHub Spotify sign in setup',
      ),
    ];
    if (!text) return choices();
    return all.filter((row) =>
      (row.label + ' ' + row.hint).toLowerCase().includes(text.toLowerCase()),
    );
  }
  function highlight() {
    [...list.children].forEach((row, i) =>
      row.setAttribute('aria-selected', String(i === selected)),
    );
    if (results.length) {
      input.setAttribute('aria-activedescendant', 'command-option-' + selected);
      list.children[selected]?.scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  }
  function render() {
    results = resolve(input.value);
    selected = 0;
    list.replaceChildren();
    results.forEach((entry, index) => {
      const row = document.createElement('div');
      row.className = 'command-option';
      row.id = 'command-option-' + index;
      row.setAttribute('role', 'option');
      const icon = document.createElement('span');
      icon.className = 'command-icon';
      icon.textContent = entry.icon;
      icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.className = 'command-label';
      label.textContent = entry.label;
      const hint = document.createElement('span');
      hint.className = 'command-hint';
      hint.textContent = entry.hint;
      row.append(icon, label, hint);
      if (entry.swatches) {
        const swatches = document.createElement('span');
        swatches.className = 'palette-swatches';
        swatches.setAttribute('aria-hidden', 'true');
        [0, 6, 2].forEach((index) => {
          const dot = document.createElement('i');
          dot.style.background = entry.swatches[index];
          swatches.append(dot);
        });
        row.append(swatches);
      }
      row.onpointermove = () => {
        selected = index;
        highlight();
      };
      row.onmousedown = (e) => e.preventDefault();
      row.onclick = () => activate(index);
      list.append(row);
    });
    document.querySelector('#command-empty').hidden = !!results.length;
    highlight();
  }
  function activate(index) {
    const entry = results[index];
    if (!entry) return;
    dialog.close();
    if (entry.action === 'url') {
      location.href = entry.value;
      return;
    }
    api.run(entry.action, entry.value);
  }
  function open() {
    if (document.querySelector('dialog[open]')) return;
    input.value = '';
    dialog.showModal();
    render();
    input.focus();
  }
  document.querySelector('#command-close').onclick = () => dialog.close();
  input.oninput = render;
  input.onkeydown = (e) => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      if (results.length) {
        selected =
          e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? results.length - 1
              : (selected + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
        highlight();
      }
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!e.isComposing) activate(selected);
    }
  };
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      const b = dialog.getBoundingClientRect();
      if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom)
        dialog.close();
    }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      if (document.querySelector('dialog[open]') && !dialog.open) return;
      e.preventDefault();
      dialog.open ? dialog.close() : open();
    }
  });
})();
