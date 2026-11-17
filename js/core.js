/* Core helpers: storage, rewards, markdown, ui utilities */
(function () {
  const PREFIX = 'sk_';

  const Store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(PREFIX + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
    }
  };

  // ---------- player progress ----------
  const LEVELS = [0, 100, 300, 600, 1000, 1600, 2400, 3400, 4700, 6300, 8200, 10500, 13500, 17000, 21000];
  const Player = {
    data() { return Store.get('player', { gold: 0, trophies: 0 }); },
    save(d) { Store.set('player', d); Player.render(); },
    addGold(n) { const d = Player.data(); d.gold += n; Player.save(d); },
    addTrophies(n) { const d = Player.data(); d.trophies = Math.max(0, d.trophies + n); Player.save(d); },
    level() {
      const xp = Player.data().gold + Player.data().trophies * 3;
      let lvl = 1;
      for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) lvl = i + 1;
      return Math.min(lvl, LEVELS.length);
    },
    levelProgress() {
      const xp = Player.data().gold + Player.data().trophies * 3;
      const l = Player.level();
      const cur = LEVELS[l - 1], next = LEVELS[l] ?? LEVELS[l - 1] * 1.3;
      return Math.min(1, (xp - cur) / (next - cur));
    },
    render() {
      const d = Player.data();
      const g = document.getElementById('res-gold'); if (g) g.textContent = d.gold;
      const t = document.getElementById('res-trophy'); if (t) t.textContent = d.trophies;
      const l = document.getElementById('res-level'); if (l) l.textContent = Player.level();
    }
  };

  // ---------- utils ----------
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function shuffle(arr, rnd = Math.random) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function seeded(seed) {
    let s = seed >>> 0 || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }

  let toastTimer;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }
  function openModal(html, onMount) {
    const m = document.getElementById('modal'), c = document.getElementById('modalCard');
    c.innerHTML = html; m.classList.remove('hidden');
    if (onMount) onMount(c);
  }
  function closeModal() { document.getElementById('modal').classList.add('hidden'); }
  document.addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

  // ---------- tiny markdown ----------
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => `<a href="${u}"${u.startsWith('#') ? '' : ' target="_blank" rel="noopener"'}>${t}</a>`);
    return s;
  }
  function md(src) {
    const lines = String(src).replace(/\r/g, '').split('\n');
    let out = '', i = 0;
    while (i < lines.length) {
      let line = lines[i];
      if (/^\s*$/.test(line)) { i++; continue; }
      if (line.startsWith('~~~')) {
        const buf = []; i++;
        while (i < lines.length && !lines[i].startsWith('~~~')) buf.push(lines[i++]);
        i++; out += `<pre>${esc(buf.join('\n'))}</pre>`; continue;
      }
      let m;
      if ((m = line.match(/^(#{1,3})\s+(.*)/))) { const n = m[1].length + 1; out += `<h${n}>${inline(m[2])}</h${n}>`; i++; continue; }
      if (line.startsWith('>')) {
        const buf = [];
        while (i < lines.length && lines[i].startsWith('>')) buf.push(lines[i++].replace(/^>\s?/, ''));
        out += `<blockquote>${inline(buf.join(' '))}</blockquote>`; continue;
      }
      if (line.startsWith('|')) {
        const rows = [];
        while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
        const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
        const head = cells(rows[0]);
        const body = rows.slice(rows[1] && /^\|[\s:|-]+\|$/.test(rows[1]) ? 2 : 1);
        out += '<table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
          body.map(r => '<tr>' + cells(r).map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
        continue;
      }
      if (/^\s*[-*]\s+/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) buf.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
        out += '<ul>' + buf.map(b => `<li>${inline(b)}</li>`).join('') + '</ul>'; continue;
      }
      if (/^\s*\d+[.)]\s+/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) buf.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
        out += '<ol>' + buf.map(b => `<li>${inline(b)}</li>`).join('') + '</ol>'; continue;
      }
      const buf = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|>|\||~~~|\s*[-*]\s+|\s*\d+[.)]\s+)/.test(lines[i])) buf.push(lines[i++]);
      out += '<p>' + buf.map((b, k) => (k && /^\*\*/.test(b) ? '<br>' : (k ? ' ' : '')) + inline(b)).join('') + '</p>';
    }
    return out;
  }

  function wordCount(s) { return String(s).split(/\s+/).filter(Boolean).length; }

  window.SK = { Store, Player, esc, shuffle, seeded, h, toast, openModal, closeModal, md, wordCount };
})();
