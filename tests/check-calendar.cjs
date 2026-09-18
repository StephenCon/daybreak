const fs = require('fs'),
  vm = require('vm'),
  assert = require('assert');
const now = Date.parse('2026-09-18T16:30:00Z');
class Clock extends Date {
  constructor(...args) {
    super(...(args.length ? args : [now]));
  }
  static now() {
    return now;
  }
}
class Node {
  constructor(tag, cls = '', text = '') {
    Object.assign(this, {
      tag,
      className: cls,
      textContent: text,
      children: [],
      dataset: {},
      handlers: {},
      scrollTop: 0,
      isConnected: true,
    });
    this.classList = {
      add: (name) => {
        this.className += ' ' + name;
      },
    };
  }
  append(...nodes) {
    for (const node of nodes) {
      node.parent = this;
      this.children.push(node);
    }
  }
  replaceChild(next, old) {
    this.children[this.children.indexOf(old)] = next;
    next.parent = this;
  }
  setAttribute() {}
  addEventListener(name, fn) {
    this.handlers[name] = fn;
  }
  focus() {}
  getBoundingClientRect() {
    return {
      top:
        this.parent?.className === 'agenda-list'
          ? this.parent.children.indexOf(this) * 50 - this.parent.scrollTop
          : 0,
    };
  }
}
const find = (node, cls) =>
  node.className.split(' ').includes(cls)
    ? node
    : node.children.map((child) => find(child, cls)).find(Boolean);
const all = (node, cls) => [
  ...(node.className.split(' ').includes(cls) ? [node] : []),
  ...node.children.flatMap((child) => all(child, cls)),
];
const frames = [];
const context = {
  window: {},
  Date: Clock,
  Intl,
  document: { dispatchEvent() {} },
  Event: class {},
  requestAnimationFrame: (fn) => frames.push(fn),
  agendaView: { following: true, scroll: 0, date: null },
  el: (tag, cls, text) => new Node(tag, cls, text),
  btn: (text, fn, cls) => Object.assign(new Node('button', cls, text), { onclick: fn }),
  validURL: (url) => /^https?:/.test(url),
};
vm.createContext(context);
const app = fs.readFileSync('app.js', 'utf8');
vm.runInContext(
  'const renderers = {' +
    app.slice(app.indexOf('    agenda(body) {'), app.indexOf('    search(body) {')) +
    '}; window.render = renderers.agenda;',
  context,
);
const event = (title, start, end) => ({ title, start, end, url: 'https://calendar.google.com/' });
const past = event('Morning', '2026-09-18T09:00:00Z', '2026-09-18T10:00:00Z');
const current = event('Current', '2026-09-18T16:00:00Z', '2026-09-18T17:00:00Z');
const next = event('Later', '2026-09-18T18:00:00Z', '2026-09-18T19:00:00Z');
const allDay = event('All day', '2026-09-18', '2026-09-19');
context.window.DAYBREAK_CALENDAR = {
  date: '2026-09-18',
  timezone: 'UTC',
  events: [past, current, next, allDay],
};
const render = () => {
  const body = new Node('div');
  context.window.render(body);
  while (frames.length) frames.shift()();
  return body;
};
let body = render(),
  list = find(body, 'agenda-list');
assert.equal(all(body, 'happening-now').length, 1);
assert.equal(find(body, 'happening-now').children[1].children[1].textContent, 'Now · 30 min left');
assert.equal(list.scrollTop, 100, 'all-day and past entries do not steal the current-event target');
assert(!find(body, 'agenda-now'));
list.handlers.wheel();
list.scrollTop = 17;
list.handlers.scroll();
body = render();
assert.equal(find(body, 'agenda-list').scrollTop, 17, 'refresh preserves manual scroll');
assert.equal(find(body, 'agenda-back').hidden, false);
find(body, 'agenda-back').onclick();
assert.equal(find(body, 'agenda-list').scrollTop, 100);
assert.equal(context.agendaView.following, true);
context.window.DAYBREAK_CALENDAR.events = [allDay, past, next];
body = render();
list = find(body, 'agenda-list');
assert.equal(list.children[2].className, 'agenda-now');
assert.equal(list.scrollTop, 100);
context.window.DAYBREAK_CALENDAR.events = [past];
body = render();
assert.equal(find(body, 'agenda-list').children.at(-1).className, 'agenda-now');
context.window.DAYBREAK_CALENDAR.events = [
  current,
  event('Overlap', '2026-09-18T16:15:00Z', '2026-09-18T16:45:00Z'),
];
body = render();
assert.equal(all(body, 'happening-now').length, 2);
context.window.DAYBREAK_CALENDAR.date = '2026-09-17';
body = render();
assert.equal(all(body, 'happening-now').length, 0);
assert(!find(body, 'agenda-now'));
context.window.DAYBREAK_CALENDAR = { status: 'disconnected' };
assert(find(render(), 'agenda-empty'));
console.log(
  'PASS: calendar follows now, countdown, all-day exclusion, overlaps, manual scroll preservation, back-to-now, gaps, end of day and stale schedules',
);
