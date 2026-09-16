(() => {
  // Each palette has a separate light and dark surface set.
  const themes = {
    daybreak: {
      name: 'Daybreak',
      description: 'Warm cream · sage',
      light: [
        '#f5f3ed',
        '#fdfcf9',
        '#333a33',
        '#70746a',
        '#dfdfd5',
        '#eaece3',
        '#536148',
        '#eeeadd',
        '#394733',
        '#f3f2e9',
      ],
      dark: [
        '#1d2420',
        '#262e28',
        '#dce2d8',
        '#a7b2a2',
        '#3c483e',
        '#333f34',
        '#b1c49f',
        '#2b342a',
        '#303e32',
        '#e0e7d9',
      ],
    },
    fireside: {
      name: 'Fireside',
      description: 'Cosy reading room · walnut & candlelight',
      light: [
        '#e9dac5',
        '#fff4e2',
        '#443022',
        '#69513e',
        '#d1b798',
        '#e4cdb0',
        '#914729',
        '#f4e3c5',
        '#58392d',
        '#fff1d9',
      ],
      dark: [
        '#211914',
        '#30231c',
        '#f4e1c4',
        '#c8ad8d',
        '#604733',
        '#433023',
        '#e9ad79',
        '#3a2b20',
        '#573729',
        '#ffe6bd',
      ],
    },
    nord: {
      name: 'Nord',
      description: 'Cool slate · blue',
      light: [
        '#eceff4',
        '#f8fafc',
        '#2e3440',
        '#526078',
        '#ccd3de',
        '#e0e7ef',
        '#365c79',
        '#e5edf2',
        '#365269',
        '#f4f8fc',
      ],
      dark: [
        '#242b36',
        '#2e3745',
        '#e5e9f0',
        '#adb9cb',
        '#455265',
        '#384658',
        '#9ac9db',
        '#303e4c',
        '#364d61',
        '#e5eff6',
      ],
    },
    gruvbox: {
      name: 'Gruvbox',
      description: 'Earth · soft amber',
      light: [
        '#f5ebcf',
        '#fbf3dc',
        '#3c3836',
        '#70604d',
        '#d9cba7',
        '#ecdfba',
        '#805514',
        '#ede2c3',
        '#665039',
        '#fff4d6',
      ],
      dark: [
        '#272522',
        '#32302b',
        '#ebdbb2',
        '#bdae93',
        '#514b3c',
        '#423c30',
        '#d5b260',
        '#373229',
        '#514333',
        '#f0dfb7',
      ],
    },
    rosepine: {
      name: 'Rose Pine',
      description: 'Dusty rose · muted violet',
      light: [
        '#faf4ed',
        '#fffaf5',
        '#49465e',
        '#756b83',
        '#e4d8df',
        '#f0e1e7',
        '#8c476c',
        '#f0e5ec',
        '#6c506d',
        '#fff5f9',
      ],
      dark: [
        '#211e2e',
        '#2b273b',
        '#e0def4',
        '#b0a6c6',
        '#494058',
        '#393047',
        '#dfacc2',
        '#322b40',
        '#4b3a53',
        '#f2dfed',
      ],
    },
    tokyonight: {
      name: 'Tokyo Night',
      description: 'Midnight blue · lavender',
      light: [
        '#edf0f8',
        '#f9faff',
        '#303c60',
        '#626e8b',
        '#cfd6e7',
        '#e1e6f4',
        '#515caf',
        '#e6e6f5',
        '#455078',
        '#f7f8ff',
      ],
      dark: [
        '#1a1e30',
        '#242a40',
        '#d7dff5',
        '#a4afcb',
        '#3e4865',
        '#303955',
        '#aab3ef',
        '#2b3049',
        '#394363',
        '#e5e9ff',
      ],
    },
    hacker: {
      name: 'Hacker',
      description: 'Terminal green · graphite',
      light: [
        '#edf3e9',
        '#f8fcf5',
        '#243c2b',
        '#55705c',
        '#c9d9c8',
        '#dcebd9',
        '#2d693d',
        '#e2efdc',
        '#294f33',
        '#efffee',
      ],
      dark: [
        '#101b16',
        '#19271f',
        '#d5edd8',
        '#9bbc9f',
        '#324a38',
        '#233c2a',
        '#8aca92',
        '#1d3023',
        '#2b4933',
        '#dcf4df',
      ],
    },
    retro: {
      name: 'Retro',
      description: 'Parchment · burnt orange',
      light: [
        '#f4e9d5',
        '#fff5e4',
        '#493d32',
        '#7d6956',
        '#ddc8aa',
        '#edddc2',
        '#98512e',
        '#eddfbb',
        '#734a35',
        '#fff1db',
      ],
      dark: [
        '#2b2420',
        '#382e26',
        '#f0dec0',
        '#c1a98c',
        '#564737',
        '#493b2d',
        '#e1ae7d',
        '#403427',
        '#604533',
        '#fae5c7',
      ],
    },
    cyberpunk: {
      name: 'Cyberpunk',
      description: 'Ink violet · cyan & pink',
      light: [
        '#f0edf7',
        '#fcfaff',
        '#3e3554',
        '#746584',
        '#d9cee6',
        '#e9dff2',
        '#8b3e82',
        '#eee1f1',
        '#654073',
        '#fff5ff',
      ],
      dark: [
        '#191624',
        '#252035',
        '#ece0f6',
        '#b9a6c9',
        '#493b5b',
        '#372a49',
        '#e3a1d2',
        '#2e233d',
        '#443151',
        '#f7e4fa',
      ],
    },
  };
  const tokens = [
    'page',
    'surface',
    'text',
    'muted',
    'line',
    'soft',
    'accent',
    'note',
    'ink',
    'on-ink',
  ];
  // Local system font stacks keep every theme available offline.
  const typography = {
    fireside: {
      body: "'Segoe UI',Arial,sans-serif",
      display: "'Book Antiqua','Palatino Linotype',Georgia,serif",
      weight: 400,
      spacing: '-.04em',
      radius: '22px',
    },
    nord: {
      body: "'Segoe UI',Arial,sans-serif",
      display: "'Segoe UI Light','Segoe UI',sans-serif",
      weight: 300,
      spacing: '-.045em',
      radius: '14px',
    },
    gruvbox: {
      body: 'Cambria,Georgia,serif',
      display: "'Book Antiqua','Palatino Linotype',serif",
      weight: 700,
      spacing: '-.035em',
      radius: '6px',
    },
    rosepine: {
      body: "'Segoe UI',Arial,sans-serif",
      display: "'Palatino Linotype',Palatino,Georgia,serif",
      weight: 400,
      spacing: '-.04em',
      radius: '18px',
    },
    tokyonight: {
      body: "'Segoe UI',Arial,sans-serif",
      display: "Bahnschrift,'Arial Narrow',sans-serif",
      weight: 600,
      spacing: '-.025em',
      radius: '8px',
    },
    hacker: {
      body: "Consolas,'Courier New',monospace",
      display: "Consolas,'Courier New',monospace",
      weight: 400,
      spacing: '-.06em',
      radius: '2px',
    },
    retro: {
      body: "'Courier New',Courier,monospace",
      display: "'Courier New',Courier,monospace",
      weight: 700,
      spacing: '-.065em',
      radius: '3px',
    },
    cyberpunk: {
      body: "Bahnschrift,'Segoe UI',sans-serif",
      display: "Impact,'Arial Narrow',sans-serif",
      weight: 400,
      spacing: '.015em',
      radius: '2px',
    },
  };
  let css = '';
  for (const [id, t] of Object.entries(typography)) {
    const s = `:root[data-palette="${id}"]`;
    css += `
      ${s} body {
        font-family: ${t.body};
        --theme-display: ${t.display};
      }
      ${s} .intro h1,
      ${s} .brand,
      ${s} .timer-number,
      ${s} .portal-title strong {
        font-family: ${t.display};
        font-weight: ${t.weight};
        letter-spacing: ${t.spacing};
      }
      ${s} .tile {
        border-radius: ${t.radius};
      }
      ${s} .clock-time {
        font-family: ${t.display};
        font-variant-numeric: tabular-nums;
      }
      ${s} .tile-head h2 {
        font-family: ${t.body};
      }
    `;
  }
  css += `
:root[data-palette="rosepine"] .intro h1 {
  font-style: italic;
}
:root[data-palette="hacker"] .tile-head h2,
:root[data-palette="cyberpunk"] .tile-head h2 {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 14px;
}
:root[data-palette="retro"] .tile:not([data-widget="clock"]):not([data-widget="links"]) {
  box-shadow: 4px 4px 0 var(--line);
}
:root[data-palette="cyberpunk"] .intro h1 {
  text-transform: uppercase;
}
:root[data-palette="cyberpunk"] .tile:not([data-widget="clock"]):not([data-widget="links"]) {
  border-top: 2px solid var(--accent);
}
:root[data-palette="hacker"] .intro h1,
:root[data-palette="retro"] .intro h1,
:root[data-palette="cyberpunk"] .intro h1 {
  overflow-wrap: anywhere;
}
`;
  for (const [id, t] of Object.entries(themes)) {
    if (id === 'daybreak') continue;
    for (const [mode, colours] of [
      ['light', t.light],
      ['evening', t.dark],
    ]) {
      const selector = `:root[data-palette="${id}"][data-theme="${mode}"]`;
      css += `
        ${selector} {
          background: ${colours[0]};
        }
        ${selector} body {
          ${tokens.map((token, i) => `--${token}: ${colours[i]}`).join(';\n          ')};
        }
      `;
    }
  }
  css += `
:root[data-palette]:not([data-palette="daybreak"]) body .tile[data-widget="timer"] {
  background: var(--ink);
  color: var(--on-ink);
}
:root[data-palette]:not([data-palette="daybreak"]) body .timer-controls .primary {
  background: var(--on-ink);
  color: var(--ink);
}
:root[data-palette]:not([data-palette="daybreak"]) body .timer-controls button,
:root[data-palette]:not([data-palette="daybreak"]) body .duration {
  border-color: color-mix(in srgb, var(--on-ink) 25%, transparent);
}
:root[data-palette]:not([data-palette="daybreak"]) body .link-icon {
  background: var(--soft);
  color: var(--accent);
}
:root[data-palette="cyberpunk"] .tile-symbol,
:root[data-palette="cyberpunk"] .brand-mark {
  color: var(--cyber-secondary);
}
:root[data-palette="cyberpunk"][data-theme="light"] {
  --cyber-secondary: #21677a;
}
:root[data-palette="cyberpunk"][data-theme="evening"] {
  --cyber-secondary: #91d7de;
}
/* Fireside: upholstered panels, paper notes and a warm reading-room glow. */
:root[data-palette="fireside"] body {
  background-image: radial-gradient(
    ellipse at 50% 0%,
    color-mix(in srgb, var(--accent) 12%, transparent),
    transparent 65%
  );
  --shadow: 0 8px 24px #23130810, inset 0 1px 0 #fff3;
}
:root[data-palette="fireside"] .topbar {
  border-bottom-style: double;
  border-bottom-width: 3px;
}
:root[data-palette="fireside"] .brand {
  font-style: italic;
}
:root[data-palette="fireside"] .intro h1 {
  font-style: italic;
  letter-spacing: -0.045em;
  text-shadow: 0 2px 0 color-mix(in srgb, var(--surface) 70%, transparent);
}
:root[data-palette="fireside"] .eyebrow {
  letter-spacing: 0.18em;
  color: var(--muted);
}
:root[data-palette="fireside"]
  .tile:not([data-widget="links"]):not([data-widget="clock"]):not([data-widget="timer"]) {
  border: 1px solid var(--line);
  box-shadow:
    var(--shadow),
    inset 0 0 0 5px color-mix(in srgb, var(--soft) 40%, transparent);
}
:root[data-palette="fireside"] .tile-head h2 {
  font:
    italic 18px/1.2 "Book Antiqua",
    "Palatino Linotype",
    Georgia,
    serif;
  letter-spacing: -0.02em;
}
:root[data-palette="fireside"] .tile-symbol {
  font-size: 16px;
  opacity: 0.8;
}
:root[data-palette="fireside"] .link-card a {
  border-radius: 16px;
  box-shadow: 0 3px 0 var(--line);
  background: var(--surface);
}
:root[data-palette="fireside"] body .link-icon {
  border-radius: 50%;
  background: var(--soft);
  color: var(--accent);
}
:root[data-palette="fireside"] .tile[data-widget="search"] {
  border-radius: 30px;
}
:root[data-palette="fireside"] button,
:root[data-palette="fireside"] .button {
  border-radius: 12px;
}
:root[data-palette="fireside"] .search-form button {
  border-radius: 24px;
}
:root[data-palette="fireside"] .notes {
  font-family: Cambria, Georgia, serif;
  font-size: 18px;
  background: none;
}
:root[data-palette="fireside"] .tile[data-widget="notes"] .tile-head {
  border-bottom: 1px dashed var(--line);
}
:root[data-palette="fireside"] .tile[data-widget="notes"] .tile-head:after {
  content: "A quiet thought";
  font-family: Georgia, serif;
}
:root[data-palette="fireside"] body .tile[data-widget="timer"] {
  border: 1px solid color-mix(in srgb, var(--on-ink) 25%, transparent);
  box-shadow:
    inset 0 0 0 5px #ffffff08,
    0 8px 24px #23130818;
}
:root[data-palette="fireside"] .timer-number {
  font-style: italic;
}
:root[data-palette="fireside"] .clock-time {
  font-style: italic;
  letter-spacing: -0.045em;
}
:root[data-palette="fireside"] dialog {
  border-radius: 22px;
}
.palette-spectacle[data-effect="fireside"] .portal-ray {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 12px currentColor;
  animation-name: fireside-ember;
  animation-duration: 1900ms;
}
.palette-spectacle[data-effect="fireside"] .portal-ring {
  border-style: solid;
  border-width: 1px;
  filter: blur(3px);
}
.palette-spectacle[data-effect="fireside"] .portal-title strong {
  font-style: italic;
}
@keyframes fireside-ember {
  0% {
    transform: rotate(var(--angle)) translateX(3vmax);
    opacity: 0;
  }
  25% {
    opacity: 0.9;
  }
  100% {
    transform: translateY(-35vh) rotate(var(--angle)) translateX(45vmax);
    opacity: 0;
  }
}
.palette-spectacle {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  overflow: hidden;
  background: transparent;
  color: var(--portal-colour);
  pointer-events: none !important;
  z-index: 2147483647;
  isolation: isolate;
}
.palette-spectacle::backdrop {
  background: transparent;
  pointer-events: none;
}
.palette-spectacle .portal-glow {
  position: absolute;
  inset: -50%;
  background: radial-gradient(
    ellipse at center,
    color-mix(in srgb, var(--portal-colour) 35%, transparent),
    transparent 50%
  );
  opacity: 0;
  animation: portal-glow 1900ms ease-out both;
}
.portal-ring {
  position: absolute;
  left: 50%;
  top: 42%;
  width: 36vmax;
  height: 36vmax;
  border: 2px solid currentColor;
  border-radius: 50%;
  box-shadow:
    0 0 30px color-mix(in srgb, currentColor 30%, transparent),
    inset 0 0 30px color-mix(in srgb, currentColor 20%, transparent);
  animation: portal-ring 1800ms cubic-bezier(0.16, 0.7, 0.2, 1) both;
}
.portal-ring:nth-of-type(2) {
  border-style: dashed;
  animation-delay: 100ms;
  animation-duration: 1900ms;
}
.portal-ring:nth-of-type(3) {
  border-width: 8px;
  opacity: 0.4;
  animation-delay: 180ms;
}
.portal-ray {
  position: absolute;
  left: 50%;
  top: 42%;
  width: 22vmax;
  height: 2px;
  transform-origin: 0 50%;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  animation: portal-ray 1400ms ease-out both;
  animation-delay: var(--delay);
}
.portal-title {
  position: absolute;
  top: 42%;
  left: 50%;
  text-align: center;
  width: 90%;
  transform: translate(-50%, -50%);
  animation: portal-title 1600ms ease both;
  text-shadow: 0 3px 24px var(--portal-bg);
  font-family: "Segoe UI", Arial, sans-serif;
}
.portal-title small {
  display: block;
  font-size: 12px;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.portal-title strong {
  font:
    normal clamp(38px, 8vw, 90px)/1 Georgia,
    serif;
  letter-spacing: -0.035em;
}
@keyframes portal-glow {
  0% {
    opacity: 0;
    transform: scale(0.2);
  }
  25% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.2);
  }
}
@keyframes portal-ring {
  0% {
    transform: translate(-50%, -50%) scale(0.02) rotate(-100deg);
    opacity: 0;
  }
  15% {
    opacity: 0.75;
  }
  100% {
    transform: translate(-50%, -50%) scale(5) rotate(80deg);
    opacity: 0;
  }
}
@keyframes portal-ray {
  0% {
    transform: rotate(var(--angle)) translateX(0) scaleX(0.1);
    opacity: 0;
  }
  20% {
    opacity: 0.65;
  }
  100% {
    transform: rotate(var(--angle)) translateX(85vmax) scaleX(1.8);
    opacity: 0;
  }
}
@keyframes portal-title {
  0% {
    opacity: 0;
    filter: blur(12px);
    transform: translate(-50%, -50%) scale(0.6);
  }
  25%,
  48% {
    opacity: 1;
    filter: blur(0);
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    filter: blur(4px);
    transform: translate(-50%, -65%) scale(1.14);
  }
}
@media (prefers-reduced-motion: reduce) {
  .palette-spectacle {
    display: none !important;
  }
}
.palette-swatches {
  display: flex;
  gap: 3px;
  margin-left: 5px;
}
.palette-swatches i {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid var(--line);
}
`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  let cleanup = () => {};
  function switchTo(id, update) {
    if (!Object.prototype.hasOwnProperty.call(themes, id)) return;
    cleanup();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      update();
      return 'reduced-motion';
    }
    update();
    const colours =
      document.documentElement.dataset.theme === 'evening' ? themes[id].dark : themes[id].light;
    const overlay = document.createElement('div');
    overlay.className = 'palette-spectacle';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('popover', 'manual');
    overlay.setAttribute('data-effect', id);
    overlay.style.setProperty('--portal-colour', colours[6]);
    overlay.style.setProperty('--portal-bg', colours[0]);
    const glow = document.createElement('div');
    glow.className = 'portal-glow';
    overlay.append(glow);
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('i');
      ring.className = 'portal-ring';
      overlay.append(ring);
    }
    for (let i = 0; i < 24; i++) {
      const ray = document.createElement('i');
      ray.className = 'portal-ray';
      ray.style.setProperty('--angle', `${i * 15}deg`);
      ray.style.setProperty('--delay', `${(i % 5) * 35}ms`);
      overlay.append(ray);
    }
    const title = document.createElement('div');
    title.className = 'portal-title';
    const caption = document.createElement('small');
    caption.textContent = id === 'fireside' ? 'Make yourself at home' : 'Entering';
    const name = document.createElement('strong');
    name.textContent = themes[id].name;
    title.append(caption, name);
    overlay.append(title);
    document.body.append(overlay);
    try {
      overlay.showPopover?.();
    } catch {
      overlay.removeAttribute('popover');
    }
    const page = document.querySelector('main');
    const animation = page?.animate?.(
      [
        {
          clipPath: 'circle(0% at 50% 35%)',
          transform: 'perspective(1200px) scale(.82) rotateX(7deg)',
          filter: 'blur(9px)',
        },
        {
          offset: 0.65,
          clipPath: 'circle(110% at 50% 35%)',
          transform: 'perspective(1200px) scale(1.02) rotateX(0deg)',
          filter: 'blur(0px)',
        },
        {
          clipPath: 'circle(150% at 50% 35%)',
          transform: 'perspective(1200px) scale(1) rotateX(0deg)',
          filter: 'blur(0px)',
        },
      ],
      { duration: 1650, easing: 'cubic-bezier(.16,.65,.22,1)' },
    );
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const stop = () => {
      clearTimeout(timer);
      animation?.cancel();
      overlay.remove();
      reduced.removeEventListener?.('change', stop);
    };
    const timer = setTimeout(stop, 2200);
    reduced.addEventListener?.('change', stop);
    cleanup = stop;
    return 'animated';
  }
  window.DAYBREAK_THEMES = { themes, switchTo };
})();
