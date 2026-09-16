const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert'),
  crypto = require('crypto');
const app = fs.readFileSync('app.js', 'utf8');
const context = {
  window: { matchMedia: () => ({ matches: false }) },
  document: { createElement: () => ({}), head: { append() {} } },
  crypto,
  URL,
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('themes.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('layout.js', 'utf8'), context);
const stateStart = app.search(/\blet\s+state\s*=\s*defaults\(\)/);
assert(stateStart >= 0);
vm.runInContext(app.slice(0, stateStart) + 'window.test={validate,defaults};})();', context);
for (const version of [6, 7, 8, 9]) {
  const original = context.window.test.defaults();
  original.notes = 'Keep my notes';
  original.order = original.order
    .filter((id) => !['greeting', 'weather'].includes(id))
    .filter((id) => version === 9 || id !== 'spotify')
    .filter((id) => version >= 8 || id !== 'github')
    .filter((id) => version !== 6 || id !== 'agenda');
  original.layouts = { wide: { notes: { x: 0, y: 0, w: 6, h: 10 } } };
  original.hidden = ['clock'];
  const next = context.window.test.validate(original);
  assert.equal(next.order.length, 11);
  assert.equal(next.notes, original.notes);
  assert.equal(next.hidden[0], 'clock');
  assert.deepEqual(next.layouts.wide.notes, { x: 0, y: 11, w: 6, h: 10 });
  assert.equal(original.layouts.wide.notes.y, 0, 'migration must not mutate the backup');
  assert.deepEqual(Array.from(next.order.slice(0, 3)), ['greeting', 'spotify', 'weather']);
  assert.equal(
    next.layouts.wide.spotify.x + next.layouts.wide.spotify.w,
    next.layouts.wide.weather.x,
  );
  assert.deepEqual(context.window.test.validate(next), next, 'migration only happens once');
  assert.equal(next.order.filter((id) => id === 'spotify').length, 1);
  assert.equal(next.order.filter((id) => id === 'github').length, 1);
}
for (const [key, width, offset] of [
  ['wide', 6, 11],
  ['medium', 3, 20],
  ['narrow', 1, 29],
]) {
  const original = context.window.test.defaults();
  original.order = original.order.filter((id) => !['greeting', 'weather'].includes(id));
  original.layouts = { [key]: { notes: { x: 0, y: 3000, w: width, h: 10 } } };
  const next = context.window.test.validate(original);
  assert.equal(next.layouts[key].notes.y, 3000 + offset);
  next.hidden.push('greeting', 'weather');
  assert.deepEqual(context.window.test.validate(JSON.parse(JSON.stringify(next))), next);
}
assert.throws(() =>
  context.window.test.validate({ ...context.window.test.defaults(), order: ['invalid'] }),
);
const legacy = context.window.test.defaults();
delete legacy.palette;
assert.equal(context.window.test.validate(legacy).palette, 'daybreak');
for (const palette of Object.keys(context.window.DAYBREAK_THEMES.themes)) {
  const saved = context.window.test.defaults();
  saved.palette = palette;
  assert.equal(context.window.test.validate(JSON.parse(JSON.stringify(saved))).palette, palette);
  assert.equal(saved.theme, 'system');
}
assert.throws(() =>
  context.window.test.validate({ ...context.window.test.defaults(), palette: 'invalid' }),
);
class Element {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
  }
  append(...nodes) {
    this.children.push(...nodes);
  }
  setAttribute() {}
  get text() {
    return [this.textContent || '', ...this.children.map((c) => c.text)].join(' ');
  }
}
const ui = {
  window: {},
  document: { createElement: (tag) => new Element(tag), addEventListener() {} },
  setInterval() {},
  URL,
  Date,
};
vm.createContext(ui);
vm.runInContext(fs.readFileSync('github-widget.js', 'utf8'), ui);
ui.window.DAYBREAK_GITHUB = {
  status: 'connected',
  updatedAt: new Date().toISOString(),
  total: 40,
  issues: [
    {
      url: 'https://github.com/example/demo/issues/1',
      title: '<script>not executable</script>',
      repository: 'example/demo',
      number: 1,
      labels: ['bug'],
    },
    { url: 'javascript:alert(1)', title: 'bad' },
  ],
};
let body = new Element('div');
ui.window.DAYBREAK_RENDER_ISSUES(body);
assert(body.text.includes('Live'));
assert(body.text.includes('latest 2'));
assert(body.text.includes('<script>not executable</script>'));
assert(!body.text.includes('bad'));
ui.window.DAYBREAK_GITHUB.status = 'unavailable';
body = new Element('div');
ui.window.DAYBREAK_RENDER_ISSUES(body);
assert(body.text.includes('saved issues'));
ui.window.DAYBREAK_GITHUB = { issues: [] };
body = new Element('div');
ui.window.DAYBREAK_RENDER_ISSUES(body);
assert(body.text.includes('Waiting for GitHub'));
console.log(
  'PASS: 6/7/8/9 to 11-widget migrations, responsive positions and backup round trips, preserved notes/hidden tiles, safe text/links, live and unavailable states',
);
