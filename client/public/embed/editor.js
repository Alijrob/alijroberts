(function () {
  'use strict';

  const script = document.currentScript;
  const SITE_KEY = script && script.dataset.site;
  if (!SITE_KEY) return;

  const API_BASE = script.src ? new URL(script.src).origin : window.location.origin;
  const PAGE_PATH = window.location.pathname;

  // ── State ─────────────────────────────────────────────────────────────────
  let editorActive = false;
  let selectedEl = null;
  let hoverEl = null;
  let activeTab = 'colors';
  let debounceTimer = null;
  let contentDebounceTimer = null;
  let editingText = false;
  let resizeDrag = null;
  const overrides = {};
  const contents = {};

  // History
  const historyStack = [];
  let historyIndex = -1;
  let historyDebounce = null;

  // ── Utilities ─────────────────────────────────────────────────────────────
  function uid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  function cssToHex(color) {
    if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return '#000000';
    const d = document.createElement('div');
    d.style.color = color;
    document.body.appendChild(d);
    const rgb = getComputedStyle(d).color;
    document.body.removeChild(d);
    const m = (rgb.match(/\d+/g) || []).slice(0, 3);
    if (m.length < 3) return '#000000';
    return '#' + m.map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
  }

  function effectiveBg(el) {
    let node = el;
    while (node && node !== document.documentElement) {
      const bg = getComputedStyle(node).getPropertyValue('background-color').trim();
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
      node = node.parentElement;
    }
    return getComputedStyle(document.documentElement).getPropertyValue('background-color').trim() || 'rgb(0, 0, 0)';
  }

  function isTextEl(el) {
    if (!el) return false;
    const tags = ['P','H1','H2','H3','H4','H5','H6','SPAN','A','BUTTON','LI','LABEL','TD','TH','CAPTION','FIGCAPTION','BLOCKQUOTE','CODE','PRE','STRONG','EM','SMALL','B','I'];
    return tags.includes(el.tagName) || (el.children.length === 0 && el.textContent.trim().length > 0);
  }

  function isBackgroundEl(el) {
    if (!el) return false;
    if (el === document.body || el === document.documentElement) return true;
    const r = el.getBoundingClientRect();
    return (
      ['DIV', 'SECTION', 'MAIN', 'HEADER', 'FOOTER', 'ARTICLE'].includes(el.tagName) &&
      r.width >= window.innerWidth * 0.85 &&
      r.height >= window.innerHeight * 0.5
    );
  }

  // ── History ────────────────────────────────────────────────────────────────
  function snapshot() {
    return {
      overrides: JSON.parse(JSON.stringify(overrides)),
      contents: JSON.parse(JSON.stringify(contents)),
    };
  }

  function pushHistory() {
    clearTimeout(historyDebounce);
    historyStack.splice(historyIndex + 1);
    historyStack.push(snapshot());
    historyIndex = historyStack.length - 1;
    if (historyStack.length > 50) { historyStack.shift(); historyIndex--; }
    updateHistoryBtns();
  }

  function pushHistoryDebounced() {
    clearTimeout(historyDebounce);
    historyDebounce = setTimeout(pushHistory, 700);
  }

  function applySnapshot(snap) {
    Object.keys(overrides).forEach(k => delete overrides[k]);
    Object.assign(overrides, JSON.parse(JSON.stringify(snap.overrides)));
    Object.keys(contents).forEach(k => delete contents[k]);
    Object.assign(contents, JSON.parse(JSON.stringify(snap.contents)));
    rebuildCSS();
    for (const [eid, text] of Object.entries(contents)) {
      const el = document.querySelector(`[data-eid="${eid}"]`);
      if (el && el.tagName !== 'IMG') el.innerText = text;
    }
    renderContent();
    updateHistoryBtns();
  }

  function undo() {
    clearTimeout(historyDebounce);
    if (historyIndex <= 0) return;
    historyIndex--;
    applySnapshot(historyStack[historyIndex]);
  }

  function redo() {
    clearTimeout(historyDebounce);
    if (historyIndex >= historyStack.length - 1) return;
    historyIndex++;
    applySnapshot(historyStack[historyIndex]);
  }

  function updateHistoryBtns() {
    const u = document.getElementById('editor-undo');
    const r = document.getElementById('editor-redo');
    if (u) {
      u.disabled = historyIndex <= 0;
      u.style.opacity = historyIndex <= 0 ? '0.3' : '1';
      u.style.cursor  = historyIndex <= 0 ? 'default' : 'pointer';
    }
    if (r) {
      r.disabled = historyIndex >= historyStack.length - 1;
      r.style.opacity = historyIndex >= historyStack.length - 1 ? '0.3' : '1';
      r.style.cursor  = historyIndex >= historyStack.length - 1 ? 'default' : 'pointer';
    }
  }

  // ── CSS Engine ────────────────────────────────────────────────────────────
  function styleTag() {
    let t = document.getElementById('editor-overrides');
    if (!t) { t = document.createElement('style'); t.id = 'editor-overrides'; document.head.appendChild(t); }
    return t;
  }

  function rebuildCSS() {
    let css = '';
    for (const [eid, props] of Object.entries(overrides)) {
      for (const [prop, val] of Object.entries(props)) {
        css += `[data-eid="${eid}"] { ${prop}: ${val} !important; }\n`;
      }
    }
    styleTag().textContent = css;
  }

  function setOverride(eid, prop, val) {
    if (!overrides[eid]) overrides[eid] = {};
    if (val === '' || val == null) delete overrides[eid][prop];
    else overrides[eid][prop] = val;
    rebuildCSS();
  }

  // ── API ───────────────────────────────────────────────────────────────────
  async function loadOverrides() {
    try {
      const r = await fetch(`${API_BASE}/api/embed/overrides?site=${encodeURIComponent(SITE_KEY)}&path=${encodeURIComponent(PAGE_PATH)}`);
      const rows = await r.json();
      for (const row of rows) setOverride(row.eid, row.css_property, row.value);
    } catch (e) { console.warn('[EDITOR] overrides load failed', e); }
  }

  async function loadContent() {
    try {
      const r = await fetch(`${API_BASE}/api/embed/content?site=${encodeURIComponent(SITE_KEY)}&path=${encodeURIComponent(PAGE_PATH)}`);
      if (!r.ok) return;
      const rows = await r.json();
      for (const row of rows) {
        contents[row.eid] = row.content;
        const el = document.querySelector(`[data-eid="${row.eid}"]`);
        if (el && el.tagName !== 'IMG') el.innerText = row.content;
      }
    } catch (e) { console.warn('[EDITOR] content load failed', e); }
  }

  function save(eid, prop, val) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      fetch(`${API_BASE}/api/embed/overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_key: SITE_KEY, page_path: PAGE_PATH, eid, css_property: prop, value: val }),
      }).catch(e => console.warn('[EDITOR] save failed', e));
    }, 400);
  }

  function saveContent(eid, content) {
    clearTimeout(contentDebounceTimer);
    contentDebounceTimer = setTimeout(() => {
      fetch(`${API_BASE}/api/embed/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_key: SITE_KEY, page_path: PAGE_PATH, eid, content }),
      }).catch(e => console.warn('[EDITOR] content save failed', e));
    }, 400);
  }

  async function saveAll() {
    clearTimeout(debounceTimer);
    clearTimeout(contentDebounceTimer);
    const btn = document.getElementById('editor-save');
    if (btn) { btn.textContent = '...'; btn.disabled = true; }

    const calls = [];
    for (const [eid, props] of Object.entries(overrides)) {
      for (const [prop, val] of Object.entries(props)) {
        calls.push(fetch(`${API_BASE}/api/embed/overrides`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ site_key: SITE_KEY, page_path: PAGE_PATH, eid, css_property: prop, value: val }),
        }));
      }
    }
    for (const [eid, content] of Object.entries(contents)) {
      calls.push(fetch(`${API_BASE}/api/embed/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_key: SITE_KEY, page_path: PAGE_PATH, eid, content }),
      }));
    }

    try {
      await Promise.all(calls);
      if (btn) {
        btn.textContent = 'SAVED';
        btn.style.color = '#4caf50';
        btn.style.borderColor = '#4caf50';
        setTimeout(() => {
          btn.textContent = 'SAVE';
          btn.style.color = '';
          btn.style.borderColor = '';
          btn.disabled = false;
        }, 1500);
      }
    } catch (e) {
      console.warn('[EDITOR] saveAll failed', e);
      if (btn) { btn.textContent = 'SAVE'; btn.disabled = false; }
    }
  }

  function onChange(prop, val) {
    if (!selectedEl) return;
    const eid = selectedEl.dataset.eid;
    setOverride(eid, prop, val);
    if (val) save(eid, prop, val);
    pushHistoryDebounced();
  }

  // ── Background Themes ─────────────────────────────────────────────────────
  const THEMES = [
    { name: 'Navy Night',    swatch: '#0d0d1a',
      props: { 'background-color': '#0d0d1a', 'background-image': 'none' } },
    { name: 'Pure Black',    swatch: '#000000',
      props: { 'background-color': '#000000', 'background-image': 'none' } },
    { name: 'Charcoal',      swatch: '#1c1c1e',
      props: { 'background-color': '#1c1c1e', 'background-image': 'none' } },
    { name: 'Dark Slate',    swatch: '#1e2030',
      props: { 'background-color': '#1e2030', 'background-image': 'none' } },
    { name: 'Midnight Blue', swatch: '#0f0b2e',
      props: { 'background-color': '#0f0b2e', 'background-image': 'none' } },
    { name: 'Ocean Dark',    swatch: '#0a1628',
      props: { 'background-color': '#0a1628', 'background-image': 'none' } },
    { name: 'Pure White',    swatch: '#ffffff',
      props: { 'background-color': '#ffffff', 'background-image': 'none' } },
    { name: 'Warm Ivory',    swatch: '#faf8f3',
      props: { 'background-color': '#faf8f3', 'background-image': 'none' } },
    { name: 'Light Gray',    swatch: '#f4f4f6',
      props: { 'background-color': '#f4f4f6', 'background-image': 'none' } },
    { name: 'Soft Blue',     swatch: '#eef2ff',
      props: { 'background-color': '#eef2ff', 'background-image': 'none' } },
    { name: 'Cosmic',
      swatch: 'linear-gradient(135deg,#0d0d1a,#1a0030)',
      props: { 'background-image': 'linear-gradient(135deg,#0d0d1a 0%,#1a0030 100%)', 'background-color': '#0d0d1a' } },
    { name: 'Gold Horizon',
      swatch: 'linear-gradient(135deg,#0d0d1a,#1a1200)',
      props: { 'background-image': 'linear-gradient(135deg,#0d0d1a 0%,#1a1200 100%)', 'background-color': '#0d0d1a' } },
    { name: 'Ocean Depth',
      swatch: 'linear-gradient(135deg,#0a1628,#0d2233)',
      props: { 'background-image': 'linear-gradient(135deg,#0a1628 0%,#0d2233 100%)', 'background-color': '#0a1628' } },
    { name: 'Aurora',
      swatch: 'linear-gradient(135deg,#0d1a0f,#0a0d2e)',
      props: { 'background-image': 'linear-gradient(135deg,#0d1a0f 0%,#0a0d2e 100%)', 'background-color': '#0d1a0f' } },
    { name: 'Crimson Dark',
      swatch: 'linear-gradient(135deg,#1a0505,#0d0d1a)',
      props: { 'background-image': 'linear-gradient(135deg,#1a0505 0%,#0d0d1a 100%)', 'background-color': '#1a0505' } },
    { name: 'Ice Blue',
      swatch: 'linear-gradient(135deg,#e8f4fc,#d0e8f5)',
      props: { 'background-image': 'linear-gradient(135deg,#e8f4fc 0%,#d0e8f5 100%)', 'background-color': '#e8f4fc' } },
  ];

  let themePicker = null;

  function buildThemePicker() {
    const modal = document.createElement('div');
    modal.id = 'editor-theme-picker';
    modal.setAttribute('data-herald', '');
    Object.assign(modal.style, {
      position: 'fixed', inset: '0', zIndex: '100001',
      background: 'rgba(0,0,0,0.78)', display: 'none',
      alignItems: 'center', justifyContent: 'center',
    });

    const box = document.createElement('div');
    box.setAttribute('data-herald', '');
    Object.assign(box.style, {
      background: '#13132b', border: '1px solid #D4AF37', borderRadius: '10px',
      padding: '20px', width: '400px', maxWidth: '94vw',
      boxShadow: '0 12px 48px rgba(0,0,0,0.85)',
    });

    // Title row
    const titleRow = document.createElement('div');
    Object.assign(titleRow.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' });
    const title = document.createElement('span');
    title.textContent = 'BACKGROUND THEME';
    Object.assign(title.style, { color: '#D4AF37', fontFamily: 'monospace', fontWeight: '700', fontSize: '12px', letterSpacing: '1.5px' });
    const closeBtn = document.createElement('button');
    closeBtn.setAttribute('data-herald', '');
    closeBtn.textContent = '×';
    Object.assign(closeBtn.style, { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '22px', padding: '0', lineHeight: '1', fontFamily: 'system-ui' });
    closeBtn.addEventListener('click', hideThemePicker);
    titleRow.appendChild(title);
    titleRow.appendChild(closeBtn);
    box.appendChild(titleRow);

    // Swatch grid
    const grid = document.createElement('div');
    grid.setAttribute('data-herald', '');
    Object.assign(grid.style, { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' });

    THEMES.forEach(theme => {
      const item = document.createElement('div');
      item.setAttribute('data-herald', '');
      Object.assign(item.style, { cursor: 'pointer', textAlign: 'center' });

      const swatch = document.createElement('div');
      swatch.setAttribute('data-herald', '');
      Object.assign(swatch.style, {
        width: '100%', height: '46px', borderRadius: '6px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: theme.swatch,
        transition: 'transform 0.1s, box-shadow 0.1s',
      });

      const label = document.createElement('div');
      label.setAttribute('data-herald', '');
      Object.assign(label.style, { color: '#888', fontSize: '9px', fontFamily: 'system-ui', marginTop: '5px', lineHeight: '1.3' });
      label.textContent = theme.name;

      item.addEventListener('mouseenter', () => {
        swatch.style.transform = 'scale(1.06)';
        swatch.style.boxShadow = '0 0 0 2px #D4AF37';
        label.style.color = '#D4AF37';
      });
      item.addEventListener('mouseleave', () => {
        swatch.style.transform = '';
        swatch.style.boxShadow = '';
        label.style.color = '#888';
      });
      item.addEventListener('click', () => { applyTheme(theme); hideThemePicker(); });

      item.appendChild(swatch);
      item.appendChild(label);
      grid.appendChild(item);
    });

    box.appendChild(grid);

    const note = document.createElement('p');
    note.setAttribute('data-herald', '');
    note.textContent = 'Or use the Colors / BG tabs for a custom value.';
    Object.assign(note.style, { color: '#555', fontSize: '10px', fontFamily: 'system-ui', marginTop: '14px', marginBottom: '0', textAlign: 'center' });
    box.appendChild(note);

    modal.appendChild(box);
    modal.addEventListener('click', e => { if (e.target === modal) hideThemePicker(); });

    document.body.appendChild(modal);
    return modal;
  }

  function showThemePicker() {
    if (themePicker) themePicker.style.display = 'flex';
  }

  function hideThemePicker() {
    if (themePicker) themePicker.style.display = 'none';
  }

  function applyTheme(theme) {
    if (!selectedEl) return;
    if (!selectedEl.dataset.eid) selectedEl.dataset.eid = uid();
    const eid = selectedEl.dataset.eid;
    for (const [prop, val] of Object.entries(theme.props)) {
      setOverride(eid, prop, val);
      save(eid, prop, val);
    }
    pushHistory();
    renderContent();
  }

  // ── Panel definition ──────────────────────────────────────────────────────
  const TABS = [
    { id: 'colors', label: 'Colors' },
    { id: 'type',   label: 'Type'   },
    { id: 'layout', label: 'Layout' },
    { id: 'bg',     label: 'BG'     },
    { id: 'img',    label: 'Img'    },
  ];

  const CONTROLS = {
    colors: [
      { label: 'Background',   prop: 'background-color', type: 'color' },
      { label: 'Text',         prop: 'color',            type: 'color' },
      { label: 'Border Color', prop: 'border-color',     type: 'color' },
      { label: 'Border Width', prop: 'border-width',     type: 'text', ph: 'e.g. 1px' },
      { label: 'Border Style', prop: 'border-style',     type: 'select', opts: ['none','solid','dashed','dotted','double'] },
    ],
    type: [
      { label: 'Font Family',    prop: 'font-family',    type: 'text',   ph: 'e.g. Inter, sans-serif' },
      { label: 'Font Size',      prop: 'font-size',      type: 'text',   ph: 'e.g. 16px' },
      { label: 'Font Weight',    prop: 'font-weight',    type: 'select', opts: ['100','200','300','400','500','600','700','800','900'] },
      { label: 'Line Height',    prop: 'line-height',    type: 'text',   ph: 'e.g. 1.5' },
      { label: 'Letter Spacing', prop: 'letter-spacing', type: 'text',   ph: 'e.g. 0.05em' },
      { label: 'Transform',      prop: 'text-transform', type: 'select', opts: ['none','uppercase','lowercase','capitalize'] },
    ],
    layout: [
      { label: 'Width',         prop: 'width',         type: 'text', ph: 'e.g. 100%' },
      { label: 'Height',        prop: 'height',        type: 'text', ph: 'e.g. auto' },
      { label: 'Padding',       prop: 'padding',       type: 'text', ph: 'e.g. 8px 16px' },
      { label: 'Margin',        prop: 'margin',        type: 'text', ph: 'e.g. 0 auto' },
      { label: 'Border Radius', prop: 'border-radius', type: 'text', ph: 'e.g. 8px' },
      { label: 'Opacity',       prop: 'opacity',       type: 'range', min: 0, max: 1, step: 0.01 },
    ],
    bg: [
      { label: 'Image URL',  prop: 'background-image',    type: 'text',   ph: 'url(...)' },
      { label: 'Size',       prop: 'background-size',     type: 'select', opts: ['auto','cover','contain'] },
      { label: 'Position',   prop: 'background-position', type: 'text',   ph: 'e.g. center' },
      { label: 'Repeat',     prop: 'background-repeat',   type: 'select', opts: ['repeat','no-repeat','repeat-x','repeat-y'] },
    ],
    img: [
      { label: 'Src',             prop: '_img_src',        type: 'text',   ph: 'https://...' },
      { label: 'Object Fit',      prop: 'object-fit',      type: 'select', opts: ['fill','contain','cover','none','scale-down'] },
      { label: 'Object Position', prop: 'object-position', type: 'text',   ph: 'e.g. center, 50% 50%' },
    ],
  };

  // ── DOM helpers ───────────────────────────────────────────────────────────
  const S = (el, styles) => Object.assign(el.style, styles);
  const BASE_INPUT = { background: '#0d0d1a', color: '#e0e0e0', border: '1px solid #333', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', width: '100%', boxSizing: 'border-box' };

  function currentVal(prop) {
    if (!selectedEl) return '';
    const eid = selectedEl.dataset.eid;
    if (eid && overrides[eid] && overrides[eid][prop] != null) return overrides[eid][prop];
    const val = getComputedStyle(selectedEl).getPropertyValue(prop).trim();
    if (prop === 'background-color' && (val === 'rgba(0, 0, 0, 0)' || val === 'transparent' || !val)) {
      return effectiveBg(selectedEl);
    }
    return val;
  }

  function buildInput(ctrl) {
    const row = document.createElement('div');
    S(row, { marginBottom: '10px' });
    const lbl = document.createElement('label');
    lbl.textContent = ctrl.label;
    S(lbl, { display: 'block', marginBottom: '4px', color: '#999', fontSize: '11px', fontFamily: 'system-ui,sans-serif' });
    row.appendChild(lbl);

    if (ctrl.type === 'color') {
      const wrap = document.createElement('div');
      S(wrap, { display: 'flex', gap: '6px', alignItems: 'center' });
      const picker = document.createElement('input');
      picker.type = 'color';
      try { picker.value = cssToHex(currentVal(ctrl.prop)); } catch { picker.value = '#000000'; }
      S(picker, { width: '32px', height: '28px', border: 'none', padding: '0', cursor: 'pointer', background: 'none' });
      const txt = document.createElement('input');
      txt.type = 'text';
      txt.value = currentVal(ctrl.prop);
      txt.placeholder = 'e.g. #ff0000';
      S(txt, { ...BASE_INPUT, flex: '1', width: 'auto' });
      picker.addEventListener('input', () => { txt.value = picker.value; onChange(ctrl.prop, picker.value); });
      picker.addEventListener('change', () => pushHistory());
      txt.addEventListener('input', () => { onChange(ctrl.prop, txt.value); try { picker.value = cssToHex(txt.value); } catch {} });
      txt.addEventListener('change', () => pushHistory());
      wrap.appendChild(picker); wrap.appendChild(txt);
      row.appendChild(wrap);

    } else if (ctrl.type === 'select') {
      const sel = document.createElement('select');
      S(sel, { ...BASE_INPUT, cursor: 'pointer' });
      const val = currentVal(ctrl.prop);
      ctrl.opts.forEach(o => { const op = document.createElement('option'); op.value = o; op.textContent = o; if (val.includes(o)) op.selected = true; sel.appendChild(op); });
      sel.addEventListener('change', () => { onChange(ctrl.prop, sel.value); pushHistory(); });
      row.appendChild(sel);

    } else if (ctrl.type === 'range') {
      const wrap = document.createElement('div');
      S(wrap, { display: 'flex', gap: '8px', alignItems: 'center' });
      const slider = document.createElement('input');
      slider.type = 'range'; slider.min = ctrl.min; slider.max = ctrl.max; slider.step = ctrl.step;
      slider.value = parseFloat(currentVal(ctrl.prop)) || 1;
      S(slider, { flex: '1' });
      const disp = document.createElement('span');
      disp.textContent = slider.value;
      S(disp, { color: '#D4AF37', fontSize: '11px', minWidth: '28px', fontFamily: 'monospace' });
      slider.addEventListener('input', () => { disp.textContent = slider.value; onChange(ctrl.prop, slider.value); });
      slider.addEventListener('change', () => pushHistory());
      wrap.appendChild(slider); wrap.appendChild(disp);
      row.appendChild(wrap);

    } else {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.placeholder = ctrl.ph || '';
      S(inp, BASE_INPUT);
      if (ctrl.prop === '_img_src') {
        inp.value = selectedEl && selectedEl.tagName === 'IMG' ? selectedEl.src : '';
        inp.addEventListener('change', () => { if (selectedEl && selectedEl.tagName === 'IMG') selectedEl.src = inp.value; pushHistory(); });
      } else {
        inp.value = currentVal(ctrl.prop);
        inp.addEventListener('input', () => onChange(ctrl.prop, inp.value));
        inp.addEventListener('change', () => pushHistory());
      }
      row.appendChild(inp);
    }
    return row;
  }

  // ── Resize overlay ────────────────────────────────────────────────────────
  let resizeOverlay = null;

  const HANDLES = {
    n:  { top: '-5px',    left: '50%',    marginLeft: '-4px', cursor: 'n-resize'  },
    s:  { bottom: '-5px', left: '50%',    marginLeft: '-4px', cursor: 's-resize'  },
    e:  { right: '-5px',  top: '50%',     marginTop: '-4px',  cursor: 'e-resize'  },
    w:  { left: '-5px',   top: '50%',     marginTop: '-4px',  cursor: 'w-resize'  },
    ne: { top: '-5px',    right: '-5px',                      cursor: 'ne-resize' },
    nw: { top: '-5px',    left: '-5px',                       cursor: 'nw-resize' },
    se: { bottom: '-5px', right: '-5px',                      cursor: 'se-resize' },
    sw: { bottom: '-5px', left: '-5px',                       cursor: 'sw-resize' },
  };

  function buildResizeOverlay() {
    const ov = document.createElement('div');
    ov.id = 'editor-resize-ov';
    ov.setAttribute('data-herald', '');
    Object.assign(ov.style, {
      position: 'fixed', pointerEvents: 'none', zIndex: '99990',
      outline: '1px dashed rgba(212,175,55,0.5)', display: 'none',
    });
    Object.entries(HANDLES).forEach(([id, pos]) => {
      const h = document.createElement('div');
      h.setAttribute('data-herald', '');
      h.setAttribute('data-rh', id);
      Object.assign(h.style, {
        position: 'absolute', width: '8px', height: '8px',
        background: '#D4AF37', border: '1.5px solid #13132b',
        borderRadius: '2px', pointerEvents: 'all', cursor: pos.cursor, ...pos,
      });
      h.addEventListener('mousedown', onHandleDown);
      ov.appendChild(h);
    });
    document.body.appendChild(ov);
    return ov;
  }

  function positionOverlay() {
    if (!resizeOverlay || !selectedEl) return;
    const r = selectedEl.getBoundingClientRect();
    Object.assign(resizeOverlay.style, {
      top: r.top + 'px', left: r.left + 'px',
      width: r.width + 'px', height: r.height + 'px',
      display: 'block',
    });
  }

  function onHandleDown(e) {
    e.preventDefault(); e.stopPropagation();
    if (!selectedEl) return;
    const handle = e.currentTarget.dataset.rh;
    const rect = selectedEl.getBoundingClientRect();
    resizeDrag = {
      handle,
      startX: e.clientX, startY: e.clientY,
      startW: rect.width, startH: rect.height,
      isImg: selectedEl.tagName === 'IMG',
      el: selectedEl,
    };
    document.addEventListener('mousemove', onResizeMove, true);
    document.addEventListener('mouseup', onResizeUp, true);
  }

  function onResizeMove(e) {
    if (!resizeDrag) return;
    const { handle, startX, startY, startW, startH, isImg, el } = resizeDrag;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    let newW = startW, newH = startH;

    if (handle.includes('e')) newW = Math.max(20, startW + dx);
    if (handle.includes('w')) newW = Math.max(20, startW - dx);
    if (handle.includes('s')) newH = Math.max(20, startH + dy);
    if (handle.includes('n')) newH = Math.max(20, startH - dy);

    if (isImg && handle.length === 2) {
      const ratio = startW / startH;
      if (Math.abs(dx) >= Math.abs(dy)) newH = newW / ratio;
      else newW = newH * ratio;
    }

    el.style.width = Math.round(newW) + 'px';
    el.style.height = Math.round(newH) + 'px';
    if (isImg && !el.style.objectFit) el.style.objectFit = 'cover';

    positionOverlay();
  }

  function onResizeUp() {
    if (!resizeDrag) return;
    const { el } = resizeDrag;
    if (!el.dataset.eid) el.dataset.eid = uid();
    const eid = el.dataset.eid;
    if (el.style.width)     { setOverride(eid, 'width', el.style.width);          save(eid, 'width', el.style.width); }
    if (el.style.height)    { setOverride(eid, 'height', el.style.height);        save(eid, 'height', el.style.height); }
    if (el.style.objectFit) { setOverride(eid, 'object-fit', el.style.objectFit); save(eid, 'object-fit', el.style.objectFit); }
    resizeDrag = null;
    document.removeEventListener('mousemove', onResizeMove, true);
    document.removeEventListener('mouseup', onResizeUp, true);
    pushHistory();
    renderContent();
  }

  // ── Text editing ──────────────────────────────────────────────────────────
  function startTextEdit() {
    if (!selectedEl || editingText) return;
    editingText = true;
    if (!selectedEl.dataset.eid) selectedEl.dataset.eid = uid();
    selectedEl.contentEditable = 'true';
    selectedEl.focus();
    const range = document.createRange();
    range.selectNodeContents(selectedEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    selectedEl.addEventListener('blur', stopTextEdit, { once: true });
    selectedEl.addEventListener('keydown', onTextKeydown);
    renderContent();
  }

  function onTextKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); selectedEl && selectedEl.blur(); }
  }

  function stopTextEdit() {
    if (!editingText || !selectedEl) return;
    editingText = false;
    selectedEl.contentEditable = 'false';
    selectedEl.removeEventListener('keydown', onTextKeydown);
    const eid = selectedEl.dataset.eid;
    const text = selectedEl.innerText.trim();
    if (eid && text !== undefined) { contents[eid] = text; saveContent(eid, text); }
    pushHistory();
    renderContent();
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  function onKeydown(e) {
    if (editingText) return;
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
    if (e.key === 's') { e.preventDefault(); saveAll(); }
  }

  // ── Panel DOM ─────────────────────────────────────────────────────────────
  let panel = null, toggleBtn = null, toolbar = null;

  function switchTab(id) {
    activeTab = id;
    document.querySelectorAll('[data-h-tab]').forEach(t => {
      const active = t.dataset.hTab === id;
      S(t, { color: active ? '#D4AF37' : '#777', borderBottom: active ? '2px solid #D4AF37' : '2px solid transparent' });
    });
    renderContent();
  }

  function renderContent() {
    const area = document.getElementById('editor-content');
    if (!area) return;
    area.innerHTML = '';

    if (!selectedEl) {
      area.innerHTML = '<p style="color:#666;font-size:12px;font-family:system-ui">Click any element to edit it.</p>';
      return;
    }

    // Edit Text button
    if (isTextEl(selectedEl)) {
      const btn = document.createElement('button');
      btn.setAttribute('data-herald', '');
      btn.textContent = editingText ? 'Done Editing' : 'Edit Text';
      Object.assign(btn.style, {
        width: '100%', padding: '7px', marginBottom: '10px',
        background: editingText ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${editingText ? '#D4AF37' : '#444'}`,
        borderRadius: '5px', color: editingText ? '#D4AF37' : '#aaa',
        cursor: 'pointer', fontSize: '12px', fontFamily: 'system-ui', transition: 'all 0.15s',
      });
      btn.addEventListener('click', () => editingText ? stopTextEdit() : startTextEdit());
      area.appendChild(btn);
    }

    // Choose Theme button for background elements
    if (isBackgroundEl(selectedEl)) {
      const btn = document.createElement('button');
      btn.setAttribute('data-herald', '');
      btn.textContent = 'Choose Theme';
      Object.assign(btn.style, {
        width: '100%', padding: '7px', marginBottom: '10px',
        background: 'rgba(212,175,55,0.08)', border: '1px solid #D4AF37',
        borderRadius: '5px', color: '#D4AF37', cursor: 'pointer',
        fontSize: '12px', fontFamily: 'system-ui', letterSpacing: '0.5px',
      });
      btn.addEventListener('click', showThemePicker);
      area.appendChild(btn);
    }

    if (activeTab === 'img' && selectedEl.tagName !== 'IMG') {
      const note = document.createElement('p');
      note.textContent = 'Select an <img> element to use this tab.';
      note.style.cssText = 'color:#666;font-size:12px;font-family:system-ui';
      area.appendChild(note);
      return;
    }

    (CONTROLS[activeTab] || []).forEach(ctrl => area.appendChild(buildInput(ctrl)));

    if (activeTab === 'layout') {
      const r = selectedEl.getBoundingClientRect();
      const hint = document.createElement('p');
      hint.textContent = `${Math.round(r.width)} x ${Math.round(r.height)} px  —  drag handles to resize`;
      hint.style.cssText = 'color:#555;font-size:10px;font-family:monospace;margin-top:10px;line-height:1.5';
      area.appendChild(hint);
    }

    if (activeTab === 'img' && selectedEl.tagName === 'IMG') {
      const hint = document.createElement('p');
      hint.textContent = 'Drag corner handles to crop proportionally. Use Object Position to pan the visible area.';
      hint.style.cssText = 'color:#555;font-size:10px;font-family:system-ui;margin-top:10px;line-height:1.5';
      area.appendChild(hint);
    }
  }

  function buildPanel() {
    const p = document.createElement('div');
    p.id = 'editor-panel';
    p.setAttribute('data-herald', '');
    S(p, {
      position: 'fixed', top: '72px', right: '24px', width: '290px',
      maxHeight: 'calc(100vh - 110px)', overflowY: 'auto',
      background: '#13132b', border: '1px solid #D4AF37', borderRadius: '8px',
      zIndex: '99998', boxShadow: '0 6px 28px rgba(0,0,0,0.6)', display: 'none',
    });

    const hdr = document.createElement('div');
    S(hdr, { padding: '10px 14px', borderBottom: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0d0d20', borderRadius: '8px 8px 0 0' });
    const tag = document.createElement('span');
    tag.id = 'editor-tag';
    S(tag, { color: '#D4AF37', fontWeight: '700', fontSize: '12px', letterSpacing: '1px', fontFamily: 'monospace' });
    tag.textContent = 'SELECT AN ELEMENT';
    const close = document.createElement('button');
    S(close, { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px', padding: '0', lineHeight: '1', fontFamily: 'system-ui' });
    close.textContent = '×';
    close.setAttribute('data-herald', '');
    close.addEventListener('click', () => { deselect(); p.style.display = 'none'; });
    hdr.appendChild(tag); hdr.appendChild(close);
    p.appendChild(hdr);

    const tabBar = document.createElement('div');
    S(tabBar, { display: 'flex', borderBottom: '1px solid #2a2a4a', background: '#0d0d20' });
    TABS.forEach(tab => {
      const t = document.createElement('button');
      t.setAttribute('data-herald', '');
      t.setAttribute('data-h-tab', tab.id);
      S(t, { flex: '1', background: 'none', border: 'none', borderBottom: '2px solid transparent', color: '#777', cursor: 'pointer', padding: '8px 0', fontSize: '11px', fontWeight: '600', fontFamily: 'system-ui', transition: 'color 0.15s' });
      t.textContent = tab.label;
      t.addEventListener('click', () => switchTab(tab.id));
      tabBar.appendChild(t);
    });
    p.appendChild(tabBar);

    const area = document.createElement('div');
    area.id = 'editor-content';
    S(area, { padding: '12px 14px' });
    area.innerHTML = '<p style="color:#666;font-size:12px;font-family:system-ui">Click any element to edit it.</p>';
    p.appendChild(area);

    return p;
  }

  function buildToggleBtn() {
    const btn = document.createElement('button');
    btn.id = 'editor-toggle';
    btn.setAttribute('data-herald', '');
    S(btn, {
      position: 'fixed', bottom: '24px', right: '24px', zIndex: '99999',
      background: '#13132b', color: '#D4AF37', border: '2px solid #D4AF37',
      borderRadius: '6px', padding: '7px 13px', fontSize: '11px',
      fontFamily: 'monospace', fontWeight: '700', letterSpacing: '2px',
      cursor: 'pointer', boxShadow: '0 2px 14px rgba(0,0,0,0.5)', userSelect: 'none',
    });
    btn.textContent = 'EDITOR';
    btn.addEventListener('click', toggle);
    return btn;
  }

  function buildToolbar() {
    const bar = document.createElement('div');
    bar.id = 'editor-toolbar';
    bar.setAttribute('data-herald', '');
    Object.assign(bar.style, {
      position: 'fixed', bottom: '68px', right: '24px', zIndex: '99999',
      display: 'none', gap: '6px', alignItems: 'center', flexDirection: 'row',
    });

    function mkBtn(id, label, title) {
      const b = document.createElement('button');
      b.id = id;
      b.setAttribute('data-herald', '');
      b.title = title;
      b.textContent = label;
      Object.assign(b.style, {
        background: '#13132b', color: '#D4AF37', border: '1.5px solid #444',
        borderRadius: '5px', padding: '5px 11px', fontSize: '13px',
        fontFamily: 'monospace', cursor: 'pointer', userSelect: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)', lineHeight: '1',
        transition: 'opacity 0.15s',
      });
      return b;
    }

    const undoBtn = mkBtn('editor-undo', '←', 'Undo (Ctrl+Z)');
    const redoBtn = mkBtn('editor-redo', '→', 'Redo (Ctrl+Y)');
    const saveBtn = mkBtn('editor-save', 'SAVE', 'Save all changes (Ctrl+S)');
    Object.assign(saveBtn.style, {
      fontSize: '11px', letterSpacing: '1px', fontWeight: '700',
      border: '1.5px solid #D4AF37',
    });

    undoBtn.style.opacity = '0.3';
    redoBtn.style.opacity = '0.3';
    undoBtn.disabled = true;
    redoBtn.disabled = true;

    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);
    saveBtn.addEventListener('click', saveAll);

    bar.appendChild(undoBtn);
    bar.appendChild(redoBtn);
    bar.appendChild(saveBtn);
    return bar;
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  function deselect() {
    if (editingText) stopTextEdit();
    if (selectedEl) { selectedEl.style.outline = selectedEl._h_prevOutline || ''; selectedEl = null; }
    const t = document.getElementById('editor-tag');
    if (t) t.textContent = 'SELECT AN ELEMENT';
    if (resizeOverlay) resizeOverlay.style.display = 'none';
  }

  function select(el) {
    deselect();
    selectedEl = el;
    el._h_prevOutline = el.style.outline;
    el.style.outline = '2px solid #D4AF37';
    if (!el.dataset.eid) el.dataset.eid = uid();
    const t = document.getElementById('editor-tag');
    if (t) t.textContent = `<${el.tagName.toLowerCase()}>`;
    document.querySelectorAll('[data-h-tab="img"]').forEach(b => S(b, { display: el.tagName === 'IMG' ? '' : 'none' }));
    if (activeTab === 'img' && el.tagName !== 'IMG') switchTab('colors');
    else renderContent();
    panel.style.display = 'block';
    positionOverlay();
    if (isBackgroundEl(el)) showThemePicker();
  }

  // ── Editor mode events ────────────────────────────────────────────────────
  function onOver(e) {
    const el = e.target;
    if (el.closest('[data-herald]')) return;
    if (hoverEl && hoverEl !== selectedEl) { hoverEl.style.outline = hoverEl._h_prevOutline || ''; }
    if (el !== selectedEl) { el._h_prevOutline = el._h_prevOutline !== undefined ? el._h_prevOutline : el.style.outline; el.style.outline = '1px dashed #D4AF37'; }
    hoverEl = el;
  }

  function onOut(e) {
    const el = e.target;
    if (el.closest('[data-herald]')) return;
    if (el !== selectedEl) { el.style.outline = el._h_prevOutline || ''; }
    if (hoverEl === el) hoverEl = null;
  }

  function onClick(e) {
    const el = e.target;
    if (el.closest('[data-herald]')) return;
    e.preventDefault(); e.stopPropagation();
    select(el);
  }

  function toggle() {
    editorActive = !editorActive;
    S(toggleBtn, { background: editorActive ? '#D4AF37' : '#13132b', color: editorActive ? '#13132b' : '#D4AF37' });
    document.body.style.cursor = editorActive ? 'crosshair' : '';
    toolbar.style.display = editorActive ? 'flex' : 'none';
    if (editorActive) {
      document.addEventListener('mouseover', onOver, true);
      document.addEventListener('mouseout', onOut, true);
      document.addEventListener('click', onClick, true);
      document.addEventListener('keydown', onKeydown, true);
    } else {
      document.removeEventListener('mouseover', onOver, true);
      document.removeEventListener('mouseout', onOut, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeydown, true);
      deselect();
      if (hoverEl) { hoverEl.style.outline = hoverEl._h_prevOutline || ''; hoverEl = null; }
      panel.style.display = 'none';
      hideThemePicker();
      document.body.style.cursor = '';
    }
  }

  // ── Overlay tracks scroll + resize ────────────────────────────────────────
  function onScrollOrResize() { if (selectedEl) positionOverlay(); }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    toggleBtn    = buildToggleBtn();
    panel        = buildPanel();
    toolbar      = buildToolbar();
    themePicker  = buildThemePicker();
    resizeOverlay = buildResizeOverlay();
    document.body.appendChild(toggleBtn);
    document.body.appendChild(panel);
    document.body.appendChild(toolbar);
    switchTab('colors');
    Promise.all([loadOverrides(), loadContent()]).then(pushHistory);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
