/*
 * Build & Defend — place buildings (servers, databases, caches...), connect them with roads,
 * then survive 3 waves of traffic. Teaches capacity, caching, queues, CDNs and database choice.
 */
(function () {
  const { Store, esc, toast, openModal, closeModal, Player } = SK;

  const B = {
    client: { icon: '🏘️', name: 'Village (Users)', cost: 0, desc: 'Where all traffic comes from. Build roads from here.' },
    dns: { icon: '📖', name: 'DNS', cost: 50, cap: Infinity, desc: 'Turns names into addresses. Pass-through.' },
    cdn: { icon: '🌍', name: 'CDN', cost: 250, cap: 1e6, desc: 'Serves ~95% of static files (images, video, JS) from the edge.' },
    ratelimiter: { icon: '🚦', name: 'Rate Limiter', cost: 120, cap: 200000, desc: 'Blocks abusive bot traffic before it reaches your servers.' },
    lb: { icon: '⚖️', name: 'Load Balancer', cost: 150, cap: 100000, desc: 'Splits traffic evenly across everything it connects to.' },
    gateway: { icon: '🚪', name: 'API Gateway', cost: 200, cap: 60000, desc: 'Front door for APIs; splits traffic like a load balancer.' },
    server: { icon: '🖥️', name: 'App Server', cost: 100, cap: 5000, desc: 'Runs your code. ~5,000 req/s each. Sends reads to cache/DB, writes to queue/DB, files to storage.' },
    ws: { icon: '🔌', name: 'WebSocket Gateway', cost: 220, cap: 20000, desc: 'Holds live connections for real-time traffic (~20,000 msg/s). Saves messages to a queue or DB.' },
    cache: { icon: '⚡', name: 'Cache (Redis)', cost: 200, cap: 100000, desc: 'Answers ~85% of reads from memory. Misses go to the database.' },
    db: { icon: '🗄️', name: 'Database', cost: 300, desc: 'Stores your data. You choose relational or non-relational and the engine.' },
    queue: { icon: '📬', name: 'Message Queue', cost: 180, cap: 100000, desc: 'Buffers writes and smooths spikes (workers see about half the peak).' },
    worker: { icon: '👷', name: 'Worker', cost: 80, cap: 4000, desc: 'Takes jobs from a queue and writes to the database (~4,000/s).' },
    storage: { icon: '🪣', name: 'Object Storage', cost: 150, cap: 300000, desc: 'Cheap, durable home for files (S3). Serves static traffic.' },
    search: { icon: '🔎', name: 'Search Index', cost: 250, cap: 15000, desc: 'Elasticsearch-style full-text search (~15,000 queries/s).' }
  };
  const SHOP = ['dns', 'cdn', 'ratelimiter', 'lb', 'gateway', 'server', 'ws', 'cache', 'db', 'queue', 'worker', 'storage', 'search'];

  const ENGINES = {
    postgresql: { name: 'PostgreSQL', kind: 'relational', family: 'Relational (SQL)', R: 8000, W: 3000, scale: 'replicas', extra: 0, good: 'ACID transactions, joins, rich SQL, JSON, extensions. The safest default.', bad: 'Writes scale on one leader; reads scale with replicas.' },
    mysql: { name: 'MySQL', kind: 'relational', family: 'Relational (SQL)', R: 9000, W: 2500, scale: 'replicas', extra: 0, good: 'Very popular, fast simple reads, huge ecosystem.', bad: 'Single-leader writes; fewer advanced features than Postgres.' },
    cockroachdb: { name: 'CockroachDB', kind: 'relational', family: 'Distributed SQL', R: 15000, W: 8000, scale: 'nodes', extra: 200, good: 'SQL + ACID that scales out across nodes and regions.', bad: 'Higher latency per write, more expensive and complex.' },
    mongodb: { name: 'MongoDB', kind: 'nosql', family: 'Document store', R: 10000, W: 6000, scale: 'replicas', extra: 0, good: 'Flexible JSON documents, easy schema changes, sharding built in.', bad: 'Joins are weak; design documents around queries.' },
    cassandra: { name: 'Cassandra', kind: 'nosql', family: 'Wide-column store', R: 6000, W: 30000, scale: 'nodes', extra: 0, good: 'Huge write throughput, no single point of failure, scales linearly.', bad: 'Query-first modeling, eventual consistency, no joins.' },
    dynamodb: { name: 'DynamoDB', kind: 'nosql', family: 'Key-value store', R: 35000, W: 35000, scale: 'nodes', extra: 100, good: 'Fully managed, fast key lookups at any scale.', bad: 'Limited query patterns; costs grow with traffic.' },
    redis: { name: 'Redis', kind: 'nosql', family: 'In-memory key-value', R: 80000, W: 60000, scale: 'nodes', extra: 0, volatile: true, good: 'Blazing fast. Perfect for sessions, counters, leaderboards.', bad: 'Data lives in RAM — risky as the only copy of important data.' },
    neo4j: { name: 'Neo4j', kind: 'nosql', family: 'Graph database', R: 4000, W: 1000, scale: 'replicas', extra: 0, good: 'Walks relationships (friends-of-friends) very fast.', bad: 'Not built for high write volume or simple key lookups.' }
  };
  const UNIT_COST = 150;

  // ---------- missions ----------
  const MISSIONS = [
    { id: 'm1', icon: '🏡', title: 'First Village', lesson: 'how-the-web-works',
      story: 'A small blog. Villagers read posts and sometimes write comments. Get your first system online!',
      traffic: { read: 400, write: 20 }, budget: 500,
      reqs: [{ rule: ['has', 'server'], text: 'Build an App Server', why: 'Something must run your code.' },
             { rule: ['has', 'db'], text: 'Store data in a Database', why: 'Posts and comments must survive restarts.' }],
      tip: 'Village → App Server → Database. Click 🛣️ Road, then click two buildings to connect them.' },
    { id: 'm2', icon: '🛒', title: 'Market Day', lesson: 'caching',
      story: 'A flash sale! Thousands of shoppers browse products at once. Orders must never be lost.',
      traffic: { read: 9000, write: 300, static: 2000 }, budget: 2000,
      reqs: [{ rule: ['has', 'lb'], text: 'Use a Load Balancer', why: 'One server cannot carry a flash sale, and it would be a single point of failure.' },
             { rule: ['count', 'server', 2], text: 'Run at least 2 App Servers', why: 'Two or more removes the single point of failure.' },
             { rule: ['has', 'cache'], text: 'Cache hot product pages', why: 'Most shoppers view the same few products — a cache absorbs those reads.' },
             { rule: ['dbKind', 'relational'], text: 'Orders in a relational database', why: 'Orders and stock need ACID transactions so nothing is sold twice or lost.' }] },
    { id: 'm3', icon: '💰', title: 'Royal Treasury', lesson: 'acid',
      story: 'The kingdom moves gold between accounts. Every coin must add up — always.',
      traffic: { read: 12000, write: 2000 }, budget: 2200,
      reqs: [{ rule: ['dbKind', 'relational'], text: 'Use a relational database', why: 'Money transfers need ACID: all-or-nothing, consistent and durable.' },
             { rule: ['noVolatile'], text: 'No in-memory-only database for money', why: 'Redis keeps data in RAM; money needs durable storage.' },
             { rule: ['has', 'lb'], text: 'Load Balancer in front of servers', why: 'Spread traffic and survive a server failure.' }],
      tip: 'Reads are heavy. Click your database and add read replicas.' },
    { id: 'm4', icon: '🖼️', title: 'Gallery of Portraits', lesson: 'cdn',
      story: 'A photo-sharing village. Everyone scrolls pictures all day. That is a LOT of bytes.',
      traffic: { read: 3000, write: 200, static: 40000 }, budget: 2000,
      reqs: [{ rule: ['has', 'cdn'], text: 'Serve images from a CDN', why: 'CDN edges near users serve images fast and take load off your servers.' },
             { rule: ['has', 'storage'], text: 'Keep photos in Object Storage', why: 'Files belong in object storage (S3), not in the database.' }],
      tip: 'Put the CDN right after the Village so it catches static traffic first.' },
    { id: 'm5', icon: '📣', title: 'Town Crier', lesson: 'realtime',
      story: 'A chat app! Villagers send messages that must arrive instantly. Messages pile up fast.',
      traffic: { rt: 30000, read: 2000, write: 300 }, budget: 2600,
      reqs: [{ rule: ['has', 'ws'], text: 'Use WebSocket Gateways for live chat', why: 'Polling servers for messages wastes resources; WebSockets push instantly.' },
             { rule: ['dbEngine', ['cassandra', 'dynamodb', 'mongodb']], text: 'Store messages in a scalable NoSQL store', why: 'Chat history is write-heavy and read by conversation — a great fit for wide-column/key-value stores.' }],
      tip: 'Village → Load Balancer → several WebSocket Gateways → database. Regular reads still need App Servers.' },
    { id: 'm6', icon: '📚', title: 'The Great Library', lesson: 'search',
      story: 'Scholars search millions of scrolls by keywords. The database alone is drowning.',
      traffic: { read: 3000, search: 6000, write: 100 }, budget: 1800,
      reqs: [{ rule: ['has', 'search'], text: 'Add a Search Index', why: 'Full-text search with LIKE queries scans everything. An inverted index answers instantly.' },
             { rule: ['has', 'db'], text: 'Keep a primary Database as the source of truth', why: 'The search index is a copy; the database owns the data.' }] },
    { id: 'm7', icon: '🤖', title: 'Siege of the Bots', lesson: 'rate-limiting',
      story: 'Goblin bots are hammering your API with junk requests. Keep real villagers happy.',
      traffic: { read: 4000, write: 400, bot: 25000 }, budget: 1700,
      reqs: [{ rule: ['has', 'ratelimiter'], text: 'Add a Rate Limiter', why: 'Rate limiting returns 429 to abusers and protects everything behind it.' },
             { rule: ['before', 'ratelimiter', 'server'], text: 'Rate limiter sits before the servers', why: 'Block bad traffic as early as possible.' }] },
    { id: 'm8', icon: '📊', title: 'Event Horizon', lesson: 'message-queues',
      story: 'Every click in the kingdom becomes an analytics event. 40,000 writes per second!',
      traffic: { write: 40000, read: 500 }, budget: 2600,
      reqs: [{ rule: ['has', 'queue'], text: 'Buffer events in a Message Queue', why: 'A queue absorbs bursts and decouples ingestion from processing.' },
             { rule: ['has', 'worker'], text: 'Process events with Workers', why: 'Workers drain the queue at a steady pace.' },
             { rule: ['dbEngine', ['cassandra', 'dynamodb']], text: 'Write-optimized NoSQL store', why: 'Huge append-only write volume suits Cassandra/DynamoDB.' }] },
    { id: 'm9', icon: '🕸️', title: 'Web of Friends', lesson: 'nosql-types',
      story: 'Show "people you may know": friends of friends of friends. Relationships everywhere.',
      traffic: { read: 6000, write: 200 }, budget: 1600,
      reqs: [{ rule: ['dbEngine', ['neo4j']], text: 'Use a graph database', why: 'Multi-hop relationship queries are what graph databases are built for.' },
             { rule: ['has', 'cache'], text: 'Cache recommendations', why: 'Recommendations change slowly — caching them protects the graph DB.' }] },
    { id: 'm10', icon: '🔗', title: 'Empire of Links', lesson: 'case-url-shortener',
      story: 'A URL shortener for the whole world. Billions of redirects, few new links.',
      traffic: { read: 60000, write: 600 }, budget: 3000,
      reqs: [{ rule: ['has', 'cache'], text: 'Cache hot links', why: 'A few links get most clicks — caching makes redirects instant.' },
             { rule: ['dbEngine', ['dynamodb', 'cassandra']], text: 'Key-value / wide-column storage for code → URL', why: 'Simple lookups by key at huge scale fit NoSQL perfectly.' },
             { rule: ['has', 'lb'], text: 'Load Balancer', why: 'You will need many servers.' }] },
    { id: 'sandbox', icon: '🧪', title: 'Sandbox', lesson: null, sandbox: true,
      story: 'No rules. Set your own traffic and experiment freely.',
      traffic: { read: 5000, write: 500, static: 2000, search: 0, rt: 0, bot: 0 }, budget: 99999, reqs: [] }
  ];
  const CAT = { read: 'Reads', write: 'Writes', static: 'Static files', search: 'Searches', rt: 'Live messages', bot: 'Bot requests' };

  // ---------- simulation ----------
  function simulate(level, traffic) {
    const nodes = level.nodes, byId = {}; nodes.forEach(n => byId[n.id] = n);
    const L = {}; nodes.forEach(n => L[n.id] = { read: 0, write: 0, static: 0, search: 0, rt: 0, bot: 0 });
    const drops = []; const flows = {}; let searchOnDb = false;
    const kids = id => level.roads.filter(r => r[0] === id).map(r => byId[r[1]]).filter(Boolean);
    const sum = t => Object.values(t).reduce((a, b) => a + b, 0);
    const drop = (n, cat, amt, need) => { if (amt > 0.5) drops.push({ at: n, cat, amt, need }); };
    function split(n, t, targets, depth, parent) {
      if (!targets.length) return false;
      targets.forEach(k => { const part = {}; for (const c in t) part[c] = t[c] / targets.length; flows[n.id + '>' + k.id] = (flows[n.id + '>' + k.id] || 0) + sum(part); send(k, part, depth + 1, n); });
      return true;
    }
    const only = (cat, v) => ({ read: 0, write: 0, static: 0, search: 0, rt: 0, bot: 0, [cat]: v });
    function send(n, t, depth, parent) {
      if (depth > 14 || sum(t) <= 0) return;
      for (const c in t) L[n.id][c] += t[c];
      const ks = kids(n.id), of = (...types) => ks.filter(k => types.includes(k.type));
      // Layer-7 style routing: live (rt) traffic goes to WebSocket gateways, everything else to the other roads
      const passAll = (tt, need) => {
        if (sum(tt) <= 0) return;
        const wsK = ks.filter(k => k.type === 'ws'), other = ks.filter(k => k.type !== 'ws');
        if (wsK.length && other.length) {
          if (tt.rt) split(n, only('rt', tt.rt), wsK, depth, parent);
          const rest = { ...tt, rt: 0 }; if (sum(rest) > 0) split(n, rest, other, depth, parent);
          return;
        }
        if (!split(n, tt, ks, depth, parent)) for (const c in tt) drop(n, c, tt[c], need);
      };
      switch (n.type) {
        case 'client': case 'dns': case 'lb': case 'gateway': passAll(t, 'the next building'); break;
        case 'cdn': passAll({ ...t, static: t.static * 0.05 }, 'the next building'); break;
        case 'ratelimiter': passAll({ ...t, bot: 0 }, 'the next building'); break;
        case 'ws': {
          const msgs = only('write', t.rt * 0.5);
          if (t.rt && !split(n, msgs, of('queue', 'db'), depth, parent)) drop(n, 'rt', t.rt, 'a Queue or Database');
          const rest = { ...t, rt: 0 };
          if (sum(rest) > 0 && !split(n, rest, of('server', 'lb'), depth, parent)) for (const c in rest) drop(n, c, rest[c], 'an App Server');
          break;
        }
        case 'server': {
          const reads = t.read + t.bot;
          if (reads && !split(n, only('read', reads), of('cache').length ? of('cache') : of('db'), depth, n)) drop(n, 'read', reads, 'a Cache or Database');
          const writes = t.write + t.rt * 0.5;
          if (writes && !split(n, only('write', writes), of('queue').length ? of('queue') : of('db'), depth, n)) drop(n, 'write', writes, 'a Queue or Database');
          if (t.static) split(n, only('static', t.static), of('storage'), depth, n);
          if (t.search && !split(n, only('search', t.search), of('search'), depth, n)) {
            searchOnDb = true;
            if (!split(n, only('read', t.search * 5), of('db'), depth, n)) drop(n, 'search', t.search, 'a Search Index or Database');
          }
          break;
        }
        case 'cache': {
          const dbs = of('db').length ? of('db') : (parent ? kids(parent.id).filter(k => k.type === 'db') : []);
          const miss = (t.read + t.bot) * 0.15;
          if (miss && !split(n, only('read', miss), dbs, depth, n)) drop(n, 'read', miss, 'a Database');
          if (t.write && !split(n, only('write', t.write), dbs, depth, n)) drop(n, 'write', t.write, 'a Database');
          break;
        }
        case 'queue': {
          const w = (t.write) * 0.5;
          if (w && !split(n, only('write', w), of('worker').length ? of('worker') : of('db'), depth, n)) drop(n, 'write', t.write, 'a Worker or Database');
          break;
        }
        case 'worker': if (t.write && !split(n, only('write', t.write), of('db'), depth, n)) drop(n, 'write', t.write, 'a Database'); break;
        case 'search': if (ks.length && t.search) { /* index is terminal */ } break;
        default: break;
      }
    }
    const client = nodes.find(n => n.type === 'client');
    send(client, { read: 0, write: 0, static: 0, search: 0, rt: 0, bot: 0, ...traffic }, 0, null);

    const util = {}, detail = {};
    nodes.forEach(n => {
      const l = L[n.id]; const all = sum(l); let u = 0;
      switch (n.type) {
        case 'server': u = (l.read + l.write + l.static + l.search + l.bot + l.rt * 2) / B.server.cap; break;
        case 'ws': u = l.rt / B.ws.cap + (l.read + l.write + l.static) / 50000; break;
        case 'cache': u = (l.read + l.bot + l.write) / B.cache.cap; break;
        case 'queue': u = l.write / B.queue.cap; break;
        case 'worker': u = l.write / B.worker.cap; break;
        case 'storage': u = l.static / B.storage.cap; break;
        case 'search': u = l.search / B.search.cap; break;
        case 'db': {
          const e = ENGINES[n.engine]; if (!e) { u = all > 0 ? 9 : 0; break; }
          const m = 1 + (n.scale || 0);
          const R = e.R * m, W = e.W * (e.scale === 'nodes' ? m : 1);
          const ur = (l.read + l.bot) / R, uw = l.write / W; u = Math.max(ur, uw);
          detail[n.id] = { ur, uw, R, W }; break;
        }
        case 'client': case 'dns': u = 0; break;
        default: u = B[n.type].cap ? all / B[n.type].cap : 0;
      }
      util[n.id] = u;
    });
    return { L, util, drops, flows, detail, searchOnDb };
  }

  function levelCost(level) {
    return level.nodes.reduce((s, n) => s + (B[n.type]?.cost || 0) + (n.type === 'db' ? (ENGINES[n.engine]?.extra || 0) + (n.scale || 0) * UNIT_COST : 0), 0);
  }
  function reachable(level, fromId) {
    const seen = new Set([fromId]); const st = [fromId];
    while (st.length) { const id = st.pop(); level.roads.filter(r => r[0] === id).forEach(r => { if (!seen.has(r[1])) { seen.add(r[1]); st.push(r[1]); } }); }
    return seen;
  }
  function checkReq(level, rule) {
    const live = reachable(level, 'c');
    const ns = level.nodes.filter(n => live.has(n.id));
    const [kind, a, b] = rule;
    if (kind === 'has') return ns.some(n => n.type === a);
    if (kind === 'count') return ns.filter(n => n.type === a).length >= b;
    if (kind === 'dbKind') { const dbs = ns.filter(n => n.type === 'db'); return dbs.length > 0 && dbs.every(n => ENGINES[n.engine]?.kind === a); }
    if (kind === 'dbEngine') return ns.some(n => n.type === 'db' && a.includes(n.engine));
    if (kind === 'noVolatile') return !ns.some(n => n.type === 'db' && ENGINES[n.engine]?.volatile);
    if (kind === 'before') {
      // every path from the village to a node of type b passes through a node of type a
      const seen = new Set(['c']); const st = ['c'];
      while (st.length) { const id = st.pop(); level.roads.filter(r => r[0] === id).forEach(r => { const t = level.nodes.find(n => n.id === r[1]); if (t && t.type !== a && !seen.has(t.id)) { seen.add(t.id); st.push(t.id); } }); }
      return ns.some(n => n.type === a) && !level.nodes.some(n => n.type === b && seen.has(n.id));
    }
    return false;
  }

  // ---------- page ----------
  PAGES.play = function (main, params) {
    const mission = MISSIONS.find(m => m.id === params[0]);
    if (!mission) return missionList(main);
    battle(main, mission);
  };

  function missionList(main) {
    const stars = Store.get('play_stars', {});
    main.innerHTML = `
      <h1 class="page-title stroke">🛡️ Build &amp; Defend</h1>
      <p class="page-sub">Build a system from real components, then survive 3 waves of traffic. Overloaded buildings catch fire 🔥 — learn why and rebuild. Earn up to 3 ⭐ per mission.</p>
      <div class="panel" style="margin-bottom:18px">
        <b>How to play:</b> drag buildings from the shop onto the field · click <b>🛣️ Road</b>, then click two buildings to send traffic from the first to the second ·
        press <b>⚔️ Start Raid</b>. ⭐ survive all waves · ⭐⭐ meet the mission requirements · ⭐⭐⭐ stay within budget.
      </div>
      <div class="missions-grid">${MISSIONS.map((m, i) => `
        <a class="panel card" style="text-decoration:none;color:inherit" href="#/play/${m.id}">
          <div style="font-size:44px">${m.icon}</div>
          <h3>${m.sandbox ? '' : (i + 1) + '. '}${esc(m.title)}</h3>
          <p>${esc(m.story)}</p>
          ${m.sandbox ? '<span class="chip">Free play</span>' : `<div class="stars" style="font-size:26px">${[1, 2, 3].map(s => `<span class="${s <= (stars[m.id] || 0) ? '' : 'off'}">⭐</span>`).join('')}</div>`}
        </a>`).join('')}</div>`;
  }

  function battle(main, mission) {
    const KEY = 'play_' + mission.id;
    let level = Store.get(KEY, null) || { nodes: [{ id: 'c', type: 'client', x: 90, y: 300 }], roads: [] };
    let traffic = { ...mission.traffic, ...(mission.sandbox ? Store.get('play_sandbox_traffic', {}) : {}) };
    let selected = null, roadMode = false, roadFrom = null, raiding = false, lastReqs = null;
    const save = () => Store.set(KEY, level);
    const uid = () => 'n' + Math.random().toString(36).slice(2, 8);

    main.innerHTML = `
      <div class="row-flex" style="justify-content:space-between;margin-bottom:12px">
        <h1 class="page-title stroke" style="margin:0">${mission.icon} ${esc(mission.title)}</h1>
        <a class="btn grey small" href="#/play">← Missions</a>
      </div>
      <div class="play-layout">
        <aside class="panel shop"><h3>🏪 Shop</h3>
          ${SHOP.map(t => `<div class="shop-item" draggable="true" data-type="${t}" title="${esc(B[t].desc)}"><span class="si">${B[t].icon}</span><div>${B[t].name}<small>🪙 ${B[t].cost}${B[t].cap && isFinite(B[t].cap) ? ' · ' + B[t].cap.toLocaleString('en-US') + '/s' : ''}</small></div></div>`).join('')}
          <p class="muted" style="font-size:12px">Drag onto the field, or tap to place.</p>
        </aside>
        <div>
          <div class="battlefield" id="field"><svg class="roads" id="roads"></svg><div class="bf-overlay" id="bfMsg"></div></div>
          <div class="row-flex" style="margin-top:12px">
            <button class="btn blue" id="roadBtn">🛣️ Road</button>
            <button class="btn red" id="raidBtn">⚔️ Start Raid</button>
            <button class="btn grey small" id="resetBtn">↺ Reset field</button>
            ${mission.lesson ? `<a class="btn grey small" href="#/learn/${mission.lesson}">📜 Related lesson</a>` : ''}
          </div>
        </div>
        <aside>
          <div class="panel mission-card" id="mPanel"></div>
          <div class="spacer"></div>
          <div class="panel mission-card" id="selPanel"></div>
        </aside>
      </div>`;
    const field = main.querySelector('#field'), roadsSvg = main.querySelector('#roads');

    // ---------- render ----------
    function render() {
      const W = field.clientWidth || 800, H = field.clientHeight || 620;
      [...field.querySelectorAll('.bf-building')].forEach(e => e.remove());
      level.nodes.forEach(n => {
        n.x = Math.max(50, Math.min(W - 50, n.x)); n.y = Math.max(45, Math.min(H - 55, n.y));
        const e = ENGINES[n.engine];
        const label = n.type === 'db' ? (e ? e.name : 'Database?') : B[n.type].name;
        const badge = n.type === 'db' && n.scale ? `<span class="badge">+${n.scale} ${e?.scale === 'nodes' ? 'nodes' : 'replicas'}</span>` : '';
        const el = SK.h(`<div class="bf-building ${selected === n.id ? 'selected' : ''} ${roadFrom === n.id ? 'linking' : ''}" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px">
          <div class="base">${B[n.type].icon}${badge}</div><div class="label">${esc(label)}</div><div class="hp"><div></div></div></div>`);
        field.appendChild(el);
      });
      renderRoads();
      renderPanels();
    }
    function renderRoads() {
      roadsSvg.innerHTML = `<defs><marker id="road-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="20" markerHeight="20" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#5b3414"/></marker></defs>` +
        level.roads.map(([a, b]) => {
          const A = level.nodes.find(n => n.id === a), Bn = level.nodes.find(n => n.id === b); if (!A || !Bn) return '';
          const mx = A.x + (Bn.x - A.x) * 0.6, my = A.y + (Bn.y - A.y) * 0.6;
          return `<line x1="${A.x}" y1="${A.y}" x2="${Bn.x}" y2="${Bn.y}" stroke="#8a5426" stroke-width="14" stroke-linecap="round" opacity=".85"/>
            <line x1="${A.x}" y1="${A.y}" x2="${Bn.x}" y2="${Bn.y}" stroke="#d9b07a" stroke-width="4" stroke-dasharray="10 10" stroke-linecap="round"/>
            <line x1="${A.x}" y1="${A.y}" x2="${mx}" y2="${my}" stroke="transparent" marker-end="url(#road-arr)" stroke-width="10"/>`;
        }).join('');
    }
    function renderPanels() {
      const cost = levelCost(level);
      const reqs = mission.reqs.map((r, i) => {
        const state = lastReqs ? (lastReqs[i] ? 'ok' : 'fail') : 'todo';
        return `<div class="req ${state}">${esc(r.text)}</div>`;
      }).join('');
      const trafficRows = Object.entries(traffic).filter(([k, v]) => v || mission.sandbox).map(([k, v]) => mission.sandbox
        ? `<div class="req" style="display:flex;justify-content:space-between;align-items:center">${CAT[k]}<input type="number" min="0" step="500" data-traffic="${k}" value="${v}" style="width:100px;padding:2px 6px;border-width:2px"></div>`
        : `<div class="req" style="display:flex;justify-content:space-between">${CAT[k]}<b>${v.toLocaleString('en-US')}/s</b></div>`).join('');
      main.querySelector('#mPanel').innerHTML = `
        <h3>${mission.icon} Mission</h3><p style="margin:4px 0 8px">${esc(mission.story)}</p>
        <b>Peak traffic</b>${trafficRows}
        ${mission.reqs.length ? `<div class="spacer"></div><b>Requirements</b>${reqs}` : ''}
        <div class="spacer"></div>
        <div class="row-flex" style="justify-content:space-between"><b>Budget</b><b style="color:${cost > mission.budget ? 'var(--red-dark)' : 'var(--green-dark)'}">🪙 ${cost.toLocaleString('en-US')} / ${mission.sandbox ? '∞' : mission.budget.toLocaleString('en-US')}</b></div>
        ${mission.tip ? `<div class="explain" style="font-size:13px">💡 ${esc(mission.tip)}</div>` : ''}`;
      main.querySelectorAll('[data-traffic]').forEach(inp => inp.onchange = () => {
        traffic[inp.dataset.traffic] = Math.max(0, +inp.value || 0); Store.set('play_sandbox_traffic', traffic);
      });
      renderSel();
    }
    function renderSel() {
      const p = main.querySelector('#selPanel');
      const n = level.nodes.find(x => x.id === selected);
      if (!n) { p.innerHTML = `<h3>🔍 Inspect</h3><p class="muted">Click a building to see what it does, change it, or remove roads.</p>`; return; }
      const outs = level.roads.filter(r => r[0] === n.id).map(r => level.nodes.find(x => x.id === r[1])).filter(Boolean);
      const e = ENGINES[n.engine];
      let dbHtml = '';
      if (n.type === 'db') {
        dbHtml = e ? `<div class="explain" style="font-size:13px"><b>${e.name}</b> · ${e.family}<br>Reads ~${e.R.toLocaleString('en-US')}/s · Writes ~${e.W.toLocaleString('en-US')}/s<br>👍 ${esc(e.good)}<br>👎 ${esc(e.bad)}</div>
          <div class="row-flex" style="margin-top:8px"><b>${e.scale === 'nodes' ? 'Extra nodes' : 'Read replicas'}: ${n.scale || 0}</b>
          <button class="btn small grey" data-scale="-1">−</button><button class="btn small" data-scale="1">+</button><small class="muted">🪙${UNIT_COST} each</small></div>
          <p class="muted" style="font-size:12px">${e.scale === 'nodes' ? 'More nodes add read AND write capacity (data is partitioned).' : 'Replicas add read capacity only — all writes still go to one leader.'}</p>
          <button class="btn small blue" id="chgEngine">🔁 Change database</button>` : `<button class="btn small blue" id="chgEngine">Choose database type</button>`;
      }
      p.innerHTML = `<h3>${B[n.type].icon} ${n.type === 'db' && e ? e.name : B[n.type].name}</h3>
        <p style="font-size:14px">${esc(B[n.type].desc)}</p>${dbHtml}
        <div class="spacer"></div><b>Roads out</b>
        ${outs.length ? outs.map(o => `<div class="req" style="display:flex;justify-content:space-between">→ ${B[o.type].icon} ${o.type === 'db' && ENGINES[o.engine] ? ENGINES[o.engine].name : B[o.type].name}<button class="btn small grey" data-unroad="${o.id}">✖</button></div>`).join('') : '<p class="muted" style="font-size:13px">None yet. Use 🛣️ Road.</p>'}
        <div class="spacer"></div>
        <div class="row-flex"><button class="btn small blue" id="roadFromHere">🛣️ Road from here</button>${n.type !== 'client' ? '<button class="btn small red" id="demolish">🗑️ Demolish</button>' : ''}</div>`;
      p.querySelectorAll('[data-unroad]').forEach(b => b.onclick = () => { level.roads = level.roads.filter(r => !(r[0] === n.id && r[1] === b.dataset.unroad)); changed(); });
      p.querySelectorAll('[data-scale]').forEach(b => b.onclick = () => { n.scale = Math.max(0, Math.min(6, (n.scale || 0) + +b.dataset.scale)); changed(); });
      const ce = p.querySelector('#chgEngine'); if (ce) ce.onclick = () => chooseDb(n, false);
      const de = p.querySelector('#demolish'); if (de) de.onclick = () => { level.nodes = level.nodes.filter(x => x !== n); level.roads = level.roads.filter(r => r[0] !== n.id && r[1] !== n.id); selected = null; changed(); };
      p.querySelector('#roadFromHere').onclick = () => { setRoad(true); roadFrom = n.id; render(); msg('Now click the building the road should lead to.'); };
    }
    function changed() { lastReqs = null; save(); render(); }
    let msgTimer;
    function msg(t, ms = 2600) {
      const el = main.querySelector('#bfMsg'); el.innerHTML = t ? `<span class="banner" style="font-size:16px">${t}</span>` : '';
      clearTimeout(msgTimer); if (t && ms) msgTimer = setTimeout(() => el.innerHTML = '', ms);
    }
    function setRoad(on) { roadMode = on; roadFrom = null; const b = main.querySelector('#roadBtn'); b.classList.toggle('gold', on); b.classList.toggle('blue', !on); b.textContent = on ? '🛣️ Road: ON' : '🛣️ Road'; }

    // ---------- DB choice (the teaching moment) ----------
    function chooseDb(node, isNew) {
      const step1 = () => openModal(`
        <h2 style="margin-top:0">🗄️ What kind of database?</h2>
        <p>Think about your data. Does it need strict rules and transactions, or flexible shapes and massive scale?</p>
        <div class="db-choice">
          <button data-kind="relational"><b>🏛️ Relational (SQL)</b><small>Tables, rows, joins and <b>ACID transactions</b>. Best when data must be correct: money, orders, bookings.</small></button>
          <button data-kind="nosql"><b>🧱 Non-relational (NoSQL)</b><small>Documents, key-value, wide-column or graph. Best for huge scale, flexible data, or special access patterns.</small></button>
        </div>
        <p class="muted" style="font-size:13px">Note: "SQL" is the query language. PostgreSQL and MySQL are relational databases that speak SQL.</p>
        <div class="row-flex" style="justify-content:flex-end"><button class="btn grey small" id="dbCancel">Cancel</button></div>`, c => {
        c.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => step2(b.dataset.kind));
        c.querySelector('#dbCancel').onclick = cancel;
      });
      const step2 = kind => openModal(`
        <h2 style="margin-top:0">${kind === 'relational' ? '🏛️ Pick a relational database' : '🧱 Pick a NoSQL database'}</h2>
        <div class="db-choice">${Object.entries(ENGINES).filter(([, e]) => e.kind === kind).map(([k, e]) => `
          <button data-engine="${k}"><b>${e.name}</b><small>${e.family} · R ${(e.R / 1000)}K/s · W ${(e.W / 1000)}K/s${e.extra ? ' · +🪙' + e.extra : ''}</small><br><small>👍 ${esc(e.good)}</small><br><small>👎 ${esc(e.bad)}</small></button>`).join('')}
        </div>
        <div class="row-flex" style="justify-content:space-between"><button class="btn grey small" id="dbBack">← Back</button><button class="btn grey small" id="dbCancel">Cancel</button></div>`, c => {
        c.querySelectorAll('[data-engine]').forEach(b => b.onclick = () => {
          node.engine = b.dataset.engine; node.scale = node.scale || 0; closeModal();
          const e = ENGINES[node.engine];
          toast(`${e.name} built — ${e.family}`); selected = node.id; changed();
        });
        c.querySelector('#dbBack').onclick = step1; c.querySelector('#dbCancel').onclick = cancel;
      });
      const cancel = () => { closeModal(); if (isNew && !node.engine) { level.nodes = level.nodes.filter(x => x !== node); changed(); } };
      step1();
    }

    // ---------- placing & moving ----------
    function place(type, x, y) {
      if (raiding) return;
      const n = { id: uid(), type, x, y };
      level.nodes.push(n); selected = n.id; changed();
      if (type === 'db') chooseDb(n, true);
    }
    function freeSpot() {
      const W = field.clientWidth, H = field.clientHeight;
      for (let y = 90; y < H - 60; y += 110) for (let x = 230; x < W - 60; x += 120)
        if (!level.nodes.some(n => Math.abs(n.x - x) < 90 && Math.abs(n.y - y) < 90)) return { x, y };
      return { x: W / 2 + Math.random() * 80, y: H / 2 + Math.random() * 80 };
    }
    main.querySelectorAll('.shop-item').forEach(it => {
      it.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', it.dataset.type));
      it.addEventListener('click', () => { const p = freeSpot(); place(it.dataset.type, p.x, p.y); });
    });
    field.addEventListener('dragover', e => e.preventDefault());
    field.addEventListener('drop', e => {
      e.preventDefault(); const t = e.dataTransfer.getData('text/plain'); if (!B[t] || t === 'client') return;
      const r = field.getBoundingClientRect(); place(t, e.clientX - r.left, e.clientY - r.top);
    });
    let mv = null;
    field.addEventListener('pointerdown', e => {
      const el = e.target.closest('.bf-building');
      if (!el) { if (!raiding) { selected = null; if (roadMode) roadFrom = null; render(); } return; }
      if (raiding) return;
      const n = level.nodes.find(x => x.id === el.dataset.id);
      if (roadMode) {
        if (!roadFrom) { roadFrom = n.id; render(); msg('Now click where the road should lead.'); }
        else if (roadFrom !== n.id) {
          if (n.type === 'client') { msg('Roads can\'t lead back into the Village.'); return; }
          if (!level.roads.some(r => r[0] === roadFrom && r[1] === n.id)) level.roads.push([roadFrom, n.id]);
          roadFrom = null; msg('Road built! Click another building to start a new road.'); changed();
        }
        return;
      }
      const r = field.getBoundingClientRect();
      mv = { n, dx: e.clientX - r.left - n.x, dy: e.clientY - r.top - n.y, moved: false, el };
      field.setPointerCapture(e.pointerId);
    });
    field.addEventListener('pointermove', e => {
      if (!mv) return; const r = field.getBoundingClientRect();
      const x = e.clientX - r.left - mv.dx, y = e.clientY - r.top - mv.dy;
      if (!mv.moved && Math.hypot(x - mv.n.x, y - mv.n.y) < 4) return;
      mv.moved = true; mv.n.x = x; mv.n.y = y; mv.el.style.left = x + 'px'; mv.el.style.top = y + 'px';
      renderRoads();
    });
    field.addEventListener('pointerup', () => {
      if (!mv) return;
      if (!mv.moved) { selected = mv.n.id; render(); } else save();
      mv = null;
    });
    main.querySelector('#roadBtn').onclick = () => { setRoad(!roadMode); render(); if (roadMode) msg('Click a building, then another, to build a road between them.'); };
    main.querySelector('#resetBtn').onclick = () => {
      if (!confirm('Clear the field?')) return;
      level = { nodes: [{ id: 'c', type: 'client', x: 90, y: 300 }], roads: [] }; selected = null; changed();
    };

    // ---------- raid ----------
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    function animateTroops(sim, bots) {
      const byId = {}; level.nodes.forEach(n => byId[n.id] = n);
      const depth = { c: 0 }; const q = ['c'];
      while (q.length) { const id = q.shift(); level.roads.filter(r => r[0] === id).forEach(r => { if (depth[r[1]] == null) { depth[r[1]] = depth[id] + 1; q.push(r[1]); } }); }
      level.roads.forEach(([a, b]) => {
        const flow = sim.flows[a + '>' + b] || 0; if (flow <= 0 || depth[a] == null) return;
        const A = byId[a], Bn = byId[b]; const count = Math.min(6, 1 + Math.floor(Math.log10(flow + 1)));
        for (let i = 0; i < count; i++) {
          const t = SK.h(`<div class="troop ${bots && a === 'c' && i % 2 ? 'bad' : ''}"></div>`); field.appendChild(t);
          const anim = t.animate([{ left: A.x - 6 + 'px', top: A.y - 6 + 'px' }, { left: Bn.x - 6 + 'px', top: Bn.y - 6 + 'px' }],
            { duration: 650, delay: depth[a] * 380 + i * 110, easing: 'ease-in', fill: 'both' });
          anim.onfinish = () => t.remove();
        }
      });
    }
    function showHealth(sim) {
      level.nodes.forEach(n => {
        const el = field.querySelector(`.bf-building[data-id="${n.id}"]`); if (!el) return;
        const u = sim.util[n.id] || 0; const bar = el.querySelector('.hp > div');
        bar.style.width = Math.min(100, u * 100) + '%';
        bar.style.background = u > 1 ? 'var(--red)' : u > 0.75 ? 'var(--gold)' : 'var(--green)';
        el.classList.toggle('overloaded', u > 1);
        el.title = `${Math.round(u * 100)}% load`;
      });
    }
    main.querySelector('#raidBtn').onclick = async () => {
      if (raiding) return;
      if (level.nodes.some(n => n.type === 'db' && !n.engine)) { toast('Choose a type for every database first'); return; }
      raiding = true; selected = null; setRoad(false); render();
      const waves = [0.35, 0.7, 1]; const results = [];
      for (let w = 0; w < waves.length; w++) {
        const t = {}; for (const k in traffic) t[k] = traffic[k] * waves[w];
        const total = Object.values(t).reduce((a, b) => a + b, 0);
        msg(`🌊 Wave ${w + 1} · ${Math.round(total).toLocaleString('en-US')} req/s incoming!`, 0);
        const sim = simulate(level, t);
        animateTroops(sim, t.bot > 0);
        await sleep(1700);
        showHealth(sim);
        const over = level.nodes.filter(n => sim.util[n.id] > 1);
        const ok = !over.length && !sim.drops.length;
        results.push({ wave: w + 1, ok, sim, over, total });
        msg(ok ? `✅ Wave ${w + 1} held!` : `💥 Wave ${w + 1} broke through!`, 0);
        await sleep(1300);
        if (!ok) break;
      }
      raiding = false; msg('');
      report(results);
    };

    function advice(n, sim) {
      const d = sim.detail[n.id];
      switch (n.type) {
        case 'server': return 'Add more App Servers behind a Load Balancer (scale out).';
        case 'db': {
          const e = ENGINES[n.engine];
          if (d && d.ur >= d.uw) return `Too many reads for ${e.name}. Put a Cache in front of it, or add ${e.scale === 'nodes' ? 'nodes' : 'read replicas'} (click it → +).`;
          return `Too many writes for ${e.name}. ${e.kind === 'relational' && e.scale === 'replicas' ? 'Replicas don\'t help writes! ' : ''}Try a write-optimized database (Cassandra, DynamoDB), add nodes/shards (a second database = a second shard), or put a Message Queue + Workers in front to smooth the spike.`;
        }
        case 'ws': return 'Add more WebSocket Gateways behind a Load Balancer.';
        case 'cache': return 'Add another cache node (shard the cache).';
        case 'worker': return 'Add more Workers so the queue drains faster.';
        case 'queue': return 'Add another queue (more partitions/brokers).';
        case 'search': return 'Add another Search Index node (shard the index).';
        case 'lb': case 'gateway': return 'Add another Load Balancer / Gateway and split traffic between them.';
        default: return 'Add more capacity here.';
      }
    }
    function report(results) {
      const survived = results.length === 3 && results.every(r => r.ok);
      lastReqs = mission.reqs.map(r => checkReq(level, r.rule));
      const reqOk = lastReqs.every(Boolean);
      const cost = levelCost(level); const inBudget = cost <= mission.budget;
      const starsN = survived ? 1 + (reqOk ? 1 : 0) + (reqOk && inBudget ? 1 : 0) : 0;
      const last = results[results.length - 1];
      const name = n => n.type === 'db' && ENGINES[n.engine] ? ENGINES[n.engine].name : B[n.type].name;
      const prev = Store.get('play_stars', {});
      if (!mission.sandbox && starsN > (prev[mission.id] || 0)) {
        const gain = (starsN - (prev[mission.id] || 0)) * 50; prev[mission.id] = starsN; Store.set('play_stars', prev);
        Player.addGold(gain); Player.addTrophies(starsN * 5);
      }
      const dbs = level.nodes.filter(n => n.type === 'db' && ENGINES[n.engine]);
      const notes = [];
      if (dbs.some(n => ENGINES[n.engine].volatile)) notes.push('Redis keeps data in memory. It is amazing as a cache, but risky as the only copy of important data.');
      if (last.sim.searchOnDb) notes.push('Searches went to the database as slow "LIKE" scans (5× the cost). A Search Index fixes that.');
      if (level.nodes.filter(n => n.type === 'server').length === 1 && survived) notes.push('Only one App Server — it works, but it is a single point of failure.');
      const idx = MISSIONS.indexOf(mission); const next = MISSIONS[idx + 1];
      openModal(`
        <div class="center">
          <div class="stars">${mission.sandbox ? '' : [1, 2, 3].map(s => `<span class="${s <= starsN ? '' : 'off'}">⭐</span>`).join('')}</div>
          <h2 style="margin:4px 0">${survived ? '🏆 Your kingdom stood strong!' : '🔥 The raid broke through!'}</h2>
        </div>
        <div class="report">
          ${results.map(r => `<div class="line">${r.ok ? '✅' : '💥'} <b>Wave ${r.wave}</b> — ${Math.round(r.total).toLocaleString('en-US')} req/s</div>`).join('')}
          ${last.over.length ? `<h3>🔥 Overloaded</h3>` + last.over.map(n => `<div class="line"><b>${B[n.type].icon} ${esc(name(n))}</b> at ${Math.round(last.sim.util[n.id] * 100)}% load<br>👉 ${esc(advice(n, last.sim))}</div>`).join('') : ''}
          ${last.sim.drops.length ? `<h3>🕳️ Lost traffic</h3>` + last.sim.drops.slice(0, 6).map(d => `<div class="line">${Math.round(d.amt).toLocaleString('en-US')}/s ${CAT[d.cat].toLowerCase()} were lost at <b>${esc(name(d.at))}</b> — it needs a road to ${esc(d.need)}.</div>`).join('') : ''}
          ${mission.reqs.length ? `<h3>📜 Requirements ${reqOk ? '(all met)' : ''}</h3>` + mission.reqs.map((r, i) => `<div class="line">${lastReqs[i] ? '✅' : '❌'} <b>${esc(r.text)}</b><br><span class="muted">${esc(r.why)}</span></div>`).join('') : ''}
          ${!mission.sandbox ? `<div class="line">${inBudget ? '✅' : '❌'} <b>Budget:</b> spent 🪙${cost.toLocaleString('en-US')} of ${mission.budget.toLocaleString('en-US')}</div>` : ''}
          ${dbs.length ? `<h3>🗄️ Your database choice</h3>` + dbs.map(n => { const e = ENGINES[n.engine]; return `<div class="line"><b>${e.name}</b> (${e.family}) — 👍 ${esc(e.good)} 👎 ${esc(e.bad)}</div>`; }).join('') : ''}
          ${notes.length ? `<h3>💡 Notes</h3>` + notes.map(t => `<div class="line">${esc(t)}</div>`).join('') : ''}
        </div>
        <div class="spacer"></div>
        <div class="row-flex" style="justify-content:center">
          <button class="btn gold" id="again">🔨 Keep building</button>
          ${starsN && next ? `<a class="btn" href="#/play/${next.id}" id="nextM">Next: ${esc(next.title)} →</a>` : ''}
        </div>`, c => {
        c.querySelector('#again').onclick = () => closeModal();
        const nm = c.querySelector('#nextM'); if (nm) nm.onclick = () => closeModal();
      });
      renderPanels();
    }

    window.addEventListener('resize', render, { once: true });
    render();
  }

  window.SK_PLAY = { simulate, MISSIONS, ENGINES, B, checkReq, levelCost };
})();
