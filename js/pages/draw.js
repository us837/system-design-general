/* Workshop (free whiteboard) and Training Grounds (guided design challenges) */
PAGES.draw = function (main) {
  main.innerHTML = `
    <h1 class="page-title stroke">🧱 Workshop</h1>
    <p class="page-sub">Your whiteboard for architectures and wireframes. It saves automatically in this browser — export PNG/JSON to keep or share.</p>
    <div id="ed"></div>`;
  DiagramEditor(main.querySelector('#ed'), {
    storageKey: 'board_workshop', fileName: 'architecture',
    extraButtons: [{
      label: '✨ Starter template', onClick: api => {
        if (api.getData().nodes.length && !confirm('Replace the board with a starter template? (You can undo.)')) return;
        api.load(api.fromSpec({
          nodes: [['client', 'Users', 40, 200], ['dns', 'DNS', 40, 40], ['cdn', 'CDN', 240, 40], ['lb', 'Load Balancer', 240, 200], ['server', 'App Servers', 440, 200], ['cache', 'Cache', 640, 100], ['db', 'Database', 640, 300], ['queue', 'Queue', 440, 380], ['worker', 'Workers', 640, 460], ['storage', 'Object Storage', 440, 40]],
          edges: [[0, 1, 'lookup'], [0, 2, 'static'], [2, 9], [0, 3], [3, 4], [4, 5], [4, 6], [4, 7, 'async'], [7, 8], [8, 6]]
        }));
      }
    }]
  });
};

PAGES.practice = function (main, params) {
  const { Store, esc, Player, toast } = SK;
  const done = Store.get('practice_done', {});
  const ch = PRACTICE.find(p => p.id === params[0]);
  const DL = { e: ['easy', 'Easy'], m: ['medium', 'Medium'], h: ['hard', 'Hard'] };

  if (!ch) {
    main.innerHTML = `
      <h1 class="page-title stroke">🎯 Training Grounds</h1>
      <p class="page-sub">Design a real system on the whiteboard. When you're ready, check it against the key components, then compare with a reference architecture.</p>
      <div class="grid">${PRACTICE.map(p => `
        <a class="panel card" style="text-decoration:none;color:inherit" href="#/practice/${p.id}">
          <div class="row-flex"><span class="chip ${DL[p.d][0]}">${DL[p.d][1]}</span>${done[p.id] ? `<span class="chip">✅ ${done[p.id]}%</span>` : ''}</div>
          <h3>${esc(p.title)}</h3><p>${esc(p.brief)}</p><span class="btn small">Start designing →</span>
        </a>`).join('')}</div>`;
    return;
  }

  const KEYWORDS = {
    client: ['client', 'user', 'browser', 'web', 'fan', 'creator', 'viewer', 'player'], mobile: ['mobile', 'app', 'phone', 'ios', 'android', 'driver', 'rider'],
    dns: ['dns'], cdn: ['cdn', 'edge', 'cloudfront', 'akamai', 'cloudflare'], lb: ['load balancer', 'balancer', 'lb', 'nginx', 'haproxy', 'elb', 'alb'],
    gateway: ['gateway', 'api gw'], ratelimiter: ['rate limit', 'ratelimit', 'throttl'], server: ['server', 'service', 'api', 'backend'], service: ['service', 'api', 'server', 'backend'],
    ws: ['websocket', 'socket', 'realtime', 'real-time', 'long poll'], worker: ['worker', 'consumer', 'processor', 'transcod', 'fetcher', 'job'],
    cache: ['cache', 'redis', 'memcache'], db: ['sql', 'postgres', 'mysql', 'database', ' db', 'aurora', 'rds'], nosql: ['nosql', 'cassandra', 'dynamo', 'mongo', 'scylla', 'bigtable', 'key-value', 'kv'],
    queue: ['queue', 'kafka', 'sqs', 'rabbit', 'pub/sub', 'pubsub', 'stream', 'kinesis', 'waiting room'], storage: ['s3', 'object', 'blob', 'storage', 'bucket', 'gcs'],
    search: ['search', 'elastic', 'opensearch', 'solr'], vector: ['vector', 'pinecone', 'pgvector', 'milvus', 'weaviate', 'embedding'], llm: ['llm', 'model', 'gpt', 'claude', 'gemini', 'ai'],
    monitor: ['monitor', 'metric', 'observab', 'grafana', 'prometheus'], external: ['apns', 'fcm', 'external', 'third', 'provider', 'twilio', 'stripe', 'psp', 'ses', 'push']
  };
  const EQUIV = { server: ['service', 'ws'], service: ['server', 'worker'], client: ['mobile', 'user'], mobile: ['client', 'user'], db: ['nosql'], nosql: ['db'], gateway: ['lb'], lb: ['gateway'] };

  function check(api) {
    const types = api.types(); const labels = api.labels(); const data = api.getData();
    const has = t => types.includes(t) || labels.some(l => (KEYWORDS[t] || []).some(k => (' ' + l).includes(k)));
    const rows = ch.expect.map(t => {
      const ok = has(t) || (EQUIV[t] || []).some(has);
      return { t, ok, label: SK_COMPONENTS[t]?.label || t };
    });
    const pct = Math.round(rows.filter(r => r.ok).length / rows.length * 100);
    const connected = data.edges.length >= Math.max(1, data.nodes.length - 2);
    if (pct >= 80 && !done[ch.id]) { Player.addGold(60); toast('+60 🪙 Design complete!'); }
    done[ch.id] = Math.max(done[ch.id] || 0, pct); Store.set('practice_done', done);
    api.setBrief(briefHtml(`
      <div class="explain"><b>Design check: ${pct}%</b>
        ${rows.map(r => `<div class="keypoint ${r.ok ? 'hit' : 'miss'}">${esc(r.label)}</div>`).join('')}
        ${connected ? '' : '<p>⚠️ Connect your components with arrows to show how requests flow.</p>'}
        <p class="muted" style="font-size:12px">The check looks for component types or labels (e.g. "Redis", "Kafka"). Then compare with the reference.</p>
      </div>`));
  }
  function briefHtml(extra = '') {
    return `<div class="brief">
      <a href="#/practice" style="font-size:13px">← All challenges</a>
      <h3>🎯 ${esc(ch.title)}</h3>
      <p>${esc(ch.brief)}</p>
      <b>Requirements</b><ul>${ch.reqs.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      <details><summary style="cursor:pointer;font-weight:800">💡 Hints</summary><ul>${ch.hints.map(h => `<li>${esc(h)}</li>`).join('')}</ul></details>
      ${extra}
    </div>`;
  }
  main.innerHTML = `<div id="ed"></div>`;
  const api = DiagramEditor(main.querySelector('#ed'), {
    storageKey: 'board_' + ch.id, fileName: ch.id, brief: briefHtml(),
    extraButtons: [
      { label: '✅ Check design', onClick: check },
      { label: '👀 Reference', onClick: a => { if (!confirm('Replace your board with the reference architecture? Your work is saved in undo (Ctrl+Z), or export it first.')) return; a.load(a.fromSpec(ch.ref)); } }
    ]
  });
};
