/*
 * Builds window.QUIZ — the full question bank:
 *  1) hand-written questions (QUIZ_RAW)
 *  2) glossary questions in both directions (term → meaning, meaning → term)
 *  3) numeric / estimation question families with many fixed variants
 * Every question has a stable id so progress ("seen" questions) survives reloads.
 * Question shape: { id, d: 'e'|'m'|'h', t: topic, q, a: correctText, opts: [4 texts], e: explanation }
 */
(function () {
  const Q = [];
  const rng = (seed) => { let s = seed >>> 0 || 7; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
  const pickN = (arr, n, r, exclude) => {
    const pool = arr.filter(x => !exclude.includes(x)); const out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return out;
  };
  const add = (id, d, t, q, correct, wrongs, e) => {
    const opts = [correct];
    for (const w of wrongs) if (!opts.includes(w) && opts.length < 4) opts.push(w);
    if (opts.length < 2) return;
    Q.push({ id, d, t, q, a: correct, opts, e: e || '' });
  };

  // 1) hand-written
  (window.QUIZ_RAW || []).forEach((r, i) => add('h' + i, r[0], r[1], r[2], r[3][0], r[3].slice(1), r[4]));

  // 2) glossary
  const G = window.GLOSSARY || [];
  G.forEach((g, i) => {
    const [term, def, topic] = g;
    const r = rng(i * 97 + 13);
    const same = G.filter(x => x[2] === topic && x[0] !== term);
    const other = G.filter(x => x[2] !== topic);
    const wrong = pickN(same, 3, r, []);
    while (wrong.length < 3) wrong.push(...pickN(other, 3 - wrong.length, r, wrong));
    add('gf' + i, 'e', topic, `What is "${term}"?`, def, wrong.map(w => w[1]), `${term}: ${def}.`);
    add('gr' + i, 'm', topic, `Which term matches this description: "${def}"?`, term, wrong.map(w => w[0]), `${term}: ${def}.`);
  });

  // ---------- number helpers ----------
  const fmtNum = n => {
    const a = Math.abs(n);
    const f = (v, s) => (v >= 100 ? Math.round(v) : v >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100) + s;
    if (a >= 1e12) return f(n / 1e12, 'T'); if (a >= 1e9) return f(n / 1e9, 'B');
    if (a >= 1e6) return f(n / 1e6, 'M'); if (a >= 1e3) return f(n / 1e3, 'K');
    return f(n, '');
  };
  const fmtBytes = n => {
    const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB']; let i = 0;
    while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
    return (n >= 100 ? Math.round(n) : n >= 10 ? Math.round(n * 10) / 10 : Math.round(n * 100) / 100) + ' ' + u[i];
  };
  const numOpts = (v, fmt, mults, r) => {
    const c = fmt(v); const out = [];
    for (const m of mults) { const s = fmt(v * m); if (s !== c && !out.includes(s)) out.push(s); }
    return pickN(out, 3, r, []);
  };
  const sq = (n) => n.toLocaleString('en-US');

  // 3a) QPS from DAU
  let k = 0;
  [1e6, 2e6, 5e6, 10e6, 20e6, 50e6, 100e6, 200e6, 500e6].forEach(dau => [2, 10, 20, 50, 100].forEach(per => {
    const v = dau * per / 1e5; const r = rng(++k * 31);
    add('qps' + k, dau * per > 2e9 ? 'h' : 'm', 'foundations',
      `An app has ${fmtNum(dau)} daily active users. Each makes ${per} requests per day. Roughly what is the average QPS? (Use ~100,000 seconds per day.)`,
      '~' + fmtNum(v) + ' QPS', numOpts(v, x => '~' + fmtNum(x) + ' QPS', [10, 0.1, 100, 0.01, 3], r),
      `${fmtNum(dau)} × ${per} = ${fmtNum(dau * per)} requests/day ÷ 100K s ≈ ${fmtNum(v)} QPS. Plan for 2–3× at peak.`);
  }));

  // 3b) storage per year
  k = 0;
  [1e6, 10e6, 50e6, 100e6, 500e6].forEach(n => [1e3, 10e3, 100e3, 500e3, 2e6].forEach(size => {
    const v = n * size * 365; const r = rng(++k * 53);
    add('sto' + k, 'h', 'foundations',
      `Users create ${fmtNum(n)} new items per day, each about ${fmtBytes(size)}. Roughly how much storage is needed per year (before replication)?`,
      '~' + fmtBytes(v), numOpts(v, x => '~' + fmtBytes(x), [1 / 365, 10, 0.1, 1000, 0.001], r),
      `${fmtNum(n)} × ${fmtBytes(size)} = ${fmtBytes(n * size)}/day × 365 ≈ ${fmtBytes(v)}/year. Multiply by ~3 for replicas.`);
  }));

  // 3c) bandwidth
  k = 0;
  [1e3, 5e3, 10e3, 50e3].forEach(qps => [10e3, 100e3, 500e3, 1e6].forEach(size => {
    const v = qps * size; const r = rng(++k * 71);
    add('bw' + k, 'm', 'foundations',
      `A service handles ${sq(qps)} downloads per second, each ${fmtBytes(size)}. Roughly what outbound bandwidth is needed?`,
      '~' + fmtBytes(v) + '/s', numOpts(v, x => '~' + fmtBytes(x) + '/s', [10, 0.1, 1000, 0.001, 8], r),
      `${sq(qps)} × ${fmtBytes(size)} ≈ ${fmtBytes(v)}/s. High numbers like this point to a CDN.`);
  }));

  // 3d) servers needed
  k = 0;
  [10e3, 30e3, 50e3, 100e3, 200e3, 500e3].forEach(qps => [500, 1000, 2000, 5000].forEach(cap => {
    const v = Math.ceil(qps / cap); const r = rng(++k * 89);
    const f = x => Math.max(1, Math.round(x)) + ' servers';
    add('srv' + k, qps / cap > 100 ? 'm' : 'e', 'scaling',
      `Peak traffic is ${sq(qps)} requests/s. One app server handles ${sq(cap)} requests/s. Minimum number of servers (no headroom)?`,
      f(v), numOpts(v, f, [2, 0.5, 10, 0.1, 4], r),
      `${sq(qps)} ÷ ${sq(cap)} = ${v}. In practice add headroom (e.g., +30%) and N+1 for failures.`);
  }));

  // 3e) cache hit ratio → DB load
  k = 0;
  [10e3, 50e3, 100e3].forEach(reads => [50, 80, 90, 95, 99].forEach(hit => {
    const v = reads * (100 - hit) / 100; const r = rng(++k * 101);
    const f = x => sq(Math.round(x)) + ' reads/s';
    add('hit' + k, 'm', 'scaling',
      `An app serves ${sq(reads)} reads/s with a ${hit}% cache hit ratio. How many reads/s reach the database?`,
      f(v), numOpts(v, f, [hit / (100 - hit), 2, 0.5, 10], r).filter(x => x !== f(v)),
      `Only misses reach the DB: ${sq(reads)} × ${100 - hit}% = ${sq(v)}/s.`);
  }));

  // 3f) nines
  const nines = [99, 99.5, 99.9, 99.95, 99.99, 99.999];
  const down = (p, mins) => { const m = mins * (100 - p) / 100; return m >= 1440 ? (m / 1440).toFixed(2) + ' days' : m >= 60 ? (m / 60).toFixed(1) + ' hours' : m >= 1 ? m.toFixed(1) + ' minutes' : (m * 60).toFixed(0) + ' seconds'; };
  nines.forEach((p, i) => [['year', 525600], ['month', 43800]].forEach(([per, mins], j) => {
    const r = rng(i * 7 + j + 3);
    add(`nine${i}_${j}`, 'm', 'reliability', `${p}% availability allows roughly how much downtime per ${per}?`,
      down(p, mins), pickN(nines.filter(x => x !== p).map(x => down(x, mins)), 3, r, []),
      `Downtime = (100 − ${p})% of a ${per} ≈ ${down(p, mins)}.`);
  }));

  // 3g) quorum
  [3, 5].forEach(N => { for (let W = 1; W <= N; W++) for (let R = 1; R <= N; R++) {
    const strong = W + R > N;
    const yes = 'Every read overlaps the latest write (strong reads)';
    const no = 'Reads may return stale data';
    add(`quo${N}_${W}_${R}`, 'h', 'distributed', `A store keeps N=${N} replicas. Writes wait for W=${W} acks, reads ask R=${R} replicas. Which is true?`,
      strong ? yes : no, [strong ? no : yes, 'Writes can never succeed', 'Only the leader can serve reads'],
      `W + R = ${W + R} ${strong ? '>' : '≤'} N = ${N}. ${strong ? 'Read and write sets must overlap.' : 'A read can miss every replica that has the newest write.'}`);
  } });

  // 3h) majority tolerance
  for (let N = 3; N <= 9; N++) {
    const v = Math.floor((N - 1) / 2); const r = rng(N * 13);
    add('maj' + N, 'm', 'distributed', `A Raft cluster has ${N} nodes. How many node failures can it survive and still commit writes?`,
      String(v), pickN(['0', '1', '2', '3', '4', '5', '6'].filter(x => x !== String(v)), 3, r, []),
      `A majority (${Math.floor(N / 2) + 1} of ${N}) must stay up, so it tolerates ${v} failures.`);
  }

  // 3i) availability in series / parallel
  const pct = x => x >= 0.999999 ? '99.9999+%' : (x * 100).toFixed(x > 0.9999 ? 4 : x > 0.999 ? 3 : 2).replace(/0+$/, '').replace(/\.$/, '') + '%';
  [2, 3, 4, 5].forEach(n => [0.99, 0.999, 0.9999].forEach(a => {
    const v = Math.pow(a, n); const r = rng(n * 17 + a * 1000);
    add(`ser${n}_${a}`, 'h', 'reliability', `A request must pass through ${n} components in series, each ${pct(a)} available. Overall availability?`,
      '≈ ' + pct(v), pickN(['≈ ' + pct(a), '≈ ' + pct(1 - Math.pow(1 - a, n)), '≈ ' + pct(Math.pow(a, n + 2)), '≈ ' + pct(a - 0.05)], 3, r, ['≈ ' + pct(v)]),
      `Multiply: ${pct(a)}^${n} ≈ ${pct(v)}. Chains lower availability.`);
  }));
  [2, 3].forEach(n => [0.9, 0.99, 0.999].forEach(a => {
    const v = 1 - Math.pow(1 - a, n); const r = rng(n * 23 + a * 100);
    add(`par${n}_${a}`, 'h', 'reliability', `${n} independent redundant replicas each have ${pct(a)} availability. Combined availability (any one is enough)?`,
      '≈ ' + pct(v), pickN(['≈ ' + pct(a), '≈ ' + pct(Math.pow(a, n)), '≈ ' + pct(1 - Math.pow(1 - a, n + 1)), '≈ ' + pct((1 + a) / 2)], 3, r, ['≈ ' + pct(v)]),
      `1 − (1 − ${pct(a)})^${n} ≈ ${pct(v)}. Redundancy raises availability.`);
  }));

  // 3j) Base62 length
  [1e6, 100e6, 1e9, 100e9, 1e12, 3e12].forEach((n, i) => {
    const v = Math.ceil(Math.log(n) / Math.log(62)); const r = rng(i * 41 + 5);
    add('b62_' + i, 'h', 'distributed', `Minimum Base62 code length to support ${fmtNum(n)} unique short URLs?`,
      v + ' characters', pickN([v - 1, v + 1, v + 2, v + 3].filter(x => x > 0).map(x => x + ' characters'), 3, r, []),
      `62^${v} ≈ ${fmtNum(Math.pow(62, v))} ≥ ${fmtNum(n)}, while 62^${v - 1} ≈ ${fmtNum(Math.pow(62, v - 1))} is not enough.`);
  });

  // 3k) HTTP status codes
  const codes = [[200, 'OK — success'], [201, 'Created — a new resource was made'], [204, 'No Content — success with an empty body'],
    [301, 'Moved Permanently'], [302, 'Found — temporary redirect'], [304, 'Not Modified — use your cached copy'],
    [400, 'Bad Request — malformed input'], [401, 'Unauthorized — not authenticated'], [403, 'Forbidden — authenticated but not allowed'],
    [404, 'Not Found'], [409, 'Conflict — clashes with current state'], [429, 'Too Many Requests — rate limited'],
    [500, 'Internal Server Error'], [502, 'Bad Gateway — invalid response from upstream'], [503, 'Service Unavailable — overloaded or down'],
    [504, 'Gateway Timeout — upstream took too long']];
  codes.forEach(([c, m], i) => {
    const r = rng(i * 19 + 2);
    const others = codes.filter(x => x[0] !== c);
    const near = others.filter(x => Math.floor(x[0] / 100) === Math.floor(c / 100));
    const w = pickN(near.length >= 3 ? near : others, 3, r, []);
    add('http' + c, 'e', 'foundations', `What does HTTP status ${c} mean?`, m, w.map(x => x[1]), `${c} = ${m}.`);
    add('httpr' + c, 'm', 'foundations', `Which HTTP status code means "${m}"?`, String(c), w.map(x => String(x[0])), `${c} = ${m}.`);
  });

  // 3l) default ports
  const ports = [[80, 'HTTP'], [443, 'HTTPS'], [22, 'SSH'], [53, 'DNS'], [5432, 'PostgreSQL'], [3306, 'MySQL'], [6379, 'Redis'], [27017, 'MongoDB'], [9092, 'Kafka'], [25, 'SMTP (email)']];
  ports.forEach(([p, s], i) => {
    const r = rng(i * 29 + 1);
    add('port' + p, 'e', 'foundations', `Which service uses default port ${p}?`, s, pickN(ports.filter(x => x[0] !== p).map(x => x[1]), 3, r, []), `${s} listens on ${p} by default.`);
  });

  // 3m) latency ordering
  const lat = [['Reading from CPU L1 cache', 1], ['Reading from main memory (RAM)', 100], ['A random read from an SSD', 100e3],
    ['A network round trip inside one data center', 500e3], ['Reading 1 MB sequentially from SSD', 1e6], ['A disk seek on a spinning HDD', 10e6],
    ['A network round trip from California to Europe', 150e6]];
  let lk = 0;
  for (let a = 0; a < lat.length; a++) for (let b = a + 1; b < lat.length; b++) for (let c = b + 1; c < lat.length; c++) {
    if ((a + b + c) % 2) continue; // keep a balanced subset
    const set = [lat[a], lat[b], lat[c]]; const r = rng(++lk * 7);
    const extra = pickN(lat.filter(x => !set.includes(x) && x[1] > lat[a][1]), 1, r, []);
    const all = set.concat(extra); const fastest = all.slice().sort((x, y) => x[1] - y[1])[0];
    add('lat' + lk, lk % 3 ? 'e' : 'm', 'foundations', 'Which of these is the fastest?', fastest[0], all.filter(x => x !== fastest).map(x => x[0]),
      'Rough order: CPU cache (~1 ns) < RAM (~100 ns) < SSD read (~100 µs) < DC round trip (~0.5 ms) < 1 MB SSD (~1 ms) < HDD seek (~10 ms) < cross-continent (~150 ms).');
  }

  window.QUIZ = Q;
  window.QUIZ_TOPICS = {
    foundations: 'Foundations', scaling: 'Scaling', data: 'Data & Databases', distributed: 'Distributed Systems',
    async: 'Messaging & Real-Time', patterns: 'Patterns', reliability: 'Reliability & Ops', interview: 'Interview', cases: 'Case Studies'
  };
})();
