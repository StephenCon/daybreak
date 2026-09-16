const vm = require('vm'),
  fs = require('fs'),
  assert = require('assert');
class Element {
  constructor() {
    this.children = [];
    this.attrs = {};
    this.style = {};
    this.value = '';
    this.hidden = false;
    this.open = false;
    this.events = {};
  }
  setAttribute(k, v) {
    this.attrs[k] = v;
  }
  removeAttribute(k) {
    delete this.attrs[k];
  }
  append(...n) {
    this.children.push(...n);
  }
  replaceChildren() {
    this.children = [];
  }
  focus() {}
  scrollIntoView() {}
  showModal() {
    this.open = true;
  }
  close() {
    this.open = false;
  }
  click() {
    this.onclick?.();
  }
  addEventListener(k, fn) {
    this.events[k] = fn;
  }
}
const names = [
    'command-menu',
    'command-query',
    'command-results',
    'command-back',
    'command-heading',
    'command-close',
    'command-empty',
    'menu-open',
  ],
  elements = Object.fromEntries(names.map((n) => [n, new Element()]));
const events = {},
  actions = [];
const context = {
  window: {
    DAYBREAK_COMMANDS: {
      favourites: () => [
        { name: 'GitHub', url: 'https://github.com/' },
        { name: 'Bad', url: 'javascript:bad()' },
      ],
      theme: () => 'system',
      palette: () => 'daybreak',
      palettes: () => [
        [
          'daybreak',
          {
            name: 'Daybreak',
            description: 'Warm',
            light: Array(10).fill('#ffffff'),
            dark: Array(10).fill('#111111'),
          },
        ],
        [
          'hacker',
          {
            name: 'Hacker',
            description: 'Green',
            light: Array(10).fill('#eeeeee'),
            dark: Array(10).fill('#222222'),
          },
        ],
      ],
      run: (...args) => actions.push(args),
    },
  },
  document: {
    documentElement: { dataset: { theme: 'light' } },
    querySelector: (s) =>
      s === 'dialog[open]'
        ? elements['command-menu'].open
          ? elements['command-menu']
          : null
        : elements[s.slice(1)],
    createElement: () => new Element(),
    addEventListener: (k, fn) => (events[k] = fn),
  },
  location: {},
  URL,
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('menu.js', 'utf8'), context);
const input = elements['command-query'],
  list = elements['command-results'],
  dialog = elements['command-menu'];
const key = (key, extra = {}) =>
  input.onkeydown({ key, preventDefault() {}, stopPropagation() {}, ...extra });
const query = (text) => {
  input.value = text;
  input.oninput();
};
const open = () => events.keydown({ ctrlKey: true, key: 'k', preventDefault() {} });
open();
assert(dialog.open);
assert.equal(list.children.length, 4);
query('task buy milk');
key('Enter');
assert.deepEqual(actions.pop(), ['task', 'buy milk']);
assert(!dialog.open);
open();
query('focus 25');
key('Enter');
assert.deepEqual(actions.pop(), ['focus', 25]);
open();
query('focus 181');
assert.equal(list.children.length, 0);
key('Enter');
assert(dialog.open);
query('task ' + 'x'.repeat(501));
assert.equal(list.children.length, 0);
query('theme');
assert.equal(list.children.length, 2);
key('End');
key('Enter');
assert.deepEqual(actions.pop(), ['palette', 'hacker']);
open();
query('GitHub');
key('Home');
key('Enter');
assert.equal(context.location.href, 'https://github.com/');
open();
query('Connect accounts');
key('Enter');
assert.deepEqual(actions.pop(), ['accounts', null]);
events.keydown({ ctrlKey: true, key: 'k', preventDefault() {} });
assert(dialog.open);
key('ArrowUp');
assert.equal(input.attrs['aria-activedescendant'], 'command-option-3');
events.keydown({ ctrlKey: true, key: 'k', preventDefault() {} });
assert(!dialog.open);
assert(!fs.readFileSync('index.html', 'utf8').includes('id="menu-open"'));
console.log(
  'PASS: no Menu button, flat quick actions, safe favourites, search, task/focus commands, range limits, keyboard wrap, Ctrl+K toggle',
);
