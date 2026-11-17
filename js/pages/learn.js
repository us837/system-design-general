PAGES.learn = function (main, params) {
  const { Store, md, esc, Player, toast, wordCount } = SK;
  const read = new Set(Store.get('read', []));
  const id = params[0];
  const idx = BLOGS.findIndex(b => b.id === id);
  const lesson = idx >= 0 ? BLOGS[idx] : null;

  const sidebar = `
    <aside class="chapters panel">
      <div class="row-flex" style="justify-content:space-between;margin-bottom:8px">
        <b>${read.size}/${BLOGS.length} read</b>
      </div>
      <div class="progress" style="margin-bottom:10px"><div style="width:${read.size / BLOGS.length * 100}%"></div></div>
      ${CHAPTERS.map(ch => {
        const items = BLOGS.map((b, i) => ({ b, i })).filter(x => x.b.chapter === ch.id);
        return `<div class="chapter-title">${ch.icon} ${esc(ch.title)}</div>` + items.map(({ b, i }) =>
          `<a class="lesson-link ${read.has(b.id) ? 'done' : ''} ${lesson && lesson.id === b.id ? 'active' : ''}" href="#/learn/${b.id}"><span class="num">${read.has(b.id) ? '✓' : i + 1}</span>${esc(b.title)}</a>`).join('');
      }).join('')}
    </aside>`;

  if (!lesson) {
    const next = BLOGS.find(b => !read.has(b.id)) || BLOGS[0];
    main.innerHTML = `
      <h1 class="page-title stroke">📜 The Library</h1>
      <p class="page-sub">A book in small, simple pieces. Read in order — each lesson takes 2–3 minutes.</p>
      <div class="learn-layout">${sidebar}
        <div>
          <div class="panel" style="margin-bottom:18px">
            <h2 style="margin-top:0">How to use the Library</h2>
            <ol><li>Read a lesson (short, plain words).</li><li>Press <b>Mark as read</b> to earn 🪙 gold.</li>
            <li>After a chapter, test yourself in the <a href="#/quiz">Quiz Arena</a>.</li><li>Try the idea for real in <a href="#/play">Build &amp; Defend</a>.</li></ol>
            <a class="btn gold" href="#/learn/${next.id}">${read.size ? 'Continue: ' : 'Start: '}${esc(next.title)} →</a>
          </div>
          <div class="grid">
            ${CHAPTERS.map(ch => {
              const items = BLOGS.filter(b => b.chapter === ch.id); const done = items.filter(b => read.has(b.id)).length;
              return `<a class="panel card" style="text-decoration:none;color:inherit" href="#/learn/${items[0].id}">
                <div style="font-size:36px">${ch.icon}</div><h3>${esc(ch.title)}</h3>
                <p>${items.length} lessons · ${done} read</p><div class="progress"><div style="width:${done / items.length * 100}%"></div></div></a>`;
            }).join('')}
          </div>
        </div>
      </div>`;
    return;
  }

  const ch = CHAPTERS.find(c => c.id === lesson.chapter);
  const prev = BLOGS[idx - 1], next = BLOGS[idx + 1];
  const words = wordCount(lesson.body);
  const isLastOfChapter = !next || next.chapter !== lesson.chapter;
  main.innerHTML = `
    <div class="learn-layout">${sidebar}
      <article class="panel article">
        <div class="meta">${ch.icon} ${esc(ch.title)} · Lesson ${idx + 1} of ${BLOGS.length} · ${Math.max(1, Math.round(words / 200))} min read</div>
        <h1>${esc(lesson.title)}</h1>
        ${md(lesson.body)}
        <div class="tldr">
          <b>Done reading?</b> Mark it to earn 🪙 20 gold.
          ${isLastOfChapter ? `<br>🏁 End of chapter! <a href="#/quiz?topic=${lesson.chapter === 'interview' ? 'interview' : lesson.chapter}">Battle the ${esc(ch.title.split('·')[1] || ch.title)} quiz →</a>` : ''}
        </div>
        <div class="article-nav">
          ${prev ? `<a class="btn grey small" href="#/learn/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}
          <button class="btn gold" id="markRead">${read.has(lesson.id) ? '✓ Read — next' : 'Mark as read' + (next ? ' & next' : '')} →</button>
        </div>
      </article>
    </div>`;
  window.scrollTo(0, 0);
  main.querySelector('#markRead').onclick = () => {
    if (!read.has(lesson.id)) {
      read.add(lesson.id); Store.set('read', [...read]); Player.addGold(20); toast('+20 🪙 Lesson complete!');
    }
    location.hash = next ? '#/learn/' + next.id : '#/learn';
  };
  const active = main.querySelector('.lesson-link.active');
  const list = main.querySelector('.chapters');
  if (active && list) list.scrollTop = active.offsetTop - list.clientHeight / 2;
};
