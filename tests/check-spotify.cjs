const vm = require('vm'),
  fs = require('fs'),
  assert = require('assert');
class Element {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.attrs = {};
    this.hidden = false;
    this.textContent = '';
  }
  append(...nodes) {
    this.children.push(...nodes);
  }
  setAttribute(k, v) {
    this.attrs[k] = v;
  }
  getAttribute(k) {
    return this.attrs[k] ?? null;
  }
  removeAttribute(k) {
    delete this.attrs[k];
  }
  remove() {}
  set src(v) {
    this.attrs.src = v;
  }
  get src() {
    return this.attrs.src;
  }
}
const body = new Element('div'),
  requests = [];
const context = {
  window: {},
  document: {
    hidden: false,
    createElement: (tag) => new Element(tag),
    querySelector: () => body,
    head: { append() {} },
    addEventListener() {},
  },
  URL,
  Date,
  AbortController,
  setInterval() {},
  setTimeout() {
    return 1;
  },
  clearTimeout() {},
  fetch: async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => ({ message: 'sent' }) };
  },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('spotify-widget.js', 'utf8'), context);
const render = context.window.DAYBREAK_RENDER_SPOTIFY;
const find = (node, cls) =>
  node.className === cls ? node : node.children.map((n) => find(n, cls)).find(Boolean);
(async () => {
  render(body);
  const controls = find(body, 'spotify-controls'),
    play = controls.children[1];
  assert(play.disabled);
  context.window.DAYBREAK_SPOTIFY = {
    status: 'connected',
    checkedAt: Date.now(),
    title: '<script>safe text</script>',
    artist: 'Example',
    artwork: 'https://evil.example/art',
    url: 'javascript:bad()',
    duration: 180000,
    progress: 3000,
    playing: true,
    device: 'Desktop',
    controlKey: 'local-key',
    allowed: { pause: true, play: true, next: false, previous: true },
  };
  render(body);
  assert(!play.disabled);
  assert.equal(find(body, 'spotify-title').textContent, '<script>safe text</script>');
  assert.equal(find(body, 'spotify-title').href, 'https://open.spotify.com/');
  assert(find(body, 'spotify-art').hidden);
  assert(controls.children[2].disabled);
  await play.onclick();
  assert.equal(requests.length, 1);
  assert.equal(JSON.parse(requests[0].options.body).action, 'pause');
  assert.equal(requests[0].options.headers['X-Daybreak-Spotify'], 'local-key');
  assert.equal(find(body, 'spotify-controls').children[1], play);
  context.window.DAYBREAK_SPOTIFY.checkedAt = Date.now() - 45000;
  render(body);
  assert(play.disabled);
  assert.match(find(body, 'spotify-status').textContent, /saved track/);
  context.window.DAYBREAK_SPOTIFY = { status: 'idle', checkedAt: Date.now() };
  render(body);
  assert(play.disabled);
  assert.match(find(body, 'spotify-status').textContent, /Open Spotify/);
  context.window.DAYBREAK_SPOTIFY = { status: 'disconnected', checkedAt: Date.now() };
  render(body);
  assert.equal(find(body, 'spotify-art').getAttribute('src'), null);
  console.log(
    'PASS: Spotify empty/live/stale states, safe metadata/artwork, restricted controls, command transport and stable button focus',
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
