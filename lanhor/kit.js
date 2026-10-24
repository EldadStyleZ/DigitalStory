/* Kit — shared shell for the לנהור toys.
 *
 * A toy page loads kit.css + kit.js, then calls Kit.init({...}) once with its config.
 * Kit owns: the full-window canvas (DPR aware), the game loop, pause / reset / speed,
 * the Sprites <-> Shapes view switch (persisted across toys), help overlay, tweak drawer,
 * bottom toolbar + stats, toasts, synthesized sound effects, keyboard + pointer routing.
 *
 * Global keys (reserved, do not reuse in toys):
 *   Space pause · R reset · V sprites/shapes · H or ? help · T tweaks · F fullscreen · M sound · Esc close
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- storage (never throws)
  const store = (area) => ({
    get(k, d) { try { const v = window[area].getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { window[area].setItem(k, String(v)); } catch (e) { /* storage blocked */ } },
  });
  const LS = store('localStorage');
  const SS = store('sessionStorage');

  // ---------------------------------------------------------------- icons (24px stroke, currentColor)
  const svg = (body, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;
  const ICONS = {
    home: svg('<path d="M15 18l-6-6 6-6"/>'),
    pause: svg('<rect x="6.5" y="5" width="3.5" height="14" rx="1"/><rect x="14" y="5" width="3.5" height="14" rx="1"/>'),
    play: svg('<path d="M7 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L8.5 4.64A1 1 0 0 0 7 5.5z"/>'),
    reset: svg('<path d="M4 12a8 8 0 1 0 2.5-5.8"/><path d="M4 4v4.5h4.5"/>'),
    sound: svg('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
    mute: svg('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path d="M16 10l4 4M20 10l-4 4"/>'),
    tweaks: svg('<path d="M5 6h9M18 6h1M5 12h3M12 12h7M5 18h11M20 18h-1"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8"/><path d="M12 17.2h.01"/>'),
    fullscreen: svg('<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/>'),
    exitFullscreen: svg('<path d="M9 4v4a1 1 0 0 1-1 1H4M20 9h-4a1 1 0 0 1-1-1V4M15 20v-4a1 1 0 0 1 1-1h4M4 15h4a1 1 0 0 1 1 1v4"/>'),
    sprites: svg('<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7h2.1a3.9 3.9 0 0 0 3.9-3.9c0-4-3.8-7.3-8.5-7.3z"/><circle cx="7.6" cy="11.2" r="1.1"/><circle cx="10.2" cy="7.6" r="1.1"/><circle cx="14.6" cy="7.6" r="1.1"/>'),
    shapes: svg('<rect x="3.5" y="13" width="7.5" height="7.5" rx="1"/><circle cx="17" cy="16.75" r="3.75"/><path d="M12 3.5l4.3 7.2H7.7z"/>'),
    close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    trash: svg('<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 12.5h9l1-12.5"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    minus: svg('<path d="M5 12h14"/>'),
    shuffle: svg('<path d="M4 7h3.5c4 0 5 10 9 10H20M4 17h3.5c1.5 0 2.5-1.4 3.3-3.2M13.2 10.2C14 8.4 15 7 16.5 7H20"/><path d="M17.5 4.5L20 7l-2.5 2.5M17.5 14.5L20 17l-2.5 2.5"/>'),
    eye: svg('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
    flag: svg('<path d="M5.5 21V4M5.5 4.5h11l-2.5 4 2.5 4h-11"/>'),
    hand: svg('<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L4 15.2a1.6 1.6 0 0 1 2.4-2l1.6 1.8"/>'),
    square: svg('<rect x="5" y="5" width="14" height="14" rx="1.5"/>'),
    triangle: svg('<path d="M12 4.5l8 14H4z"/>'),
    circle: svg('<circle cx="12" cy="12" r="7.5"/>'),
    bar: svg('<rect x="3.5" y="9.5" width="17" height="5" rx="1"/>'),
    hexagon: svg('<path d="M12 3.5l7.4 4.25v8.5L12 20.5l-7.4-4.25v-8.5z"/>'),
    sparkle: svg('<path d="M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9L12 18.5l-1.9-5.6L4.5 11l5.6-1.9z"/>'),
    lamp: svg('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>'),
    target: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".5"/>'),
  };

  // ---------------------------------------------------------------- utilities
  const TAU = Math.PI * 2;
  const U = {
    TAU,
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    invLerp: (a, b, v) => (v - a) / (b - a),
    smoothstep: (a, b, v) => { const t = U.clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); },
    rand: (a = 0, b = 1) => a + Math.random() * (b - a),
    randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    chance: (p) => Math.random() < p,
    dist: (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
    dist2: (ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; },
    angleDiff: (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; },
    angleLerp: (a, b, t) => a + U.angleDiff(a, b) * t,
    easeOutBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
    easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    hexToRgb(hex) {
      let h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      const n = parseInt(h, 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    },
    rgba(hex, a) { const c = U.hexToRgb(hex); return `rgba(${c.r},${c.g},${c.b},${a})`; },
    mixHex(a, b, t) {
      const A = U.hexToRgb(a), B = U.hexToRgb(b);
      const m = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0');
      return '#' + m(A.r, B.r) + m(A.g, B.g) + m(A.b, B.b);
    },
    /** Seeded PRNG (returns () => [0,1)). */
    mulberry32(seed) {
      let a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    /** Segment-segment intersection; returns t along first segment or -1. */
    segIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
      const rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy;
      const den = rx * sy - ry * sx;
      if (Math.abs(den) < 1e-12) return -1;
      const qx = cx - ax, qy = cy - ay;
      const t = (qx * sy - qy * sx) / den;
      const u = (qx * ry - qy * rx) / den;
      return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : -1;
    },
    pointInPoly(x, y, pts) {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    },
    roundRect(ctx, x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    },
  };

  /** Uniform-grid spatial hash for neighbour queries. */
  class SpatialHash {
    constructor(cell = 32) { this.cell = cell; this.map = new Map(); }
    clear() { for (const b of this.map.values()) b.length = 0; } // keep buckets: no per-frame allocation
    key(cx, cy) { return (cx + 32768) * 65536 + (cy + 32768); }
    insert(obj, x, y) {
      const k = this.key(Math.floor(x / this.cell), Math.floor(y / this.cell));
      let b = this.map.get(k);
      if (!b) { b = []; this.map.set(k, b); }
      b.push(obj);
    }
    /** Calls fn(obj) for every object in cells overlapping the circle (x,y,r). Caller filters by exact distance. */
    query(x, y, r, fn) {
      const c = this.cell;
      const x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c);
      const y0 = Math.floor((y - r) / c), y1 = Math.floor((y + r) / c);
      for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
        const b = this.map.get(this.key(cx, cy));
        if (b) for (let i = 0; i < b.length; i++) fn(b[i]);
      }
    }
  }

  // ---------------------------------------------------------------- sound (WebAudio, synthesized)
  const Sound = {
    ac: null, master: null, noiseBuf: null, last: Object.create(null), voices: 0,
    ensure() {
      if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume().catch(() => {}); return true; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        this.ac = new AC();
        this.master = this.ac.createGain();
        this.master.gain.value = 0.22;
        const comp = this.ac.createDynamicsCompressor();
        this.master.connect(comp).connect(this.ac.destination);
        const len = this.ac.sampleRate * 0.5;
        this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        return true;
      } catch (e) { this.ac = null; return false; }
    },
    tone(type, f0, f1, dur, vol, delay = 0) {
      const ac = this.ac, t = ac.currentTime + delay;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(Math.max(20, f0), t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.master);
      o.start(t); o.stop(t + dur + 0.03);
      this.voices++; o.onended = () => { this.voices--; };
    },
    noise(dur, vol, freq, q = 1, type = 'bandpass', freqEnd = null, delay = 0) {
      const ac = this.ac, t = ac.currentTime + delay;
      const src = ac.createBufferSource(); src.buffer = this.noiseBuf;
      const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q;
      f.frequency.setValueAtTime(freq, t);
      if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
      const g = ac.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur * 0.3));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(this.master);
      src.start(t); src.stop(t + dur + 0.03);
      this.voices++; src.onended = () => { this.voices--; };
    },
    play(name, opts = {}) {
      if (Kit.muted || !this.ac || this.ac.state !== 'running') return;
      const now = performance.now();
      const gap = opts.gap != null ? opts.gap : 45;
      if (this.last[name] && now - this.last[name] < gap) return;
      if (this.voices > 24) return;
      this.last[name] = now;
      const p = opts.pitch || 1, v = opts.vol != null ? opts.vol : 1;
      switch (name) {
        case 'click': this.tone('sine', 1300 * p, 1000 * p, 0.05, 0.22 * v); break;
        case 'toggle': this.tone('sine', 620 * p, 940 * p, 0.08, 0.3 * v); break;
        case 'place': this.tone('triangle', 520 * p, 860 * p, 0.1, 0.45 * v); break;
        case 'remove': this.tone('sine', 720 * p, 260 * p, 0.14, 0.4 * v); break;
        case 'pop': this.tone('sine', 360 * p, 1500 * p, 0.08, 0.42 * v); this.noise(0.05, 0.15 * v, 2400 * p, 1.5); break;
        case 'chime': this.tone('sine', 880 * p, 880 * p, 0.55, 0.3 * v); this.tone('sine', 1320 * p, 1320 * p, 0.6, 0.22 * v, 0.07); break;
        case 'join': this.tone('triangle', 660 * p, 990 * p, 0.13, 0.32 * v); this.tone('sine', 1320 * p, 1480 * p, 0.12, 0.12 * v, 0.04); break;
        case 'lose': this.tone('triangle', 420 * p, 170 * p, 0.2, 0.36 * v); this.noise(0.12, 0.08 * v, 700 * p, 2); break;
        case 'bite': this.noise(0.04, 0.22 * v, 3200 * p, 5); break;
        case 'whoosh': this.noise(0.42, 0.22 * v, 380 * p, 1.2, 'bandpass', 2600 * p); break;
        case 'buzz': this.tone('sawtooth', 170 * p, 140 * p, 0.14, 0.12 * v); break;
        case 'chirp': this.tone('sine', 1800 * p, 2600 * p, 0.06, 0.18 * v); this.tone('sine', 2300 * p, 3000 * p, 0.05, 0.12 * v, 0.06); break;
        case 'bloop': this.tone('sine', 300 * p, 620 * p, 0.12, 0.35 * v); break;
        default: break;
      }
    },
  };

  // ---------------------------------------------------------------- DOM helpers
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------------------------------------------------------------- the Kit
  const Kit = {
    version: 1,
    view: 'sprite',
    paused: false,
    muted: false,
    timeScale: 1,
    time: 0,          // simulation seconds (scaled, excludes pause)
    realTime: 0,      // wall seconds since init
    frame: 0,
    fps: 60,
    W: 0, H: 0, dpr: 1,
    canvas: null, ctx: null,
    playRect: { x: 0, y: 0, w: 0, h: 0 },
    mouse: { x: -9999, y: -9999, inside: false, down: false, button: -1 },
    keys: new Set(),
    tweaks: Object.create(null),
    icons: ICONS,
    util: U,
    SpatialHash,
    cfg: null,
    dom: {},
    get isAbstract() { return this.view === 'abstract'; },
  };

  /** Pick a value by view. Accepts {sprite, abstract} objects or plain values. */
  Kit.t = function (v) {
    if (v && typeof v === 'object' && ('sprite' in v || 'abstract' in v)) return Kit.view === 'abstract' ? v.abstract : v.sprite;
    return v;
  };
  Kit.pick = (spriteVal, abstractVal) => (Kit.view === 'abstract' ? abstractVal : spriteVal);
  Kit.sfx = (name, opts) => Sound.play(name, opts);

  // ---------------------------------------------------------------- view resolution
  function resolveInitialView() {
    try {
      const q = new URLSearchParams(location.search).get('view');
      if (q === 'abstract' || q === 'shapes') return 'abstract';
      if (q === 'sprite' || q === 'sprites') return 'sprite';
    } catch (e) { /* ignore */ }
    const h = (location.hash || '').replace('#', '');
    if (h === 'shapes' || h === 'abstract') return 'abstract';
    if (h === 'sprites' || h === 'sprite') return 'sprite';
    const s = LS.get('lanhor-view', 'sprite');
    return s === 'abstract' ? 'abstract' : 'sprite';
  }

  // ---------------------------------------------------------------- build UI
  function buildUI(cfg) {
    const root = el('div', 'kit-ui');
    root.setAttribute('data-kit', '');

    // top bar
    const top = el('div', 'kit-top');
    const titlebox = el('div', 'kit-titlebox kit-glass');
    const home = el('a', 'kit-home', ICONS.home);
    home.href = cfg.homeHref || 'index.html';
    home.setAttribute('aria-label', 'All toys');
    home.dataset.tip = 'All toys';
    home.addEventListener('click', (e) => {
      // carry the current view to the launcher
      e.preventDefault();
      LS.set('lanhor-view', Kit.view);
      location.href = home.getAttribute('href') + '?view=' + Kit.view;
    });
    const badge = el('span', 'kit-badge', esc(cfg.number || '01'));
    const tt = el('div', 'kit-titletext');
    const h1 = el('h1', 'kit-title');
    const hint = el('p', 'kit-hint');
    tt.append(h1, hint);
    titlebox.append(home, badge, tt);

    const actions = el('div', 'kit-actions kit-glass');
    const seg = el('div', 'kit-seg');
    seg.setAttribute('role', 'group');
    seg.setAttribute('aria-label', 'Look');
    const thumb = el('div', 'kit-seg-thumb');
    const bSprite = el('button', '', ICONS.sprites + '<span>Sprites</span>');
    const bShapes = el('button', '', ICONS.shapes + '<span>Shapes</span>');
    bSprite.type = bShapes.type = 'button';
    bSprite.dataset.tip = 'Drawn look'; bSprite.dataset.key = 'V';
    bShapes.dataset.tip = 'Plain shapes and base colors'; bShapes.dataset.key = 'V';
    bSprite.addEventListener('click', () => Kit.setView('sprite'));
    bShapes.addEventListener('click', () => Kit.setView('abstract'));
    seg.append(thumb, bSprite, bShapes);

    const mk = (icon, tip, key, fn, cls = '') => {
      const b = el('button', 'kit-iconbtn ' + cls, ICONS[icon]);
      b.type = 'button';
      b.setAttribute('aria-label', tip);
      b.dataset.tip = tip;
      if (key) b.dataset.key = key;
      b.addEventListener('click', fn);
      return b;
    };
    const bPause = mk('pause', 'Pause', 'Space', () => Kit.togglePause());
    const bReset = mk('reset', 'Reset', 'R', () => Kit.reset());
    const bMute = mk('sound', 'Sound', 'M', () => Kit.toggleMute(), 'kit-hide-sm');
    const bTweaks = mk('tweaks', 'Tweaks', 'T', () => Kit.toggleTweaks());
    const bHelp = mk('help', 'How to play', 'H', () => Kit.showHelp());
    const bFull = mk('fullscreen', 'Fullscreen', 'F', () => Kit.toggleFullscreen(), 'kit-hide-sm');
    actions.append(seg, el('div', 'kit-sep'), bPause, bReset, bTweaks, bMute, bHelp, bFull);
    top.append(titlebox, actions);

    // toasts + paused
    const toasts = el('div', 'kit-toasts');
    toasts.setAttribute('aria-live', 'polite');
    const paused = el('div', 'kit-paused kit-glass', 'Paused <small>Space to resume</small>');
    paused.hidden = true;

    // bottom
    const bottom = el('div', 'kit-bottom');
    const stats = el('div', 'kit-stats kit-glass');
    const toolbar = el('div', 'kit-toolbar kit-glass');
    const spacer = el('div', 'kit-bottom-spacer');
    bottom.append(stats, toolbar, spacer);

    // drawer
    const drawer = el('aside', 'kit-drawer kit-glass');
    drawer.setAttribute('aria-label', 'Tweaks');
    const dHead = el('div', 'kit-drawer-head', '<h2>Tweaks</h2>');
    const dClose = el('button', 'kit-iconbtn', ICONS.close);
    dClose.type = 'button'; dClose.setAttribute('aria-label', 'Close tweaks');
    dClose.addEventListener('click', () => Kit.toggleTweaks(false));
    dHead.append(dClose);
    const dBody = el('div', 'kit-drawer-body');
    drawer.append(dHead, dBody);

    // help
    const help = el('div', 'kit-help');
    help.hidden = true;

    // tooltip
    const tip = el('div', 'kit-tip');

    root.append(top, toasts, paused, bottom, drawer, help, tip);
    document.body.append(root);

    Kit.dom = { root, top, titlebox, h1, hint, badge, actions, seg, thumb, bSprite, bShapes, bPause, bReset, bMute, bTweaks, bHelp, bFull, toasts, paused, bottom, stats, toolbar, spacer, drawer, dBody, help, tip };
    Kit.toolbar = toolbar;

    // tooltips for anything with data-tip inside the UI
    let tipTimer = 0;
    root.addEventListener('pointerover', (e) => {
      const t = e.target.closest('[data-tip]');
      clearTimeout(tipTimer);
      if (!t || e.pointerType === 'touch') { tip.classList.remove('is-on'); return; }
      tipTimer = setTimeout(() => {
        tip.innerHTML = esc(t.dataset.tip) + (t.dataset.key ? `<kbd>${esc(t.dataset.key)}</kbd>` : '');
        const r = t.getBoundingClientRect();
        const tr = tip.getBoundingClientRect();
        let x = r.left + r.width / 2 - tr.width / 2;
        x = U.clamp(x, 8, window.innerWidth - tr.width - 8);
        const below = r.top < window.innerHeight / 2;
        const y = below ? r.bottom + 8 : r.top - tr.height - 8;
        tip.style.left = x + 'px';
        tip.style.top = y + 'px';
        tip.classList.add('is-on');
      }, 380);
    });
    root.addEventListener('pointerout', (e) => {
      const t = e.target.closest('[data-tip]');
      if (t && !t.contains(e.relatedTarget)) { clearTimeout(tipTimer); tip.classList.remove('is-on'); }
    });
    root.addEventListener('pointerdown', () => { clearTimeout(tipTimer); tip.classList.remove('is-on'); });
    // UI clicks make a soft click sound
    root.addEventListener('click', (e) => { if (e.target.closest('button')) { Sound.ensure(); Sound.play('click', { gap: 20 }); } });
  }

  function layoutSeg() {
    const { seg, thumb, bSprite, bShapes } = Kit.dom;
    const on = Kit.view === 'abstract' ? bShapes : bSprite;
    bSprite.classList.toggle('is-on', Kit.view !== 'abstract');
    bShapes.classList.toggle('is-on', Kit.view === 'abstract');
    bSprite.setAttribute('aria-pressed', String(Kit.view !== 'abstract'));
    bShapes.setAttribute('aria-pressed', String(Kit.view === 'abstract'));
    const sr = seg.getBoundingClientRect(), r = on.getBoundingClientRect();
    if (r.width) { thumb.style.left = r.left - sr.left - 1 + 'px'; thumb.style.width = r.width + 'px'; }
  }

  function applyViewText() {
    const cfg = Kit.cfg;
    const title = Kit.t(cfg.title) || '';
    Kit.dom.h1.textContent = title;
    Kit.dom.hint.textContent = Kit._hintOverride != null ? Kit.t(Kit._hintOverride) : Kit.t(cfg.hint) || '';
    document.title = `${title} · לנהור`;
    document.body.classList.toggle('view-abstract', Kit.view === 'abstract');
    document.body.classList.toggle('view-sprite', Kit.view !== 'abstract');
    // labels that carry {sprite, abstract}
    for (const s of Kit._stats.values()) s.labelEl.textContent = Kit.t(s.label);
    for (const n of Kit._viewTextNodes) { if (n.el.isConnected) n.apply(); }
    buildTweaks();
    if (!Kit.dom.help.hidden) renderHelp();
    layoutSeg();
  }

  // ---------------------------------------------------------------- view switch
  Kit.setView = function (v, opts = {}) {
    v = v === 'abstract' ? 'abstract' : 'sprite';
    if (v === Kit.view && !opts.force) return;
    Kit.view = v;
    LS.set('lanhor-view', v);
    // drop anything still showing the old view's words
    Kit.dom.toasts.replaceChildren();
    Kit.dom.tip.classList.remove('is-on');
    Kit.dom.tip.textContent = '';
    applyViewText();
    if (Kit.cfg.viewChanged) Kit.cfg.viewChanged(v);
    if (!opts.silent) {
      Kit.toast(v === 'abstract' ? 'Shapes on: plain shapes and base colors' : 'Sprites on', { tone: 'info' });
      Sound.play('toggle', { pitch: v === 'abstract' ? 0.8 : 1.1 });
    }
  };
  Kit.toggleView = () => Kit.setView(Kit.view === 'abstract' ? 'sprite' : 'abstract');

  /** Register a DOM node whose text depends on view: Kit.viewText(el, {sprite, abstract}) */
  Kit._viewTextNodes = [];
  Kit.viewText = function (node, val, attr) {
    const rec = { el: node, apply: () => { const t = Kit.t(typeof val === 'function' ? val() : val); if (attr) node.setAttribute(attr, t); else node.textContent = t; } };
    Kit._viewTextNodes.push(rec);
    rec.apply();
    return node;
  };

  // ---------------------------------------------------------------- pause / reset / mute / fullscreen
  Kit.setPaused = function (p) {
    Kit.paused = !!p;
    Kit.dom.paused.hidden = !Kit.paused;
    Kit.dom.bPause.innerHTML = Kit.paused ? ICONS.play : ICONS.pause;
    Kit.dom.bPause.dataset.tip = Kit.paused ? 'Resume' : 'Pause';
    Kit.dom.bPause.classList.toggle('is-on', Kit.paused);
    if (Kit.cfg.pauseChanged) Kit.cfg.pauseChanged(Kit.paused);
  };
  Kit.togglePause = () => { Kit.setPaused(!Kit.paused); Sound.play('toggle', { pitch: Kit.paused ? 0.7 : 1.2 }); };

  Kit.reset = function (opts = {}) {
    if (Kit.cfg.reset) Kit.cfg.reset();
    if (!opts.silent) { Kit.toast('Reset', { tone: 'info' }); Sound.play('whoosh', { pitch: 0.8 }); }
  };

  Kit.setMuted = function (m) {
    Kit.muted = !!m;
    LS.set('lanhor-muted', Kit.muted ? '1' : '0');
    Kit.dom.bMute.innerHTML = Kit.muted ? ICONS.mute : ICONS.sound;
    Kit.dom.bMute.dataset.tip = Kit.muted ? 'Sound off' : 'Sound on';
    Kit.dom.bMute.classList.toggle('is-on', Kit.muted);
  };
  Kit.toggleMute = () => { Kit.setMuted(!Kit.muted); Kit.toast(Kit.muted ? 'Sound off' : 'Sound on', { tone: 'info' }); };

  Kit.toggleFullscreen = function () {
    const d = document;
    try {
      if (!d.fullscreenElement && !d.webkitFullscreenElement) {
        const r = d.documentElement;
        const p = (r.requestFullscreen || r.webkitRequestFullscreen).call(r);
        if (p && p.catch) p.catch(() => Kit.toast('Fullscreen is blocked here. Try F11.', { tone: 'bad' }));
      } else {
        (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      }
    } catch (e) { Kit.toast('Fullscreen is blocked here. Try F11.', { tone: 'bad' }); }
  };
  document.addEventListener('fullscreenchange', () => {
    if (!Kit.dom.bFull) return;
    const on = !!document.fullscreenElement;
    Kit.dom.bFull.innerHTML = on ? ICONS.exitFullscreen : ICONS.fullscreen;
    Kit.dom.bFull.dataset.tip = on ? 'Exit fullscreen' : 'Fullscreen';
  });

  // ---------------------------------------------------------------- toasts
  Kit.toast = function (text, opts = {}) {
    const box = Kit.dom.toasts;
    if (!box) return;
    const out = (n) => { n.classList.add('is-out'); setTimeout(() => n.remove(), 300); };
    // de-dupe identical consecutive toasts
    const lastT = box.lastElementChild;
    if (lastT && lastT.dataset.text === text && !lastT.classList.contains('is-out')) { clearTimeout(lastT._t); lastT._t = setTimeout(() => out(lastT), opts.ms || 1700); return; }
    const t = el('div', 'kit-toast kit-glass' + (opts.tone ? ' is-' + opts.tone : ''));
    t.textContent = text;
    t.dataset.text = text;
    box.append(t);
    while (box.children.length > 3) box.firstElementChild.remove();
    t._t = setTimeout(() => out(t), opts.ms || 1700);
  };

  // ---------------------------------------------------------------- stats
  Kit._stats = new Map();
  function buildStats(list) {
    Kit.dom.stats.innerHTML = '';
    Kit._stats.clear();
    for (const s of list || []) {
      const box = el('div', 'kit-stat');
      const lab = el('span', 'kit-stat-label');
      const val = el('span', 'kit-stat-value', s.value != null ? esc(s.value) : '0');
      box.append(lab, val);
      Kit.dom.stats.append(box);
      Kit._stats.set(s.id, { label: s.label, labelEl: lab, valueEl: val, value: s.value != null ? s.value : 0, box });
      lab.textContent = Kit.t(s.label);
    }
  }
  /** Update a stat. Numbers that change get a bump (green up / red down unless opts.neutral). */
  Kit.setStat = function (id, value, opts = {}) {
    const s = Kit._stats.get(id);
    if (!s || s.value === value) return;
    const prev = s.value;
    s.value = value;
    s.valueEl.textContent = value;
    if (opts.quiet) return;
    const v = s.valueEl;
    v.classList.remove('is-bump', 'is-up', 'is-down');
    void v.offsetWidth;
    v.classList.add('is-bump');
    if (!opts.neutral && typeof value === 'number' && typeof prev === 'number') v.classList.add(value > prev ? 'is-up' : 'is-down');
    clearTimeout(s._t);
    s._t = setTimeout(() => v.classList.remove('is-up', 'is-down'), 450);
  };

  // ---------------------------------------------------------------- toolbar helpers
  Kit.ui = {
    /** A labelled group inside the bottom toolbar. label may be {sprite, abstract}. */
    group(label) {
      const g = el('div', 'kit-group');
      if (label) { const l = el('span', 'kit-group-label'); Kit.viewText(l, label); g.append(l); }
      Kit.toolbar.append(g);
      return g;
    },
    /**
     * button({ parent, label, icon, swatch, key, tip, onClick, iconOnly })
     * label/tip may be {sprite, abstract}. Returns the button element.
     */
    button(o) {
      const b = el('button', 'kit-tool' + (o.swatch ? ' is-swatch' : '') + (o.iconOnly ? ' is-icon' : ''));
      b.type = 'button';
      if (o.swatch) { b.style.setProperty('--sw', o.swatch); b.append(el('span', 'kit-swatch')); }
      if (o.icon) b.insertAdjacentHTML('beforeend', ICONS[o.icon] || o.icon);
      if (o.label && !o.iconOnly) { const s = el('span', 'kit-tool-label'); Kit.viewText(s, o.label); b.append(s); }
      if (o.key && !o.iconOnly) b.append(el('kbd', '', esc(o.key)));
      if (o.tip || o.iconOnly) {
        const tipVal = o.tip || o.label;
        Kit.viewText(b, tipVal, 'data-tip');
        Kit.viewText(b, tipVal, 'aria-label');
      }
      if (o.key) b.dataset.key = o.key;
      if (o.onClick) b.addEventListener('click', (e) => { o.onClick(e); b.blur(); });
      (o.parent || Kit.toolbar).append(b);
      return b;
    },
    readout(parent, text) {
      const r = el('span', 'kit-readout');
      if (text != null) Kit.viewText(r, text);
      (parent || Kit.toolbar).append(r);
      return r;
    },
    setActive(btn, on) { btn.classList.toggle('is-active', !!on); btn.setAttribute('aria-pressed', String(!!on)); },
  };

  // ---------------------------------------------------------------- tweaks drawer
  function buildTweaks() {
    const body = Kit.dom.dBody;
    if (!body) return;
    const scroll = body.scrollTop;
    body.innerHTML = '';
    const list = (Kit.cfg.tweaks || []).concat([
      { type: 'section', label: 'Simulation' },
      { type: 'range', id: '__speed', label: 'Speed', min: 0.25, max: 3, step: 0.25, value: Kit.timeScale, format: (v) => v + '×', onInput: (v) => { Kit.timeScale = v; } },
    ]);
    for (const t of list) {
      if (t.when && !t.when()) continue;
      if (t.type === 'section') { body.append(el('div', 'kit-tw-section', esc(Kit.t(t.label)))); continue; }
      if (t.type === 'note') { body.append(el('div', 'kit-tw-note', esc(Kit.t(t.label)))); continue; }
      if (!(t.id in Kit.tweaks) && t.value !== undefined) Kit.tweaks[t.id] = t.value;
      const cur = Kit.tweaks[t.id];
      if (t.type === 'range') {
        const w = el('div', 'kit-tw');
        const row = el('div', 'kit-tw-row');
        const lab = el('label', 'kit-tw-label', esc(Kit.t(t.label)));
        const id = 'tw-' + t.id;
        lab.htmlFor = id;
        const out = el('span', 'kit-tw-value');
        const fmt = (v) => (t.format ? t.format(v) : String(v));
        out.textContent = fmt(cur);
        row.append(lab, out);
        const inp = el('input', 'kit-range');
        inp.type = 'range'; inp.id = id;
        inp.min = t.min; inp.max = t.max; inp.step = t.step || 1; inp.value = cur;
        const pct = () => inp.style.setProperty('--pct', ((inp.value - t.min) / (t.max - t.min)) * 100 + '%');
        pct();
        inp.addEventListener('input', () => {
          const v = parseFloat(inp.value);
          Kit.tweaks[t.id] = v;
          out.textContent = fmt(v);
          pct();
          if (t.onInput) t.onInput(v);
        });
        // give keys back to the toy after a mouse drag; keyboard users keep focus to keep stepping
        inp.addEventListener('pointerup', () => inp.blur());
        inp.addEventListener('change', () => { if (t.onChange) t.onChange(parseFloat(inp.value)); });
        w.append(row, inp);
        if (t.note) w.append(el('div', 'kit-tw-note', esc(Kit.t(t.note))));
        body.append(w);
      } else if (t.type === 'toggle') {
        const w = el('div', 'kit-tw kit-tw-toggle');
        const lab = el('span', 'kit-tw-label', esc(Kit.t(t.label)));
        const sw = el('button', 'kit-switch');
        sw.type = 'button'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', String(!!cur));
        sw.setAttribute('aria-label', Kit.t(t.label));
        sw.addEventListener('click', () => {
          const v = !Kit.tweaks[t.id];
          Kit.tweaks[t.id] = v;
          sw.setAttribute('aria-checked', String(v));
          if (t.onChange) t.onChange(v);
          sw.blur();
        });
        w.append(lab, sw);
        body.append(w);
        if (t.note) body.append(el('div', 'kit-tw-note', esc(Kit.t(t.note))));
      } else if (t.type === 'choice') {
        const w = el('div', 'kit-tw');
        w.append(el('span', 'kit-tw-label', esc(Kit.t(t.label))));
        const c = el('div', 'kit-tw-choices');
        for (const o of t.options) {
          const b = el('button', o.value === cur ? 'is-on' : '', esc(Kit.t(o.label)));
          b.type = 'button';
          b.addEventListener('click', () => {
            Kit.tweaks[t.id] = o.value;
            for (const x of c.children) x.classList.toggle('is-on', x === b);
            if (t.onChange) t.onChange(o.value);
            b.blur();
          });
          c.append(b);
        }
        w.append(c);
        body.append(w);
      } else if (t.type === 'button') {
        const b = el('button', 'kit-tw-button', esc(Kit.t(t.label)));
        b.type = 'button';
        b.addEventListener('click', () => { if (t.onClick) t.onClick(); b.blur(); });
        body.append(b);
      }
    }
    body.scrollTop = scroll;
  }
  /** Programmatically set a tweak value (updates UI and fires its handler). */
  Kit.setTweak = function (id, v) {
    const t = (Kit.cfg.tweaks || []).find((x) => x.id === id);
    Kit.tweaks[id] = v;
    if (t) { if (t.onInput) t.onInput(v); if (t.onChange) t.onChange(v); }
    buildTweaks();
  };
  Kit.rebuildTweaks = buildTweaks;
  Kit.toggleTweaks = function (force) {
    const d = Kit.dom.drawer;
    const open = force != null ? !!force : !d.classList.contains('is-open');
    d.classList.toggle('is-open', open);
    Kit.dom.bTweaks.classList.toggle('is-on', open);
  };

  // ---------------------------------------------------------------- help overlay
  const GLOBAL_KEYS = [
    { keys: ['Space'], label: 'Pause or resume' },
    { keys: ['R'], label: 'Reset' },
    { keys: ['V'], label: 'Sprites or plain shapes' },
    { keys: ['T'], label: 'Tweaks panel' },
    { keys: ['F'], label: 'Fullscreen' },
    { keys: ['M'], label: 'Sound on or off' },
    { keys: ['H'], label: 'This help' },
  ];
  function renderHelp() {
    const cfg = Kit.cfg;
    const row = (c) => {
      const keys = (Kit.t(c.keys) || []).map((k) => `<kbd class="kit-kbd">${esc(k)}</kbd>`).join('');
      return `<li><span class="kit-help-keys">${keys}</span><span>${esc(Kit.t(c.label))}</span></li>`;
    };
    const controls = (cfg.controls || []).map(row).join('');
    const global = GLOBAL_KEYS.map(row).join('');
    Kit.dom.help.innerHTML = `
      <div class="kit-help-card" role="dialog" aria-modal="true" aria-labelledby="kit-help-title">
        <div class="kit-help-head"><span class="kit-badge">${esc(cfg.number || '01')}</span><h2 id="kit-help-title">${esc(Kit.t(cfg.title))}</h2></div>
        <p class="kit-help-about">${esc(Kit.t(cfg.about) || '')}</p>
        <div class="kit-help-cols">
          <section><h3>How to play</h3><ul class="kit-help-list">${controls}</ul></section>
          <section><h3>Everywhere</h3><ul class="kit-help-list">${global}</ul></section>
        </div>
        <div class="kit-help-foot"><button class="kit-help-go" type="button">Start playing</button><small>or press any key</small></div>
      </div>`;
    Kit.dom.help.querySelector('.kit-help-go').addEventListener('click', (e) => { e.stopPropagation(); Kit.hideHelp(); });
  }
  Kit.showHelp = function () {
    renderHelp();
    Kit.dom.help.hidden = false;
    Kit._helpWasPaused = Kit.paused;
  };
  Kit.hideHelp = function () {
    if (Kit.dom.help.hidden) return;
    Kit.dom.help.hidden = true;
    SS.set('lanhor-help-' + Kit.cfg.id, '1');
    Sound.ensure();
    if (Kit.cfg.helpClosed) Kit.cfg.helpClosed();
  };
  Object.defineProperty(Kit, 'helpOpen', { get: () => !!(Kit.dom.help && !Kit.dom.help.hidden) });

  /** Override the header hint line (e.g. contextual instructions). Pass null to restore. */
  Kit.setHint = function (text) {
    Kit._hintOverride = text;
    Kit.dom.hint.textContent = text != null ? Kit.t(text) : Kit.t(Kit.cfg.hint) || '';
  };

  // ---------------------------------------------------------------- canvas + layout
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth, H = window.innerHeight;
    Kit.W = W; Kit.H = H; Kit.dpr = dpr;
    Kit.canvas.width = Math.round(W * dpr);
    Kit.canvas.height = Math.round(H * dpr);
    computePlayRect();
    layoutSeg();
    if (Kit.cfg && Kit.cfg.resize) Kit.cfg.resize(W, H);
  }
  function computePlayRect() {
    const W = Kit.W, H = Kit.H;
    const ins = Kit.cfg.insets || {};
    const topBar = Kit.dom.top ? Kit.dom.top.getBoundingClientRect().bottom : 62;
    let bottomBar = 0;
    if (Kit.dom.bottom) {
      const r = Kit.dom.bottom.getBoundingClientRect();
      bottomBar = r.height > 0 ? H - r.top : 0;
    }
    const top = ins.top != null ? ins.top : Math.max(64, topBar + 10);
    const bottom = ins.bottom != null ? ins.bottom : Math.max(16, bottomBar + 10);
    const side = ins.side != null ? ins.side : 16;
    Kit.playRect = { x: side, y: top, w: Math.max(100, W - side * 2), h: Math.max(100, H - top - bottom) };
  }
  Kit.relayout = function () { computePlayRect(); if (Kit.cfg.resize) Kit.cfg.resize(Kit.W, Kit.H); };

  // ---------------------------------------------------------------- input
  function pointerInfo(e) {
    const r = Kit.canvas.getBoundingClientRect();
    return {
      x: e.clientX - r.left, y: e.clientY - r.top,
      button: e.button, buttons: e.buttons,
      shift: e.shiftKey, alt: e.altKey, ctrl: e.ctrlKey || e.metaKey,
      type: e.pointerType || 'mouse', id: e.pointerId,
    };
  }
  function bindInput() {
    const c = Kit.canvas, cfg = Kit.cfg;
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('pointerdown', (e) => {
      Sound.ensure();
      if (Kit.dom.drawer.classList.contains('is-open') && e.pointerType === 'touch') Kit.toggleTweaks(false);
      try { c.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      const p = pointerInfo(e);
      Kit.mouse.x = p.x; Kit.mouse.y = p.y; Kit.mouse.down = true; Kit.mouse.button = e.button; Kit.mouse.inside = true;
      c.focus({ preventScroll: true });
      if (cfg.pointerDown) cfg.pointerDown(p, e);
    });
    c.addEventListener('pointermove', (e) => {
      const p = pointerInfo(e);
      Kit.mouse.x = p.x; Kit.mouse.y = p.y; Kit.mouse.inside = true;
      if (cfg.pointerMove) cfg.pointerMove(p, e);
    });
    const up = (e) => {
      const p = pointerInfo(e);
      Kit.mouse.down = false; Kit.mouse.button = -1;
      if (cfg.pointerUp) cfg.pointerUp(p, e);
    };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('pointerleave', () => { Kit.mouse.inside = false; if (cfg.pointerLeave) cfg.pointerLeave(); });
    c.addEventListener('wheel', (e) => { e.preventDefault(); if (cfg.wheel) cfg.wheel(pointerInfo(e), e); }, { passive: false });
    c.addEventListener('dblclick', (e) => { if (cfg.dblclick) cfg.dblclick(pointerInfo(e), e); });

    window.addEventListener('keydown', (e) => {
      Sound.ensure();
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) { Kit.keys.add(e.code); return; }
      if (Kit.helpOpen) {
        if (e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        Kit.hideHelp();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return; // leave browser shortcuts alone
      const tag = (e.target && e.target.tagName) || '';
      const inRange = tag === 'INPUT';
      if (inRange && /^Arrow/.test(e.key)) return; // let sliders use arrows
      if (tag === 'BUTTON' && (e.code === 'Space' || e.code === 'Enter')) {
        // a focused button would also "click" on Space; blur it so Space stays pause
        if (e.code === 'Space') { e.preventDefault(); e.target.blur(); } else return;
      }
      Kit.keys.add(e.code);
      if (cfg.keydown && cfg.keydown(e) === true) { e.preventDefault(); return; }
      let handled = true;
      switch (e.code) {
        case 'Space': Kit.togglePause(); break;
        case 'KeyR': Kit.reset(); break;
        case 'KeyV': Kit.toggleView(); break;
        case 'KeyH': Kit.showHelp(); break;
        case 'Slash': if (e.shiftKey) Kit.showHelp(); else handled = false; break;
        case 'KeyT': Kit.toggleTweaks(); break;
        case 'KeyF': Kit.toggleFullscreen(); break;
        case 'KeyM': Kit.toggleMute(); break;
        case 'Escape':
          if (Kit.dom.drawer.classList.contains('is-open')) Kit.toggleTweaks(false);
          else if (cfg.escape) cfg.escape();
          break;
        default: handled = false;
      }
      if (handled || /^Arrow/.test(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      Kit.keys.delete(e.code);
      if (cfg.keyup) cfg.keyup(e);
    });
    window.addEventListener('blur', () => { Kit.keys.clear(); Kit.mouse.down = false; });
    window.addEventListener('resize', resize);
  }
  /** True if any of the given KeyboardEvent.code values is held. */
  Kit.held = (...codes) => codes.some((c) => Kit.keys.has(c));

  // ---------------------------------------------------------------- loop
  let lastT = 0, fpsAcc = 0, fpsN = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const t = now / 1000;
    let dt = lastT ? t - lastT : 1 / 60;
    lastT = t;
    if (dt > 0.1) dt = 0.1; // tab switch / hitch
    Kit.realTime += dt;
    fpsAcc += dt; fpsN++;
    if (fpsAcc >= 0.5) { Kit.fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
    const sdt = Math.min(dt, 1 / 20) * Kit.timeScale;
    if (!Kit.paused && !Kit.helpOpen) {
      Kit.time += sdt;
      if (Kit.cfg.update) Kit.cfg.update(sdt, Kit.time);
    }
    const ctx = Kit.ctx;
    ctx.setTransform(Kit.dpr, 0, 0, Kit.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (Kit.cfg.render) Kit.cfg.render(ctx, dt);
    Kit.frame++;
  }

  // ---------------------------------------------------------------- init
  /**
   * Kit.init(cfg)
   *  id, number, accent, accentInk         identity + accent color
   *  title, hint, about                     {sprite, abstract} strings
   *  controls: [{keys:[...], label}]        toy-specific help rows (label may be {sprite, abstract})
   *  stats:    [{id, label, value}]         bottom-left counters
   *  tweaks:   [{type:'section'|'range'|'toggle'|'choice'|'button'|'note', id, label, ...}]
   *  insets:   {top, bottom, side}          optional override for Kit.playRect
   *  Call order on init: resize → setup → viewChanged → resize (after the toolbar exists) → reset.
   *  setup(), reset(), update(dt, t), render(ctx, realDt), resize(W, H), viewChanged(view),
   *  pointerDown(p, e), pointerMove(p, e), pointerUp(p, e), pointerLeave(), wheel(p, e), dblclick(p, e),
   *  keydown(e) -> return true if handled, keyup(e), escape(), pauseChanged(paused), helpClosed()
   */
  Kit.init = function (cfg) {
    Kit.cfg = cfg;
    if (!document.querySelector('link[data-kit-fonts]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.dataset.kitFonts = '';
      l.href = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fredoka:wght@400;500;600;700&family=Rubik:wght@400;500;600&display=swap';
      document.head.append(l);
    }
    const rs = document.documentElement.style;
    if (cfg.accent) rs.setProperty('--accent', cfg.accent);
    if (cfg.accentInk) rs.setProperty('--accent-ink', cfg.accentInk);

    Kit.view = resolveInitialView();
    Kit.muted = LS.get('lanhor-muted', '0') === '1';

    const canvas = document.createElement('canvas');
    canvas.id = 'kit-canvas';
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Toy canvas');
    document.body.prepend(canvas);
    Kit.canvas = canvas;
    Kit.ctx = canvas.getContext('2d');

    buildUI(cfg);
    buildStats(cfg.stats);
    Kit.setMuted(Kit.muted);
    Kit.setPaused(false);
    resize();
    if (cfg.setup) cfg.setup();
    Kit.setView(Kit.view, { force: true, silent: true });
    // layout again once the toy has built its toolbar (bottom inset depends on it)
    computePlayRect();
    if (cfg.resize) cfg.resize(Kit.W, Kit.H);
    if (cfg.reset) cfg.reset();
    bindInput();
    if (cfg.showHelpOnStart !== false && SS.get('lanhor-help-' + cfg.id, '0') !== '1') Kit.showHelp();
    // fonts arrive late: re-measure the segmented thumb and layout
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { layoutSeg(); Kit.relayout(); });
    window.__kit = Kit;
    requestAnimationFrame(frame);
  };

  window.Kit = Kit;
})();
