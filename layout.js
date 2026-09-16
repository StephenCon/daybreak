/* Grid geometry is shared by pointer and keyboard controls. */
(() => {
  const STEP = 24;
  const breakpoint = () => (innerWidth > 1100 ? 'wide' : innerWidth > 650 ? 'medium' : 'narrow');
  const columns = (key) => ({ wide: 12, medium: 6, narrow: 1 })[key];
  const overlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  function validate(layouts, ids) {
    if (layouts === undefined || layouts === null) return {};
    if (typeof layouts !== 'object' || Array.isArray(layouts)) throw Error('Invalid tile sizes.');
    const clean = {};
    for (const [key, map] of Object.entries(layouts)) {
      if (
        !['wide', 'medium', 'narrow'].includes(key) ||
        !map ||
        typeof map !== 'object' ||
        Array.isArray(map)
      )
        throw Error('Invalid layout grid.');
      clean[key] = {};
      for (const [id, box] of Object.entries(map)) {
        const minWidth = Math.min(columns(key), ['search', 'timer'].includes(id) ? 6 : 3),
          minHeight = id === 'search' ? 5 : id === 'timer' ? 7 : 9;
        if (
          !ids.includes(id) ||
          !box ||
          !['x', 'y', 'w', 'h'].every((n) => Number.isInteger(box[n])) ||
          box.x < 0 ||
          box.y < 0 ||
          box.y > 3000 ||
          box.w < minWidth ||
          box.w > columns(key) ||
          box.x + box.w > columns(key) ||
          box.h < minHeight ||
          box.h > 80
        )
          throw Error('Invalid tile position.');
        clean[key][id] = { x: box.x, y: box.y, w: box.w, h: box.h };
      }
    }
    return clean;
  }
  function settle(map, active, ids) {
    const placed = [map[active]];
    for (const id of ids
      .filter((id) => id !== active && map[id])
      .sort((a, b) => map[a].y - map[b].y || map[a].x - map[b].x)) {
      const box = map[id];
      let hit;
      while ((hit = placed.find((other) => overlap(box, other)))) box.y = hit.y + hit.h;
      placed.push(box);
    }
    return map;
  }
  function pack(map, ids, cols) {
    // Keep reading order and dimensions; find the earliest available grid slot.
    const ordered = ids
      .filter((id) => map[id])
      .sort((a, b) => map[a].y - map[b].y || map[a].x - map[b].x);
    const placed = [];
    let row = 0,
      column = 0;
    for (const id of ordered) {
      const box = map[id];
      while (true) {
        if (column + box.w > cols) {
          row++;
          column = 0;
          continue;
        }
        const candidate = { ...box, x: column, y: row };
        if (!placed.some((other) => overlap(candidate, other))) {
          box.x = column;
          box.y = row;
          placed.push({ ...box });
          column += box.w;
          break;
        }
        column++;
      }
    }
    return ordered;
  }
  function packCurrent(state) {
    const key = breakpoint(),
      map = state.layouts?.[key];
    if (!map) return;
    pack(
      map,
      state.order.filter((id) => !state.hidden.includes(id)),
      columns(key),
    );
  }
  let teardown = () => {};
  function attach({ state, editing, save, announce }) {
    teardown();
    const grid = document.querySelector('#desktop');
    const tools = document.querySelector('#layout-tools');
    tools.querySelector('.grid-controls')?.remove();
    let key = breakpoint(),
      cols = columns(key),
      selected = null,
      gesture = null;
    state.layouts ||= {};
    const tiles = () => [...grid.querySelectorAll('.tile')];
    const visible = () => tiles().map((tile) => tile.dataset.widget);
    const minimum = (id) => ({
      w: Math.min(cols, ['search', 'timer'].includes(id) ? 6 : 3),
      h: id === 'search' ? 5 : id === 'timer' ? 7 : 9,
    });
    const button = (text, label, fn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.setAttribute('aria-label', label);
      b.onclick = fn;
      return b;
    };
    function seed() {
      const bounds = grid.getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(grid).columnGap) || 20;
      const unit = (bounds.width + gap) / cols;
      const map = (state.layouts[key] ||= {});
      for (const tile of tiles()) {
        const id = tile.dataset.widget;
        if (map[id]) continue;
        const box = tile.getBoundingClientRect(),
          min = minimum(id);
        const w = Math.max(min.w, Math.min(cols, Math.round((box.width + gap) / unit)));
        map[id] = {
          x: Math.max(0, Math.min(cols - w, Math.round((box.left - bounds.left) / unit))),
          y: Math.max(0, Math.round((box.top - bounds.top) / STEP)),
          w,
          h: Math.max(min.h, Math.ceil((box.height + 20) / STEP)),
        };
      }
      const ids = visible();
      if (ids.length) settle(map, ids[0], ids);
    }
    function paint() {
      const map = state.layouts[key];
      grid.classList.toggle('custom-grid', !!map);
      grid.style.setProperty('--grid-columns', cols);
      for (const tile of tiles()) {
        const box = map?.[tile.dataset.widget];
        tile.style.gridArea = box
          ? `${box.y + 1} / ${box.x + 1} / span ${box.h} / span ${box.w}`
          : '';
        tile.classList.toggle('layout-selected', editing && selected === tile.dataset.widget);
        tile.classList.toggle('layout-narrow', !!box && box.w <= Math.ceil(cols / 2));
      }
      if (editing && map)
        grid.style.minHeight =
          (Math.max(0, ...visible().map((id) => map[id].y + map[id].h)) + 6) * STEP + 'px';
      else grid.style.minHeight = '';
    }
    function commit() {
      const map = state.layouts[key];
      // Keep focus/reading order aligned with the visible arrangement.
      if (map)
        state.order.sort(
          (a, b) =>
            (map[a]?.y ?? 9999) - (map[b]?.y ?? 9999) || (map[a]?.x ?? 0) - (map[b]?.x ?? 0),
        );
      save();
    }
    let label;
    function select(id) {
      selected = id;
      if (label)
        label.textContent =
          'Selected: ' + document.querySelector(`[data-widget="${id}"] h2`).textContent;
      paint();
    }
    function change(dx, dy, dw, dh) {
      if (!selected) return;
      const map = state.layouts[key],
        box = map[selected],
        min = minimum(selected);
      box.w = Math.max(min.w, Math.min(cols, box.w + dw));
      box.x = Math.max(0, Math.min(cols - box.w, box.x + dx));
      box.h = Math.max(min.h, Math.min(80, box.h + dh));
      box.y = Math.max(0, Math.min(1800, box.y + dy));
      settle(map, selected, visible());
      paint();
      commit();
      announce(`Tile: column ${box.x + 1}, row ${box.y + 1}, width ${box.w}, height ${box.h}.`);
    }
    function finish(cancel = false) {
      if (!gesture) return;
      const capture = gesture;
      if (cancel) state.layouts[key] = capture.before;
      gesture = null;
      if (capture.target.hasPointerCapture?.(capture.pointerId))
        capture.target.releasePointerCapture(capture.pointerId);
      grid.classList.remove('grid-dragging');
      paint();
      if (!cancel) commit();
    }
    function start(e, id, resize) {
      if (!editing || e.button !== 0 || (!resize && e.target.closest('button'))) return;
      e.preventDefault();
      select(id);
      const bounds = grid.getBoundingClientRect(),
        gap = parseFloat(getComputedStyle(grid).columnGap) || 20;
      gesture = {
        id,
        resize,
        x: e.clientX,
        y: e.clientY + scrollY,
        before: structuredClone(state.layouts[key]),
        unit: (bounds.width + gap) / cols,
        target: e.currentTarget,
        pointerId: e.pointerId,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
      grid.classList.add('grid-dragging');
    }
    const move = (e) => {
      if (!gesture || e.pointerId !== gesture.pointerId) return;
      const g = gesture,
        map = structuredClone(g.before),
        box = map[g.id],
        min = minimum(g.id);
      const dx = Math.round((e.clientX - g.x) / g.unit),
        dy = Math.round((e.clientY + scrollY - g.y) / STEP);
      if (g.resize) {
        box.w = Math.max(min.w, Math.min(cols - box.x, box.w + dx));
        box.h = Math.max(min.h, Math.min(80, box.h + dy));
      } else {
        box.x = Math.max(0, Math.min(cols - box.w, box.x + dx));
        box.y = Math.max(0, Math.min(1800, box.y + dy));
      }
      state.layouts[key] = settle(map, g.id, visible());
      paint();
      if (e.clientY > innerHeight - 40) window.scrollBy(0, 18);
      else if (e.clientY < 70) window.scrollBy(0, -18);
    };
    const up = () => finish(),
      cancel = () => finish(true);
    const escape = (e) => {
      if (e.key === 'Escape' && gesture) {
        e.preventDefault();
        finish(true);
      }
    };
    function refresh() {
      finish(true);
      key = breakpoint();
      cols = columns(key);
      grid.classList.remove('custom-grid');
      tiles().forEach((tile) => (tile.style.gridArea = ''));
      if (editing || state.layouts[key]) {
        seed();
        if (editing) commit();
      }
      paint();
    }
    if (editing || state.layouts[key]) seed();
    if (editing) {
      const controls = document.createElement('div');
      controls.className = 'grid-controls';
      label = document.createElement('span');
      label.className = 'grid-selection';
      label.setAttribute('aria-live', 'polite');
      label.textContent = 'Select a tile to adjust it';
      controls.append(label);
      for (const [text, name, args] of [
        ['←', 'Move selected tile left', [-1, 0, 0, 0]],
        ['→', 'Move selected tile right', [1, 0, 0, 0]],
        ['↑', 'Move selected tile up', [0, -1, 0, 0]],
        ['↓', 'Move selected tile down', [0, 1, 0, 0]],
        ['Width −', 'Make selected tile narrower', [0, 0, -1, 0]],
        ['Width +', 'Make selected tile wider', [0, 0, 1, 0]],
        ['Height −', 'Make selected tile shorter', [0, 0, 0, -1]],
        ['Height +', 'Make selected tile taller', [0, 0, 0, 1]],
      ])
        controls.append(button(text, name, () => change(...args)));
      tools.append(controls);
      for (const tile of tiles()) {
        const id = tile.dataset.widget,
          head = tile.querySelector('.tile-head');
        head.draggable = false;
        head.tabIndex = 0;
        head.setAttribute('role', 'button');
        head.setAttribute(
          'aria-label',
          'Move ' +
            tile.getAttribute('aria-label') +
            '. Arrow keys move; Shift plus arrow keys resize.',
        );
        head.onpointerdown = (e) => start(e, id, false);
        head.onfocus = () => select(id);
        head.onkeydown = (e) => {
          const arrows = {
            ArrowLeft: [-1, 0],
            ArrowRight: [1, 0],
            ArrowUp: [0, -1],
            ArrowDown: [0, 1],
          };
          if (arrows[e.key]) {
            e.preventDefault();
            select(id);
            const [x, y] = arrows[e.key];
            change(e.shiftKey ? 0 : x, e.shiftKey ? 0 : y, e.shiftKey ? x : 0, e.shiftKey ? y : 0);
          }
        };
        const handle = button('◢', 'Resize ' + tile.getAttribute('aria-label'), () => select(id));
        handle.className = 'tile-resize';
        handle.onpointerdown = (e) => start(e, id, true);
        handle.onkeydown = (e) =>
          head.onkeydown({ key: e.key, shiftKey: true, preventDefault: () => e.preventDefault() });
        handle.onfocus = () => select(id);
        tile.append(handle);
      }
      commit();
    }
    paint();
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', escape);
    window.addEventListener('resize', refresh);
    teardown = () => {
      finish(true);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', escape);
      window.removeEventListener('resize', refresh);
    };
  }
  window.DAYBREAK_LAYOUT = { validate, settle, overlap, pack, packCurrent, attach };
})();
