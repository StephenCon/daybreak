const vm = require('vm'),
  fs = require('fs'),
  assert = require('assert');
let reduce = false,
  animations = 0,
  changes = 0,
  css = '',
  cancelled = 0;
const overlays = [],
  timers = new Map(),
  listeners = new Set();
let timerId = 0;
const node = () => ({
  children: [],
  style: { setProperty() {} },
  setAttribute() {},
  removeAttribute() {},
  append(...n) {
    this.children.push(...n);
  },
  showPopover() {},
  remove() {
    this.removed = true;
  },
});
const c = {
  window: {},
  setTimeout: (fn) => {
    timers.set(++timerId, fn);
    return timerId;
  },
  clearTimeout: (id) => timers.delete(id),
  matchMedia: () => ({
    matches: reduce,
    addEventListener: (e, fn) => listeners.add(fn),
    removeEventListener: (e, fn) => listeners.delete(fn),
  }),
  document: {
    documentElement: { dataset: { theme: 'evening' } },
    createElement: node,
    head: { append: (s) => (css = s.textContent) },
    body: { append: (n) => overlays.push(n) },
    querySelector: () => ({
      animate: () => {
        animations++;
        return { cancel: () => cancelled++ };
      },
    }),
  },
};
vm.createContext(c);
vm.runInContext(fs.readFileSync('themes.js', 'utf8'), c);
const { themes, switchTo } = c.window.DAYBREAK_THEMES;
assert.equal(Object.keys(themes).length, 9);
assert.equal(themes.fireside.name, 'Fireside');
const lum = (hex) => {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};
const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
for (const [name, t] of Object.entries(themes))
  for (const mode of ['light', 'dark']) {
    const p = t[mode];
    assert.equal(p.length, 10);
    for (const background of [0, 1, 5, 7])
      assert(contrast(p[2], p[background]) >= 4.5, `${name} ${mode} body contrast`);
    assert(contrast(p[9], p[8]) >= 4.5, `${name} ${mode} timer contrast`);
    if (name === 'fireside')
      for (const background of [0, 1, 5, 7])
        assert(contrast(p[3], p[background]) >= 4.5, `${mode} Fireside secondary text contrast`);
  }
switchTo('nord', () => changes++);
assert.equal(changes, 1);
assert.equal(animations, 1);
assert.equal(overlays[0].children.filter((n) => n.className === 'portal-ray').length, 24);
switchTo('retro', () => changes++);
assert(overlays[0].removed);
assert.equal(timers.size, 1);
assert.equal(listeners.size, 1);
assert.equal(cancelled, 1);
reduce = true;
assert.equal(
  switchTo('hacker', () => changes++),
  'reduced-motion',
);
assert.equal(changes, 3);
assert.equal(animations, 2);
assert(overlays[1].removed);
assert.equal(timers.size, 0);
switchTo('invalid', () => changes++);
switchTo('__proto__', () => changes++);
assert.equal(changes, 3);
reduce = false;
switchTo('retro', () => changes++);
assert.equal(changes, 4);
for (const fn of [...listeners]) fn();
assert(overlays[2].removed);
assert.equal(listeners.size, 0);
switchTo('cyberpunk', () => changes++);
for (const fn of [...timers.values()]) fn();
assert(overlays[3].removed);
assert.equal(timers.size, 0);
for (const id of Object.keys(themes).filter((id) => id !== 'daybreak'))
  assert(
    css.replace(/\s+/g, '').includes(`[data-palette="${id}"]body{font-family:`),
    `${id} has typography`,
  );
assert(!css.includes(':root[data-palette="daybreak"]')); // Original default stylesheet remains authoritative.
const app = fs.readFileSync('app.js', 'utf8');
assert.match(app, /palette:\s*['"]daybreak['"]/);
assert.match(
  app,
  /document\.documentElement\.dataset\.palette\s*=\s*state\.palette\s*\|\|\s*['"]daybreak['"]/,
);
// Exercise the actual command branch, including reselecting the active palette.
const start = app.search(/if\s*\(\s*action\s*===\s*['"]palette['"]/);
const end = app.search(/if\s*\(\s*action\s*===\s*['"]theme['"]/);
assert(start >= 0 && end > start);
let saved = 0,
  applied = 0;
const notices = [];
Object.assign(c, {
  state: { palette: 'cyberpunk' },
  save: () => saved++,
  applyPrefs: () => applied++,
  toast: (t) => notices.push(t),
});
vm.runInContext('window.testThemeCommand=(action,value)=>{' + app.slice(start, end) + '}', c);
const before = animations;
c.window.testThemeCommand('palette', 'cyberpunk');
assert.equal(animations, before + 1);
assert.equal(saved, 1);
assert.equal(applied, 1);
reduce = true;
c.window.testThemeCommand('palette', 'nord');
assert.equal(c.state.palette, 'nord');
assert.match(notices[0], /reduced motion/);
console.log(
  'PASS: 9 light/dark palettes, contrast, default preserved, theme typography, 24 rays, rapid switching cleanup, reduced motion, timed cleanup, invalid palette rejection',
);
