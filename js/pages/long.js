PAGES.long = function (main, params) {
  const { Store, esc, Player, toast, wordCount } = SK;
  const drafts = Store.get('long_drafts', {});
  const best = Store.get('long_best', {});
  const q = LONG_QUESTIONS.find(x => x.id === params[0]) || null;
  const DL = { e: ['easy', 'Easy'], m: ['medium', 'Medium'], h: ['hard', 'Hard'] };

  const list = `<aside class="panel chapters">
    <b>Questions</b>
    ${['e', 'm', 'h'].map(d => `<div class="chapter-title">${DL[d][1]}</div>` + LONG_QUESTIONS.filter(x => x.d === d).map(x =>
      `<a class="lesson-link ${q && q.id === x.id ? 'active' : ''} ${best[x.id] >= 70 ? 'done' : ''}" href="#/long/${x.id}"><span class="num">${best[x.id] != null ? best[x.id] : '?'}</span>${esc(x.title)}</a>`).join('')).join('')}
  </aside>`;

  if (!q) {
    main.innerHTML = `
      <h1 class="page-title stroke">✍️ Scroll Tower</h1>
      <p class="page-sub">Explaining an idea in your own words is the best proof you understand it. Write a paragraph, then see which key points you covered.</p>
      <div class="long-layout">${list}
        <div class="panel">
          <h2 style="margin-top:0">How it works</h2>
          <ol><li>Pick a question.</li><li>Write your answer like you would speak in an interview (aim for 80–250 words).</li>
          <li>Press <b>Check my answer</b>. We look for the key ideas an interviewer expects.</li>
          <li>Compare with the model answer, then improve and check again.</li></ol>
          <p class="muted">Checking is keyword-based: it tells you which ideas you mentioned, not whether your prose is perfect. Use the model answer to judge the rest.</p>
          <a class="btn gold" href="#/long/${LONG_QUESTIONS[0].id}">Start with "${esc(LONG_QUESTIONS[0].title)}" →</a>
        </div>
      </div>`;
    return;
  }

  main.innerHTML = `
    <div class="long-layout">${list}
      <div>
        <div class="panel">
          <div class="row-flex"><span class="chip ${DL[q.d][0]}">${DL[q.d][1]}</span><span class="chip">${QUIZ_TOPICS[q.topic] || q.topic}</span>${best[q.id] != null ? `<span class="chip">Best: ${best[q.id]}%</span>` : ''}</div>
          <h2 style="margin:10px 0 6px">${esc(q.title)}</h2>
          <p style="font-size:18px;font-weight:700">${esc(q.prompt)}</p>
          <textarea id="ans" placeholder="Write your answer here…">${esc(drafts[q.id] || '')}</textarea>
          <div class="row-flex" style="justify-content:space-between;margin-top:10px">
            <span class="muted" id="wc"></span>
            <div class="row-flex"><button class="btn grey small" id="hint">💡 Hint</button><button class="btn gold" id="check">✅ Check my answer</button></div>
          </div>
          <div id="hintBox"></div>
        </div>
        <div class="spacer"></div>
        <div id="result"></div>
      </div>
    </div>`;
  const ta = main.querySelector('#ans'), wc = main.querySelector('#wc');
  const upd = () => { wc.textContent = wordCount(ta.value) + ' words'; drafts[q.id] = ta.value; Store.set('long_drafts', drafts); };
  ta.addEventListener('input', upd); upd();
  main.querySelector('#hint').onclick = () => {
    main.querySelector('#hintBox').innerHTML = `<div class="explain"><b>Think about:</b> ${q.points.map(p => esc(p.p.split('(')[0].trim())).slice(0, 3).join(' · ')} …</div>`;
  };
  main.querySelector('#check').onclick = () => {
    const text = ta.value.toLowerCase();
    if (wordCount(text) < 15) { toast('Write a bit more first (15+ words)'); return; }
    const hits = q.points.map(p => p.k.some(k => text.includes(k.toLowerCase())));
    const pct = Math.round(hits.filter(Boolean).length / q.points.length * 100);
    const first = best[q.id] == null || best[q.id] < 70;
    best[q.id] = Math.max(best[q.id] || 0, pct); Store.set('long_best', best);
    if (pct >= 70 && first) { Player.addGold(40); toast('+40 🪙 Great answer!'); }
    const verdict = pct >= 85 ? '🏆 Excellent — interview ready.' : pct >= 70 ? '⭐ Strong answer. Polish the missing points.' : pct >= 40 ? '🛠️ Good start. Add the missing ideas.' : '📜 Read the model answer and try again.';
    main.querySelector('#result').innerHTML = `
      <div class="panel">
        <div class="row-flex" style="justify-content:space-between"><h3 style="margin:0">Score: ${pct}%</h3><b>${verdict}</b></div>
        <div class="progress ${pct >= 70 ? '' : 'gold'}" style="margin:10px 0"><div style="width:${pct}%"></div></div>
        <h4>Key points</h4>
        ${q.points.map((p, i) => `<div class="keypoint ${hits[i] ? 'hit' : 'miss'}">${esc(p.p)}</div>`).join('')}
        <div class="spacer"></div>
        <details><summary style="cursor:pointer;font-weight:800">📖 Show model answer</summary><p style="line-height:1.7">${esc(q.model)}</p></details>
      </div>`;
    main.querySelector('#result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
};
