/*
 * DiagramEditor — a small Draw.io / Miro style editor built on SVG.
 * Features: drag components & shapes from the palette, move, resize, connect with arrows (drag from the
 * blue dots), labels on nodes and arrows, multi-select (shift / box select), pan & zoom, snap to grid,
 * undo/redo, copy/paste/duplicate, z-order, colors, autosave, export PNG / SVG / JSON, import JSON.
 */
(function () {
  const COMPONENTS = {
    client: { icon: '💻', label: 'Web Client', color: '#dbeafe' },
    mobile: { icon: '📱', label: 'Mobile App', color: '#dbeafe' },
    user: { icon: '👤', label: 'User', color: '#e0f2fe' },
    dns: { icon: '📖', label: 'DNS', color: '#ede9fe' },
    cdn: { icon: '🌍', label: 'CDN', color: '#ccfbf1' },
    lb: { icon: '⚖️', label: 'Load Balancer', color: '#fef3c7' },
    gateway: { icon: '🚪', label: 'API Gateway', color: '#fef3c7' },
    ratelimiter: { icon: '🚦', label: 'Rate Limiter', color: '#fee2e2' },
    server: { icon: '🖥️', label: 'App Server', color: '#dcfce7' },
    service: { icon: '⚙️', label: 'Service', color: '#dcfce7' },
    ws: { icon: '🔌', label: 'WebSocket GW', color: '#dcfce7' },
    worker: { icon: '👷', label: 'Worker', color: '#d9f99d' },
    cache: { icon: '⚡', label: 'Cache (Redis)', color: '#fee2e2' },
    db: { icon: '🗄️', label: 'SQL Database', color: '#e0e7ff' },
    nosql: { icon: '🧱', label: 'NoSQL DB', color: '#e0e7ff' },
    queue: { icon: '📬', label: 'Queue / Kafka', color: '#fce7f3' },
    storage: { icon: '🪣', label: 'Object Storage', color: '#f5f5f4' },
    search: { icon: '🔎', label: 'Search Index', color: '#fef9c3' },
    vector: { icon: '🧭', label: 'Vector DB', color: '#e0e7ff' },
    llm: { icon: '🤖', label: 'LLM', color: '#f3e8ff' },
    monitor: { icon: '📈', label: 'Monitoring', color: '#f1f5f9' },
    external: { icon: '🌐', label: 'External API', color: '#f1f5f9' }
  };
  const SHAPES = {
    rect: 'Rectangle', round: 'Rounded', ellipse: 'Ellipse', diamond: 'Diamond', cylinder: 'Cylinder',
    hexagon: 'Hexagon', note: 'Sticky', text: 'Text', frame: 'Frame'
  };
  const FILLS = ['#ffffff', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#ede9fe', '#fee2e2', '#e5e7eb', '#fde68a', '#bbf7d0', '#bfdbfe', '#fecaca', 'none'];
  const STROKES = ['#1f2937', '#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#6b7280'];
  const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  const uid = () => Math.random().toString(36).slice(2, 10);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function shapeIcon(t) {
    const s = 'fill="#fff" stroke="#1f2937" stroke-width="2"';
    return {
      rect: `<rect x="3" y="4" width="28" height="16" ${s}/>`,
      round: `<rect x="3" y="4" width="28" height="16" rx="6" ${s}/>`,
      ellipse: `<ellipse cx="17" cy="12" rx="14" ry="8" ${s}/>`,
      diamond: `<polygon points="17,2 31,12 17,22 3,12" ${s}/>`,
      cylinder: `<path d="M5 6 v12 a12 4 0 0 0 24 0 v-12" ${s}/><ellipse cx="17" cy="6" rx="12" ry="4" ${s}/>`,
      hexagon: `<polygon points="8,3 26,3 32,12 26,21 8,21 2,12" ${s}/>`,
      note: `<path d="M4 3 h20 l6 6 v13 h-26 z" fill="#fde68a" stroke="#1f2937" stroke-width="2"/>`,
      text: `<text x="17" y="17" text-anchor="middle" font-size="15" font-weight="700" fill="#1f2937">Aa</text>`,
      frame: `<rect x="3" y="3" width="28" height="18" fill="none" stroke="#1f2937" stroke-width="2" stroke-dasharray="4 3"/>`
    }[t];
  }

  function wrapText(text, maxW, fs) {
    const out = []; const cw = fs * 0.56; const maxC = Math.max(4, Math.floor(maxW / cw));
    String(text || '').split('\n').forEach(par => {
      let line = '';
      par.split(/\s+/).forEach(w => {
        if (!w) return;
        if ((line + ' ' + w).trim().length > maxC && line) { out.push(line); line = w; }
        else line = (line + ' ' + w).trim();
        while (line.length > maxC) { out.push(line.slice(0, maxC)); line = line.slice(maxC); }
      });
      out.push(line);
    });
    return out;
  }

  function DiagramEditor(root, opts = {}) {
    const key = opts.storageKey || 'board_default';
    let state = { nodes: [], edges: [] };
    let view = { tx: 40, ty: 40, z: 1 };
    let sel = new Set();
    let hist = [], fut = [];
    let snap = true, panTool = false, spaceDown = false, clipboard = null;
    let drag = null, editing = null, raf = 0;

    // ---------- DOM ----------
    root.innerHTML = `
      <div class="editor-shell ${opts.brief ? 'with-brief' : ''}">
        <aside class="ed-palette">
          <h4>Components</h4>
          <div class="pal-grid">${Object.entries(COMPONENTS).map(([k, c]) => `<div class="pal-item" draggable="true" data-add="comp:${k}" title="${c.label}"><span class="pi">${c.icon}</span>${c.label}</div>`).join('')}</div>
          <h4>Shapes</h4>
          <div class="pal-grid">${Object.entries(SHAPES).map(([k, l]) => `<div class="pal-item" draggable="true" data-add="shape:${k}" title="${l}"><svg viewBox="0 0 34 24">${shapeIcon(k)}</svg>${l}</div>`).join('')}</div>
          <p class="muted" style="font-size:12px;margin-top:10px">Drag onto the canvas, or tap to add.</p>
        </aside>
        <div class="ed-main">
          <div class="ed-toolbar">
            <button class="tool on" data-act="select" title="Select (V)">🖱️ Select</button>
            <button class="tool" data-act="pan" title="Pan (H) — or hold Space">✋ Pan</button>
            <button class="tool" data-act="undo" title="Undo (Ctrl+Z)">↶</button>
            <button class="tool" data-act="redo" title="Redo (Ctrl+Y)">↷</button>
            <button class="tool" data-act="dup" title="Duplicate (Ctrl+D)">⧉</button>
            <button class="tool" data-act="del" title="Delete (Del)">🗑️</button>
            <button class="tool on" data-act="snap" title="Snap to grid">▦ Snap</button>
            <span style="flex:1"></span>
            ${(opts.extraButtons || []).map((b, i) => `<button class="tool" data-extra="${i}" style="background:#ffe680">${b.label}</button>`).join('')}
            <button class="tool" data-act="png">⬇ PNG</button>
            <button class="tool" data-act="svg">⬇ SVG</button>
            <button class="tool" data-act="json">💾 JSON</button>
            <button class="tool" data-act="open">📂 Open</button>
            <button class="tool" data-act="clear">✖ Clear</button>
            <input type="file" accept=".json,application/json" style="display:none" data-file>
          </div>
          <div class="ed-canvas">
            <svg xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="ed-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#d6d3c8"/></pattern>
                ${STROKES.map((c, i) => `<marker id="ed-arr-${i}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join('')}
              </defs>
              <g data-vp>
                <rect x="-50000" y="-50000" width="100000" height="100000" fill="url(#ed-grid)" data-bg/>
                <g data-frames></g><g data-edges></g><g data-nodes></g><g data-overlay></g>
              </g>
            </svg>
            <div class="ed-hint">Drag blue dots to connect • Double-click to edit text • Wheel to zoom • Space+drag to pan</div>
            <div class="ed-zoom"><button class="tool" data-act="zout">−</button><button class="tool" data-act="zreset" data-zoomlabel>100%</button><button class="tool" data-act="zin">+</button><button class="tool" data-act="fit">Fit</button></div>
          </div>
        </div>
        <aside class="ed-props ${opts.brief ? 'brief-panel' : ''}"><div data-brief>${opts.brief || ''}</div><div data-props></div></aside>
      </div>`;
    const svg = root.querySelector('.ed-canvas svg');
    const vp = svg.querySelector('[data-vp]');
    const gFrames = svg.querySelector('[data-frames]'), gEdges = svg.querySelector('[data-edges]'), gNodes = svg.querySelector('[data-nodes]'), gOver = svg.querySelector('[data-overlay]');
    const canvas = root.querySelector('.ed-canvas');
    const propsEl = root.querySelector('[data-props]');

    // ---------- state helpers ----------
    const byId = id => state.nodes.find(n => n.id === id) || state.edges.find(e => e.id === id);
    const isNode = o => o && 'w' in o;
    function save() { SK.Store.set(key, state); if (opts.onChange) opts.onChange(state); }
    function pushHist() { hist.push(JSON.stringify(state)); if (hist.length > 120) hist.shift(); fut = []; }
    function undo() { if (!hist.length) return; fut.push(JSON.stringify(state)); state = JSON.parse(hist.pop()); sel.clear(); renderAll(); save(); }
    function redo() { if (!fut.length) return; hist.push(JSON.stringify(state)); state = JSON.parse(fut.pop()); sel.clear(); renderAll(); save(); }
    const g = v => snap ? Math.round(v / 10) * 10 : v;

    function makeNode(kind, type, x, y) {
      if (kind === 'comp') {
        const c = COMPONENTS[type];
        return { id: uid(), kind, type, x: g(x - 70), y: g(y - 40), w: 140, h: 80, text: c.label, fill: c.color, stroke: '#1f2937', fs: 14 };
      }
      const base = { id: uid(), kind, type, x: g(x - 70), y: g(y - 40), w: 140, h: 80, text: '', fill: '#ffffff', stroke: '#1f2937', fs: 14 };
      if (type === 'text') Object.assign(base, { text: 'Text', fill: 'none', h: 40, fs: 18 });
      if (type === 'note') Object.assign(base, { text: 'Note', fill: '#fde68a', w: 160, h: 120 });
      if (type === 'frame') Object.assign(base, { text: 'Frame', fill: 'none', w: 360, h: 260, x: g(x - 180), y: g(y - 130), stroke: '#6b7280' });
      if (type === 'diamond') Object.assign(base, { w: 140, h: 100 });
      if (type === 'cylinder') Object.assign(base, { w: 120, h: 100, text: 'Database' });
      return base;
    }
    function addNode(kind, type, x, y) {
      pushHist(); const n = makeNode(kind, type, x, y); state.nodes.push(n);
      sel = new Set([n.id]); renderAll(); save(); return n;
    }

    // ---------- geometry ----------
    const center = n => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 });
    function anchor(n, toward) {
      const c = center(n); let dx = toward.x - c.x, dy = toward.y - c.y;
      if (!dx && !dy) return c;
      if (n.type === 'ellipse') { const t = 1 / Math.sqrt((dx / (n.w / 2)) ** 2 + (dy / (n.h / 2)) ** 2); return { x: c.x + dx * t, y: c.y + dy * t }; }
      const s = Math.min(Math.abs((n.w / 2) / (dx || 1e-9)), Math.abs((n.h / 2) / (dy || 1e-9)));
      return { x: c.x + dx * s, y: c.y + dy * s };
    }
    function edgeGeom(e) {
      const a = byId(e.from), b = byId(e.to); if (!a || !b) return null;
      if (e.style === 'elbow') {
        const ca = center(a), cb = center(b); const dx = cb.x - ca.x, dy = cb.y - ca.y;
        if (Math.abs(dx) >= Math.abs(dy)) {
          const s = { x: dx > 0 ? a.x + a.w : a.x, y: ca.y }, t = { x: dx > 0 ? b.x : b.x + b.w, y: cb.y }; const mx = (s.x + t.x) / 2;
          return { d: `M${s.x},${s.y} H${mx} V${t.y} H${t.x}`, mid: { x: mx, y: (s.y + t.y) / 2 } };
        }
        const s = { x: ca.x, y: dy > 0 ? a.y + a.h : a.y }, t = { x: cb.x, y: dy > 0 ? b.y : b.y + b.h }; const my = (s.y + t.y) / 2;
        return { d: `M${s.x},${s.y} V${my} H${t.x} V${t.y}`, mid: { x: (s.x + t.x) / 2, y: my } };
      }
      const s = anchor(a, center(b)), t = anchor(b, center(a));
      return { d: `M${s.x},${s.y} L${t.x},${t.y}`, mid: { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 } };
    }

    // ---------- rendering ----------
    function shapeSvg(n) {
      const f = n.fill === 'none' ? 'none' : n.fill, s = n.stroke, w = n.w, h = n.h, sw = 2;
      switch (n.type) {
        case 'round': return `<rect width="${w}" height="${h}" rx="16" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`;
        case 'ellipse': return `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`;
        case 'diamond': return `<polygon points="${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`;
        case 'hexagon': return `<polygon points="${w * .2},0 ${w * .8},0 ${w},${h / 2} ${w * .8},${h} ${w * .2},${h} 0,${h / 2}" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`;
        case 'cylinder': { const ry = Math.min(14, h / 6); return `<path d="M0,${ry} V${h - ry} A${w / 2},${ry} 0 0 0 ${w},${h - ry} V${ry}" fill="${f}" stroke="${s}" stroke-width="${sw}"/><ellipse cx="${w / 2}" cy="${ry}" rx="${w / 2}" ry="${ry}" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`; }
        case 'note': return `<path d="M0,0 H${w - 18} L${w},18 V${h} H0 Z" fill="${f}" stroke="${s}" stroke-width="1.5"/><path d="M${w - 18},0 V18 H${w}" fill="none" stroke="${s}" stroke-width="1.5"/>`;
        case 'text': return `<rect width="${w}" height="${h}" fill="transparent"/>`;
        case 'frame': return `<rect width="${w}" height="${h}" rx="8" fill="${f === 'none' ? 'rgba(0,0,0,0.015)' : f}" stroke="${s}" stroke-width="2" stroke-dasharray="8 6"/>`;
        default: return `<rect width="${w}" height="${h}" rx="${n.kind === 'comp' ? 12 : 2}" fill="${f}" stroke="${s}" stroke-width="${sw}"/>`;
      }
    }
    function textSvg(n) {
      const fs = n.fs || 14;
      if (n.type === 'frame') return `<text x="10" y="${fs + 6}" font-family="${FONT}" font-size="${fs}" font-weight="700" fill="${n.stroke}">${esc(n.text)}</text>`;
      if (n.kind === 'comp') {
        const lines = wrapText(n.text, n.w - 12, fs).slice(0, 3);
        const icon = COMPONENTS[n.type]?.icon || '';
        const iconSize = Math.min(30, n.h * 0.38);
        const total = iconSize + 4 + lines.length * fs * 1.2;
        let y0 = (n.h - total) / 2;
        return `<text x="${n.w / 2}" y="${y0 + iconSize * 0.9}" text-anchor="middle" font-size="${iconSize}">${icon}</text>` +
          lines.map((l, i) => `<text x="${n.w / 2}" y="${y0 + iconSize + 4 + fs * (i + 0.95)}" text-anchor="middle" font-family="${FONT}" font-size="${fs}" font-weight="700" fill="#1f2937">${esc(l)}</text>`).join('');
      }
      const lines = wrapText(n.text, n.w - 14, fs);
      const lh = fs * 1.25; const y0 = n.h / 2 - (lines.length * lh) / 2 + fs * 0.9;
      const anchorX = n.type === 'note' ? 10 : n.w / 2, ta = n.type === 'note' ? 'start' : 'middle';
      const top = n.type === 'note' ? 10 + fs : y0;
      return lines.map((l, i) => `<text x="${anchorX}" y="${top + i * lh}" text-anchor="${ta}" font-family="${FONT}" font-size="${fs}" font-weight="${n.type === 'text' ? 700 : 600}" fill="#1f2937">${esc(l)}</text>`).join('');
    }
    function nodeSvg(n, exp) {
      const selected = !exp && sel.has(n.id);
      let out = `<g class="node" data-id="${n.id}" transform="translate(${n.x},${n.y})">${shapeSvg(n)}${textSvg(n)}`;
      if (!exp) {
        if (selected) out += `<rect x="-5" y="-5" width="${n.w + 10}" height="${n.h + 10}" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="5 4" pointer-events="none"/>` +
          (sel.size === 1 ? `<rect class="handle-resize" x="${n.w - 2}" y="${n.h - 2}" width="12" height="12" fill="#2563eb" stroke="#fff" style="cursor:nwse-resize"/>` : '');
        if (n.type !== 'frame' && n.type !== 'text') [[n.w / 2, -2], [n.w + 2, n.h / 2], [n.w / 2, n.h + 2], [-2, n.h / 2]].forEach(([x, y]) => {
          out += `<circle class="port" cx="${x}" cy="${y}" r="6" fill="#3b82f6" stroke="#fff" stroke-width="2"/>`;
        });
        if (n.type === 'frame') out += `<circle class="port" cx="${n.w + 2}" cy="${n.h / 2}" r="6" fill="#3b82f6" stroke="#fff" stroke-width="2"/>`;
      }
      return out + '</g>';
    }
    function edgeSvg(e, exp) {
      const gm = edgeGeom(e); if (!gm) return '';
      const ci = Math.max(0, STROKES.indexOf(e.color || STROKES[0]));
      const selected = !exp && sel.has(e.id);
      const m = `url(#ed-arr-${ci})`;
      const ms = e.arrow === 'both' ? `marker-start="${m}"` : '';
      const me = e.arrow === 'none' ? '' : `marker-end="${m}"`;
      let out = `<g class="edge" data-id="${e.id}">`;
      if (!exp) out += `<path d="${gm.d}" stroke="transparent" stroke-width="16" fill="none" style="cursor:pointer"/>`;
      if (selected) out += `<path d="${gm.d}" stroke="#93c5fd" stroke-width="7" fill="none" pointer-events="none"/>`;
      out += `<path d="${gm.d}" stroke="${STROKES[ci]}" stroke-width="2" fill="none" ${e.dashed ? 'stroke-dasharray="7 5"' : ''} ${ms} ${me} pointer-events="none"/>`;
      if (e.text) {
        const w = Math.min(220, e.text.length * 7 + 14);
        out += `<rect x="${gm.mid.x - w / 2}" y="${gm.mid.y - 11}" width="${w}" height="20" rx="5" fill="#fff" stroke="#e5e7eb"/><text x="${gm.mid.x}" y="${gm.mid.y + 4}" text-anchor="middle" font-family="${FONT}" font-size="12" font-weight="600" fill="#374151">${esc(e.text)}</text>`;
      }
      return out + '</g>';
    }
    function renderAll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        vp.setAttribute('transform', `translate(${view.tx},${view.ty}) scale(${view.z})`);
        gFrames.innerHTML = state.nodes.filter(n => n.type === 'frame').map(n => nodeSvg(n)).join('');
        gEdges.innerHTML = state.edges.map(e => edgeSvg(e)).join('');
        gNodes.innerHTML = state.nodes.filter(n => n.type !== 'frame').map(n => nodeSvg(n)).join('');
        root.querySelector('[data-zoomlabel]').textContent = Math.round(view.z * 100) + '%';
        renderProps();
      });
    }
    function renderView() { vp.setAttribute('transform', `translate(${view.tx},${view.ty}) scale(${view.z})`); root.querySelector('[data-zoomlabel]').textContent = Math.round(view.z * 100) + '%'; }

    // ---------- properties panel ----------
    let propsSig = '';
    function renderProps() {
      const items = [...sel].map(byId).filter(Boolean);
      const sig = items.map(i => i.id).join(',') + '|' + items.length;
      if (sig === propsSig && propsEl.contains(document.activeElement)) return;
      propsSig = sig;
      if (!items.length) {
        propsEl.innerHTML = `<h4>Board</h4><div class="row">${state.nodes.length} shapes · ${state.edges.length} arrows</div>
          <h4>Tips</h4><ul style="font-size:12px;padding-left:16px;margin:0">
          <li>Drag from palette to add</li><li>Drag a blue dot onto another shape to connect</li><li>Double-click to edit text</li>
          <li>Shift+click or drag on empty space to multi-select</li><li>Ctrl+Z / Ctrl+Y undo/redo, Ctrl+C / Ctrl+V copy-paste</li><li>Arrow keys nudge</li></ul>`;
        return;
      }
      const nodes = items.filter(isNode), edges = items.filter(i => !isNode(i));
      let html = '';
      if (items.length === 1) html += `<div class="row">Text<input type="text" data-p="text" value="${esc(items[0].text)}"></div>`;
      if (nodes.length) {
        html += `<h4>Shape</h4><div class="row">Fill<div class="swatches">${FILLS.map(c => `<span class="swatch" data-fill="${c}" style="background:${c === 'none' ? 'repeating-linear-gradient(45deg,#fff 0 4px,#ddd 4px 8px)' : c}" title="${c}"></span>`).join('')}</div></div>
          <div class="row">Border<div class="swatches">${STROKES.map(c => `<span class="swatch" data-stroke="${c}" style="background:${c}"></span>`).join('')}</div></div>
          <div class="row">Font size<input type="number" min="8" max="48" data-p="fs" value="${nodes[0].fs || 14}"></div>
          ${nodes.length === 1 ? `<div class="row">Size (w × h)<div style="display:flex;gap:4px"><input type="number" data-p="w" value="${Math.round(nodes[0].w)}"><input type="number" data-p="h" value="${Math.round(nodes[0].h)}"></div></div>` : ''}
          <div class="row" style="display:flex;gap:4px;flex-wrap:wrap"><button class="tool" data-z="front">Bring front</button><button class="tool" data-z="back">Send back</button></div>`;
      }
      if (edges.length) {
        const e = edges[0];
        html += `<h4>Arrow</h4>
          <div class="row">Line<select data-p="dashed"><option value="0" ${!e.dashed ? 'selected' : ''}>Solid</option><option value="1" ${e.dashed ? 'selected' : ''}>Dashed (async)</option></select></div>
          <div class="row">Heads<select data-p="arrow"><option value="end" ${!e.arrow || e.arrow === 'end' ? 'selected' : ''}>→ One way</option><option value="both" ${e.arrow === 'both' ? 'selected' : ''}>↔ Both</option><option value="none" ${e.arrow === 'none' ? 'selected' : ''}>— None</option></select></div>
          <div class="row">Route<select data-p="style"><option value="straight" ${e.style !== 'elbow' ? 'selected' : ''}>Straight</option><option value="elbow" ${e.style === 'elbow' ? 'selected' : ''}>Elbow</option></select></div>
          <div class="row">Color<div class="swatches">${STROKES.map(c => `<span class="swatch" data-ecolor="${c}" style="background:${c}"></span>`).join('')}</div></div>
          <div class="row"><button class="tool" data-flip>⇄ Reverse direction</button></div>`;
      }
      html += `<div class="row"><button class="tool" data-act="del" style="width:100%">🗑️ Delete</button></div>`;
      propsEl.innerHTML = html;
    }
    propsEl.addEventListener('input', e => {
      const p = e.target.dataset.p; if (!p) return;
      const items = [...sel].map(byId).filter(Boolean);
      if (!e.target._hist) { pushHist(); e.target._hist = true; }
      items.forEach(it => {
        if (p === 'text' && items.length === 1) it.text = e.target.value;
        if (p === 'fs' && isNode(it)) it.fs = Math.max(8, Math.min(48, +e.target.value || 14));
        if ((p === 'w' || p === 'h') && isNode(it)) it[p] = Math.max(20, +e.target.value || 20);
        if (p === 'dashed' && !isNode(it)) it.dashed = e.target.value === '1';
        if (p === 'arrow' && !isNode(it)) it.arrow = e.target.value;
        if (p === 'style' && !isNode(it)) it.style = e.target.value;
      });
      renderAll(); save();
    });
    propsEl.addEventListener('change', e => { e.target._hist = false; });
    propsEl.addEventListener('click', e => {
      const t = e.target; const items = [...sel].map(byId).filter(Boolean);
      if (t.dataset.fill) { pushHist(); items.filter(isNode).forEach(n => n.fill = t.dataset.fill); }
      else if (t.dataset.stroke) { pushHist(); items.filter(isNode).forEach(n => n.stroke = t.dataset.stroke); }
      else if (t.dataset.ecolor) { pushHist(); items.filter(i => !isNode(i)).forEach(x => x.color = t.dataset.ecolor); }
      else if (t.hasAttribute('data-flip')) { pushHist(); items.filter(i => !isNode(i)).forEach(x => { [x.from, x.to] = [x.to, x.from]; }); }
      else if (t.dataset.z) {
        pushHist(); const ids = new Set(items.filter(isNode).map(n => n.id));
        const picked = state.nodes.filter(n => ids.has(n.id)), rest = state.nodes.filter(n => !ids.has(n.id));
        state.nodes = t.dataset.z === 'front' ? rest.concat(picked) : picked.concat(rest);
      } else return;
      propsSig = ''; renderAll(); save();
    });

    // ---------- coordinates ----------
    function toWorld(cx, cy) { const r = svg.getBoundingClientRect(); return { x: (cx - r.left - view.tx) / view.z, y: (cy - r.top - view.ty) / view.z }; }
    function zoomAt(f, cx, cy) {
      const r = svg.getBoundingClientRect(); const px = cx - r.left, py = cy - r.top;
      const nz = Math.min(3, Math.max(0.2, view.z * f));
      view.tx = px - (px - view.tx) * (nz / view.z); view.ty = py - (py - view.ty) * (nz / view.z); view.z = nz; renderView();
    }
    function bounds(nodes = state.nodes) {
      if (!nodes.length) return { x: 0, y: 0, w: 800, h: 500 };
      const x1 = Math.min(...nodes.map(n => n.x)), y1 = Math.min(...nodes.map(n => n.y));
      const x2 = Math.max(...nodes.map(n => n.x + n.w)), y2 = Math.max(...nodes.map(n => n.y + n.h));
      return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    }
    function fit() {
      const b = bounds(); const r = svg.getBoundingClientRect(); if (!r.width) return;
      const z = Math.min(1.5, Math.max(0.2, Math.min((r.width - 80) / b.w, (r.height - 80) / b.h)));
      view = { z, tx: (r.width - b.w * z) / 2 - b.x * z, ty: (r.height - b.h * z) / 2 - b.y * z }; renderView();
    }

    // ---------- pointer interactions ----------
    svg.addEventListener('pointerdown', e => {
      if (editing) commitEdit();
      const w = toWorld(e.clientX, e.clientY);
      const t = e.target;
      if (panTool || spaceDown || e.button === 1) { drag = { mode: 'pan', sx: e.clientX, sy: e.clientY, tx: view.tx, ty: view.ty }; canvas.classList.add('panning'); svg.setPointerCapture(e.pointerId); return; }
      if (e.button !== 0) return;
      const nodeEl = t.closest('.node'), edgeEl = t.closest('.edge');
      if (t.classList.contains('handle-resize') && nodeEl) {
        const n = byId(nodeEl.dataset.id); drag = { mode: 'resize', n, w0: n.w, h0: n.h, sx: w.x, sy: w.y, pushed: false };
      } else if (t.classList.contains('port') && nodeEl) {
        drag = { mode: 'link', from: nodeEl.dataset.id, x: w.x, y: w.y };
      } else if (nodeEl) {
        const id = nodeEl.dataset.id;
        if (e.shiftKey) { sel.has(id) ? sel.delete(id) : sel.add(id); }
        else if (!sel.has(id)) sel = new Set([id]);
        let moving = state.nodes.filter(n => sel.has(n.id));
        // moving a frame also moves nodes inside it
        moving.filter(n => n.type === 'frame').forEach(f => state.nodes.forEach(n => {
          if (n !== f && !moving.includes(n) && n.x >= f.x && n.y >= f.y && n.x + n.w <= f.x + f.w && n.y + n.h <= f.y + f.h) moving.push(n);
        }));
        drag = { mode: 'move', sx: w.x, sy: w.y, items: moving.map(n => ({ n, x: n.x, y: n.y })), pushed: false };
        renderAll();
      } else if (edgeEl) {
        const id = edgeEl.dataset.id;
        if (e.shiftKey) { sel.has(id) ? sel.delete(id) : sel.add(id); } else sel = new Set([id]);
        renderAll();
      } else {
        if (!e.shiftKey) sel.clear();
        drag = { mode: 'marquee', sx: w.x, sy: w.y, base: new Set(sel) };
        renderAll();
      }
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', e => {
      if (!drag) return;
      const w = toWorld(e.clientX, e.clientY);
      if (drag.mode === 'pan') { view.tx = drag.tx + e.clientX - drag.sx; view.ty = drag.ty + e.clientY - drag.sy; renderView(); return; }
      if (drag.mode === 'move') {
        const dx = w.x - drag.sx, dy = w.y - drag.sy;
        if (!drag.pushed) { if (Math.abs(dx) + Math.abs(dy) < 3 / view.z) return; drag.items.forEach(i => { i.n.x = i.x; i.n.y = i.y; }); pushHist(); drag.pushed = true; }
        drag.items.forEach(i => { i.n.x = g(i.x + dx); i.n.y = g(i.y + dy); });
        renderAll();
      } else if (drag.mode === 'resize') {
        if (!drag.pushed) { pushHist(); drag.pushed = true; }
        drag.n.w = Math.max(30, g(drag.w0 + w.x - drag.sx)); drag.n.h = Math.max(24, g(drag.h0 + w.y - drag.sy)); renderAll();
      } else if (drag.mode === 'link') {
        const a = byId(drag.from); const s = anchor(a, w);
        gOver.innerHTML = `<line x1="${s.x}" y1="${s.y}" x2="${w.x}" y2="${w.y}" stroke="#2563eb" stroke-width="2" stroke-dasharray="6 4" marker-end="url(#ed-arr-1)"/>`;
      } else if (drag.mode === 'marquee') {
        const x = Math.min(drag.sx, w.x), y = Math.min(drag.sy, w.y), ww = Math.abs(w.x - drag.sx), hh = Math.abs(w.y - drag.sy);
        gOver.innerHTML = `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="rgba(37,99,235,.08)" stroke="#2563eb" stroke-dasharray="4 3"/>`;
        sel = new Set(drag.base);
        state.nodes.forEach(n => { if (n.x >= x && n.y >= y && n.x + n.w <= x + ww && n.y + n.h <= y + hh) sel.add(n.id); });
        state.edges.forEach(ed => { if (sel.has(ed.from) && sel.has(ed.to)) sel.add(ed.id); });
        renderAll();
      }
    });
    function endDrag(e) {
      if (!drag) return;
      if (drag.mode === 'link') {
        gOver.innerHTML = '';
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const target = el && el.closest && el.closest('.node');
        if (target && target.dataset.id !== drag.from && root.contains(target)) {
          const to = target.dataset.id;
          if (!state.edges.some(x => x.from === drag.from && x.to === to)) {
            pushHist(); const ed = { id: uid(), from: drag.from, to, text: '', arrow: 'end', style: 'straight', color: STROKES[0], dashed: false };
            state.edges.push(ed); sel = new Set([ed.id]); renderAll(); save();
          }
        }
      } else if (drag.mode === 'marquee') { gOver.innerHTML = ''; }
      else if ((drag.mode === 'move' || drag.mode === 'resize') && drag.pushed) save();
      canvas.classList.remove('panning');
      drag = null;
    }
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
    svg.addEventListener('wheel', e => {
      e.preventDefault();
      if (e.ctrlKey || !e.shiftKey && Math.abs(e.deltaY) > 0 && !e.deltaX) zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX, e.clientY);
      else { view.tx -= e.deltaX; view.ty -= e.deltaY; renderView(); }
    }, { passive: false });
    svg.addEventListener('dblclick', e => {
      const nodeEl = e.target.closest('.node'), edgeEl = e.target.closest('.edge');
      if (nodeEl) startEdit(byId(nodeEl.dataset.id));
      else if (edgeEl) startEdit(byId(edgeEl.dataset.id));
      else { const w = toWorld(e.clientX, e.clientY); const n = addNode('shape', 'text', w.x, w.y); n.text = ''; startEdit(n); }
    });

    // ---------- inline text editing ----------
    function startEdit(item) {
      if (!item) return;
      const r = svg.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
      let box;
      if (isNode(item)) box = { x: item.x, y: item.y, w: item.w, h: item.h };
      else { const gm = edgeGeom(item); box = { x: gm.mid.x - 90, y: gm.mid.y - 16, w: 180, h: 32 }; }
      const ta = document.createElement('textarea');
      ta.className = 'ed-text-input'; ta.value = item.text || '';
      Object.assign(ta.style, {
        left: (r.left - cr.left + view.tx + box.x * view.z) + 'px', top: (r.top - cr.top + view.ty + box.y * view.z) + 'px',
        width: Math.max(80, box.w * view.z) + 'px', height: Math.max(30, box.h * view.z) + 'px', fontSize: Math.max(12, (item.fs || 13) * view.z) + 'px'
      });
      canvas.appendChild(ta); ta.focus(); ta.select();
      editing = { item, ta };
      ta.addEventListener('keydown', ev => {
        ev.stopPropagation();
        if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); commitEdit(); }
        if (ev.key === 'Escape') { cancelEdit(); }
      });
      ta.addEventListener('blur', () => setTimeout(commitEdit, 0));
    }
    function commitEdit() {
      if (!editing) return; const { item, ta } = editing; editing = null;
      if (ta.value !== item.text) { pushHist(); item.text = ta.value; }
      ta.remove();
      if (isNode(item) && item.type === 'text' && !item.text.trim()) { state.nodes = state.nodes.filter(n => n !== item); sel.delete(item.id); }
      propsSig = ''; renderAll(); save();
    }
    function cancelEdit() { if (!editing) return; editing.ta.remove(); editing = null; renderAll(); }

    // ---------- palette ----------
    root.querySelectorAll('.pal-item').forEach(it => {
      it.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', it.dataset.add); e.dataTransfer.effectAllowed = 'copy'; });
      it.addEventListener('click', () => {
        const r = svg.getBoundingClientRect(); const c = toWorld(r.left + r.width / 2 + (Math.random() * 60 - 30), r.top + r.height / 2 + (Math.random() * 60 - 30));
        const [kind, type] = it.dataset.add.split(':'); addNode(kind, type, c.x, c.y);
      });
    });
    canvas.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    canvas.addEventListener('drop', e => {
      e.preventDefault(); const v = e.dataTransfer.getData('text/plain'); if (!v || !v.includes(':')) return;
      const [kind, type] = v.split(':'); if (!(kind === 'comp' ? COMPONENTS[type] : SHAPES[type])) return;
      const w = toWorld(e.clientX, e.clientY); addNode(kind, type, w.x, w.y);
    });

    // ---------- actions ----------
    function del() {
      if (!sel.size) return; pushHist();
      state.nodes = state.nodes.filter(n => !sel.has(n.id));
      const alive = new Set(state.nodes.map(n => n.id));
      state.edges = state.edges.filter(e => !sel.has(e.id) && alive.has(e.from) && alive.has(e.to));
      sel.clear(); renderAll(); save();
    }
    function copySel() {
      const nodes = state.nodes.filter(n => sel.has(n.id)); const ids = new Set(nodes.map(n => n.id));
      clipboard = JSON.stringify({ nodes, edges: state.edges.filter(e => ids.has(e.from) && ids.has(e.to)) });
    }
    function paste(offset = 30) {
      if (!clipboard) return; pushHist();
      const data = JSON.parse(clipboard); const map = {};
      data.nodes.forEach(n => { map[n.id] = uid(); n.id = map[n.id]; n.x += offset; n.y += offset; state.nodes.push(n); });
      data.edges.forEach(e => { e.id = uid(); e.from = map[e.from]; e.to = map[e.to]; state.edges.push(e); });
      sel = new Set(data.nodes.map(n => n.id)); clipboard = JSON.stringify(data); renderAll(); save();
    }
    function exportSvgString() {
      const b = bounds(); const pad = 40;
      const defs = svg.querySelector('defs').innerHTML.replace(/<pattern[\s\S]*?<\/pattern>/, '');
      const body = state.nodes.filter(n => n.type === 'frame').map(n => nodeSvg(n, true)).join('') + state.edges.map(e => edgeSvg(e, true)).join('') + state.nodes.filter(n => n.type !== 'frame').map(n => nodeSvg(n, true)).join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${b.w + pad * 2}" height="${b.h + pad * 2}" viewBox="${b.x - pad} ${b.y - pad} ${b.w + pad * 2} ${b.h + pad * 2}"><defs>${defs}</defs><rect x="${b.x - pad}" y="${b.y - pad}" width="${b.w + pad * 2}" height="${b.h + pad * 2}" fill="#ffffff"/>${body}</svg>`;
    }
    function download(name, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
    function exportPng() {
      const s = exportSvgString(); const img = new Image();
      const url = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml;charset=utf-8' }));
      img.onload = () => {
        const c = document.createElement('canvas'); const scale = 2; c.width = img.width * scale; c.height = img.height * scale;
        const ctx = c.getContext('2d'); ctx.scale(scale, scale); ctx.drawImage(img, 0, 0); URL.revokeObjectURL(url);
        c.toBlob(bl => bl && download((opts.fileName || 'diagram') + '.png', bl));
      };
      img.src = url;
    }
    const fileInput = root.querySelector('[data-file]');
    fileInput.addEventListener('change', () => {
      const f = fileInput.files[0]; if (!f) return;
      f.text().then(t => { try { const d = JSON.parse(t); if (!Array.isArray(d.nodes)) throw 0; pushHist(); state = { nodes: d.nodes, edges: d.edges || [] }; sel.clear(); renderAll(); save(); setTimeout(fit, 30); } catch (err) { SK.toast('That file is not a valid diagram'); } });
      fileInput.value = '';
    });
    function setTool(p) { panTool = p; root.querySelector('[data-act=select]').classList.toggle('on', !p); root.querySelector('[data-act=pan]').classList.toggle('on', p); }
    function action(a) {
      ({
        select: () => setTool(false), pan: () => setTool(true), undo, redo, del,
        dup: () => { copySel(); paste(20); },
        snap: () => { snap = !snap; root.querySelector('[data-act=snap]').classList.toggle('on', snap); },
        png: exportPng,
        svg: () => download((opts.fileName || 'diagram') + '.svg', new Blob([exportSvgString()], { type: 'image/svg+xml' })),
        json: () => download((opts.fileName || 'diagram') + '.json', new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' })),
        open: () => fileInput.click(),
        clear: () => { if (!state.nodes.length || confirm('Clear the whole board? (You can undo.)')) { pushHist(); state = { nodes: [], edges: [] }; sel.clear(); renderAll(); save(); } },
        zin: () => { const r = svg.getBoundingClientRect(); zoomAt(1.2, r.left + r.width / 2, r.top + r.height / 2); },
        zout: () => { const r = svg.getBoundingClientRect(); zoomAt(1 / 1.2, r.left + r.width / 2, r.top + r.height / 2); },
        zreset: () => { view.z = 1; renderView(); }, fit
      }[a] || (() => { }))();
    }
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (b && root.contains(b)) { action(b.dataset.act); return; }
      const x = e.target.closest('[data-extra]'); if (x) opts.extraButtons[+x.dataset.extra].onClick(api);
    });

    // ---------- keyboard ----------
    function onKey(e) {
      if (!document.body.contains(root)) { document.removeEventListener('keydown', onKey); document.removeEventListener('keyup', onKeyUp); return; }
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (/INPUT|TEXTAREA|SELECT/.test(tag) || editing) return;
      if (document.getElementById('modal') && !document.getElementById('modal').classList.contains('hidden')) return;
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === ' ') { spaceDown = true; e.preventDefault(); return; }
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
      else if (mod && e.key.toLowerCase() === 'c') { copySel(); }
      else if (mod && e.key.toLowerCase() === 'v') { e.preventDefault(); paste(); }
      else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); copySel(); paste(20); }
      else if (mod && e.key.toLowerCase() === 'a') { e.preventDefault(); sel = new Set(state.nodes.map(n => n.id).concat(state.edges.map(x => x.id))); renderAll(); }
      else if (e.key === 'Delete' || e.key === 'Backspace') { if (sel.size) { e.preventDefault(); del(); } }
      else if (e.key === 'Escape') { sel.clear(); renderAll(); }
      else if (e.key === 'v' || e.key === 'V') setTool(false);
      else if (e.key === 'h' || e.key === 'H') setTool(true);
      else if (e.key === 'Enter' && sel.size === 1) { e.preventDefault(); startEdit(byId([...sel][0])); }
      else if (e.key.startsWith('Arrow') && sel.size) {
        e.preventDefault(); pushHist(); const s = e.shiftKey ? 10 : 1;
        const d = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[e.key];
        state.nodes.filter(n => sel.has(n.id)).forEach(n => { n.x += d[0]; n.y += d[1]; }); renderAll(); save();
      }
    }
    function onKeyUp(e) { if (e.key === ' ') spaceDown = false; }
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', onKeyUp);

    // ---------- public API ----------
    const api = {
      getData: () => JSON.parse(JSON.stringify(state)),
      load(data, { fitView = true, history = true } = {}) {
        if (history) pushHist();
        state = { nodes: (data.nodes || []).map(n => ({ ...n })), edges: (data.edges || []).map(e => ({ ...e })) };
        sel.clear(); renderAll(); save(); if (fitView) setTimeout(fit, 40);
      },
      /* build from compact spec: nodes [type, label, x, y], edges [fromIdx, toIdx, label] */
      fromSpec(spec) {
        const ids = spec.nodes.map(() => uid());
        const nodes = spec.nodes.map(([type, label, x, y], i) => { const c = COMPONENTS[type] || COMPONENTS.service; return { id: ids[i], kind: 'comp', type: COMPONENTS[type] ? type : 'service', x, y, w: 150, h: 84, text: label, fill: c.color, stroke: '#1f2937', fs: 13 }; });
        const edges = spec.edges.map(([a, b, t]) => ({ id: uid(), from: ids[a], to: ids[b], text: t || '', arrow: 'end', style: 'straight', color: STROKES[0], dashed: false }));
        return { nodes, edges };
      },
      types: () => state.nodes.filter(n => n.kind === 'comp').map(n => n.type),
      labels: () => state.nodes.map(n => (n.text || '').toLowerCase()),
      setBrief(html) { root.querySelector('[data-brief]').innerHTML = html; },
      fit, undo, redo
    };

    // initial load
    const saved = opts.initial || SK.Store.get(key, null);
    if (saved && saved.nodes) state = saved;
    renderAll();
    if (state.nodes.length) setTimeout(fit, 60);
    return api;
  }

  window.SK_COMPONENTS = COMPONENTS;
  window.DiagramEditor = DiagramEditor;
})();
