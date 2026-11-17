PAGES.quiz = function (main, params, query) {
  const { Store, esc, shuffle, Player, toast } = SK;
  const ZONES = [
    { upto: 2, name: 'Grassy Meadows', icon: '🌱', mix: { e: 10 } },
    { upto: 4, name: 'Goblin Forest', icon: '🌲', mix: { e: 7, m: 3 } },
    { upto: 6, name: 'Stone Bridge', icon: '🌉', mix: { e: 4, m: 6 } },
    { upto: 9, name: 'Dragon Pass', icon: '🐉', mix: { m: 8, h: 2 } },
    { upto: 12, name: 'Fire Peaks', icon: '🌋', mix: { m: 5, h: 5 } },
    { upto: 1e9, name: 'Shadow Citadel', icon: '🏯', mix: { m: 3, h: 7 } }
  ];
  const zoneOf = s => ZONES.find(z => s <= z.upto);
  const REWARD = { e: [3, 1], m: [5, 2], h: [8, 3] };
  const DLABEL = { e: 'Easy', m: 'Medium', h: 'Hard' };

  function pick(pool, n) {
    const seen = new Set(Store.get('seen', []));
    let fresh = pool.filter(q => !seen.has(q.id));
    if (fresh.length < n) { pool.forEach(q => seen.delete(q.id)); Store.set('seen', [...seen]); fresh = pool.slice(); }
    return shuffle(fresh).slice(0, n);
  }
  function markSeen(ids) { const s = new Set(Store.get('seen', [])); ids.forEach(i => s.add(i)); Store.set('seen', [...s]); }

  // ---------- menu ----------
  function menu() {
    const j = Store.get('journey', { stage: 1, stars: {} });
    const zone = zoneOf(j.stage);
    const counts = { e: 0, m: 0, h: 0 }; QUIZ.forEach(q => counts[q.d]++);
    const topicOpts = Object.entries(QUIZ_TOPICS).map(([k, v]) => `<option value="${k}" ${query.topic === k ? 'selected' : ''}>${v} (${QUIZ.filter(q => q.t === k).length})</option>`).join('');
    const nodes = []; const start = Math.max(1, j.stage - 6);
    for (let s = start; s < start + 12; s++) nodes.push(`<div class="journey-node ${s < j.stage ? 'done' : s === j.stage ? 'current' : ''}" title="Stage ${s}">${s < j.stage ? '★'.repeat(j.stars[s] || 1).slice(0, 3) || '✓' : s}</div>`);
    main.innerHTML = `
      <h1 class="page-title stroke">⚔️ Quiz Arena</h1>
      <p class="page-sub">${QUIZ.length.toLocaleString('en-US')} questions, shuffled every time. Questions you've already seen are saved for later, so each visit feels new.</p>
      <div class="mode-cards">
        <div class="panel card" style="grid-column: span 2; background:linear-gradient(180deg,#fff3c4,#ffd76a)">
          <span class="chip hard">JOURNEY</span>
          <h3>${zone.icon} Stage ${j.stage} · ${zone.name}</h3>
          <p>March through the lands. Clear a stage with 7/10 to move on. The road gets tougher the further you go…</p>
          <div class="journey-map">${nodes.join('')}</div>
          <button class="btn gold" data-start="journey">▶ Enter Stage ${j.stage}</button>
        </div>
        <div class="panel card">
          <span class="chip">BATTLE</span><h3>🗡️ Pick your difficulty</h3>
          <label class="field">Difficulty<select id="qDiff"><option value="e">🌱 Easy (${counts.e})</option><option value="m" selected>⚔️ Medium (${counts.m})</option><option value="h">🐉 Hard (${counts.h})</option><option value="x">🎲 Mixed (all)</option></select></label>
          <label class="field">Topic<select id="qTopic"><option value="">All topics</option>${topicOpts}</select></label>
          <label class="field">Questions<select id="qCount"><option>10</option><option>20</option><option>30</option></select></label>
          <button class="btn" data-start="battle">⚔️ Battle!</button>
        </div>
      </div>
      <div class="spacer"></div>
      <div class="panel">
        <h3 style="margin-top:0">Your record</h3>
        ${(() => { const s = Store.get('quiz_stats', { answered: 0, correct: 0, by: {} }); return `<p>Answered <b>${s.answered}</b> · Correct <b>${s.correct}</b> · Seen <b>${Store.get('seen', []).length}</b> of ${QUIZ.length} questions.</p>`; })()}
        <button class="btn grey small" id="resetSeen">Reset seen questions</button>
      </div>`;
    main.querySelector('[data-start=journey]').onclick = () => {
      const mix = zone.mix; let qs = [];
      Object.entries(mix).forEach(([d, n]) => qs = qs.concat(pick(QUIZ.filter(q => q.d === d), n)));
      run({ mode: 'journey', stage: j.stage, qs: shuffle(qs), hideDiff: true, restart: () => { menu(); main.querySelector('[data-start=journey]').click(); } });
    };
    main.querySelector('[data-start=battle]').onclick = () => {
      battle(main.querySelector('#qDiff').value, main.querySelector('#qTopic').value, +main.querySelector('#qCount').value);
    };
    function battle(d, t, n) {
      let pool = QUIZ.filter(q => (d === 'x' || q.d === d) && (!t || q.t === t));
      if (pool.length < 4) pool = QUIZ.filter(q => !t || q.t === t);
      run({ mode: 'battle', qs: pick(pool, n), label: `${d === 'x' ? 'Mixed' : DLABEL[d]}${t ? ' · ' + QUIZ_TOPICS[t] : ''}`, restart: () => battle(d, t, n) });
    }
    main.querySelector('#resetSeen').onclick = () => { Store.set('seen', []); toast('Seen questions reset'); menu(); };
  }

  // ---------- run a session ----------
  function run(session) {
    let i = 0, score = 0; const wrong = []; let gold = 0, troph = 0;
    markSeen(session.qs.map(q => q.id));
    function show() {
      const q = session.qs[i];
      const opts = shuffle(q.opts);
      const title = session.mode === 'journey' ? `${zoneOf(session.stage).icon} Stage ${session.stage}` : `⚔️ ${session.label}`;
      main.innerHTML = `
        <div class="quiz-wrap">
          <div class="q-head"><span class="banner">${title}</span><b class="stroke" style="font-family:var(--font-head);font-size:22px">${i + 1} / ${session.qs.length} · ✅ ${score}</b></div>
          <div class="progress gold" style="margin-bottom:16px"><div style="width:${i / session.qs.length * 100}%"></div></div>
          <div class="panel q-card">
            <div class="row-flex">${session.hideDiff ? '' : `<span class="chip ${({ e: 'easy', m: 'medium', h: 'hard' })[q.d]}">${DLABEL[q.d]}</span>`}<span class="chip">${QUIZ_TOPICS[q.t] || q.t}</span></div>
            <div class="q-text">${esc(q.q)}</div>
            <div class="options">${opts.map((o, k) => `<button class="opt" data-o="${esc(o)}"><b>${k + 1}.</b> ${esc(o)}</button>`).join('')}</div>
            <div id="after"></div>
          </div>
          <div class="spacer"></div><a href="#/quiz" class="btn grey small" id="quit">✖ Leave battle</a>
        </div>`;
      const buttons = [...main.querySelectorAll('.opt')];
      let answered = false;
      const answer = (btn) => {
        if (answered) return; answered = true;
        const ok = btn.dataset.o === q.a;
        buttons.forEach(b => { b.disabled = true; if (b.dataset.o === q.a) b.classList.add('correct'); });
        if (!ok) btn.classList.add('wrong');
        const stats = Store.get('quiz_stats', { answered: 0, correct: 0 });
        stats.answered++; if (ok) stats.correct++; Store.set('quiz_stats', stats);
        if (ok) { score++; gold += REWARD[q.d][0]; troph += REWARD[q.d][1]; } else { troph -= 1; wrong.push(q); }
        main.querySelector('#after').innerHTML = `
          <div class="explain"><b>${ok ? '✅ Correct!' : '❌ Not quite.'}</b> ${esc(q.e)}</div>
          <div class="spacer"></div><button class="btn ${ok ? '' : 'blue'}" id="next">${i + 1 < session.qs.length ? 'Next →' : 'See results'}</button>`;
        main.querySelector('#next').onclick = () => { i++; i < session.qs.length ? show() : results(); };
        main.querySelector('#next').focus();
      };
      buttons.forEach(b => b.onclick = () => answer(b));
      document.onkeydown = e => {
        if (!main.querySelector('.q-card')) { document.onkeydown = null; return; }
        const n = parseInt(e.key, 10); if (n >= 1 && n <= buttons.length) answer(buttons[n - 1]);
      };
    }
    function results() {
      document.onkeydown = null;
      const n = session.qs.length; const pct = score / n;
      let starsN = pct >= 1 ? 3 : pct >= 0.9 ? 2 : pct >= 0.7 ? 1 : 0;
      Player.addGold(gold); Player.addTrophies(troph);
      let headline = '';
      if (session.mode === 'journey') {
        const j = Store.get('journey', { stage: 1, stars: {} });
        if (starsN > 0) {
          j.stars[session.stage] = Math.max(j.stars[session.stage] || 0, starsN);
          if (session.stage === j.stage) j.stage++;
          headline = `Stage ${session.stage} cleared! Onward to stage ${session.stage + 1}.`;
        } else headline = 'The enemy held the line. Score 7/10 to pass — try again with fresh questions!';
        Store.set('journey', j);
      } else headline = starsN ? 'Victory!' : 'Keep training, warrior!';
      main.innerHTML = `
        <div class="quiz-wrap">
          <div class="panel center q-card">
            <div class="stars">${[1, 2, 3].map(s => `<span class="${s <= starsN ? '' : 'off'}">⭐</span>`).join('')}</div>
            <h2 style="margin:6px 0">${headline}</h2>
            <p style="font-size:20px;font-weight:800">${score} / ${n} correct</p>
            <p>+${gold} 🪙 gold · ${troph >= 0 ? '+' : ''}${troph} 🏆 trophies</p>
            <div class="row-flex" style="justify-content:center">
              ${session.mode === 'journey' ? `<button class="btn gold" id="again">${starsN ? '▶ Next stage' : '↻ Retry stage'}</button>` : `<button class="btn gold" id="again">↻ New battle</button>`}
              <a class="btn grey" href="#/quiz">Back to Arena</a>
            </div>
          </div>
          ${wrong.length ? `<div class="spacer"></div><div class="panel"><h3 style="margin-top:0">📖 Review your mistakes</h3>${wrong.map(q => `<div style="padding:10px 0;border-bottom:1px dashed var(--stone-3)"><b>${esc(q.q)}</b><br>✅ ${esc(q.a)}<br><span class="muted">${esc(q.e)}</span></div>`).join('')}</div>` : ''}
        </div>`;
      main.querySelector('#again').onclick = session.restart;
    }
    show();
  }

  menu();
  if (query.topic) setTimeout(() => main.querySelector('#qDiff').value = 'x', 0);
};
