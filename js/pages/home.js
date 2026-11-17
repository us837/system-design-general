window.PAGES = window.PAGES || {};

PAGES.home = function (main) {
  const { Player, Store } = SK;
  const read = Store.get('read', []);
  const journey = Store.get('journey', { stage: 1, stars: {} });
  const stars = Store.get('play_stars', {});
  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0);
  const answered = Store.get('quiz_stats', { answered: 0, correct: 0 });
  const lvl = Player.level();
  const next = SK.Store.get('read', []);
  const nextLesson = BLOGS.find(b => !next.includes(b.id)) || BLOGS[0];

  const b = (href, ico, name, desc, extra = '', cls = '') =>
    `<a class="building panel ${cls}" href="${href}">${extra}<span class="ico">${ico}</span><div class="name">${name}</div><div class="desc">${desc}</div></a>`;

  main.innerHTML = `
    <section class="hero">
      <div>
        <h1 class="stroke">Build Your Scale Kingdom</h1>
        <p>Learn system design like building a village: read short lessons, battle quizzes, write answers, draw architectures, and defend your servers against traffic raids.</p>
        <div class="row-flex">
          <a class="btn gold" href="#/learn/${nextLesson.id}">📜 ${read.length ? 'Continue reading' : 'Start lesson 1'}</a>
          <a class="btn" href="#/play">🛡️ Build &amp; Defend</a>
          <a class="btn blue" href="#/quiz">⚔️ Quiz Arena</a>
        </div>
      </div>
    </section>

    <div class="panel" style="margin-bottom:22px">
      <div class="row-flex" style="justify-content:space-between">
        <div><span class="banner">Castle Level ${lvl}</span></div>
        <div class="muted" style="font-weight:800">${Math.round(Player.levelProgress() * 100)}% to next level</div>
      </div>
      <div class="spacer"></div>
      <div class="progress gold"><div style="width:${Player.levelProgress() * 100}%"></div></div>
      <div class="stats-row">
        <div class="stat panel"><b>${read.length}/${BLOGS.length}</b>Lessons read</div>
        <div class="stat panel"><b>${journey.stage - 1}</b>Journey stages cleared</div>
        <div class="stat panel"><b>${answered.answered ? Math.round(answered.correct / answered.answered * 100) : 0}%</b>Quiz accuracy</div>
        <div class="stat panel"><b>${totalStars}⭐</b>Raid stars</div>
      </div>
    </div>

    <div class="village">
      ${b('#/play', '🛡️', 'Build & Defend', 'Place servers, databases and caches. Survive waves of traffic. Choose SQL or NoSQL and see what happens.', '<span class="chip lvl hard">MAIN QUEST</span>', 'featured')}
      ${b('#/learn', '📜', 'Library', `${BLOGS.length} short lessons in order — from DNS to designing YouTube.`)}
      ${b('#/quiz', '⚔️', 'Quiz Arena', `${QUIZ.length.toLocaleString('en-US')} questions. Journey mode, difficulty battles, topic drills.`)}
      ${b('#/long', '✍️', 'Scroll Tower', 'Write real answers in your own words and check which key points you hit.')}
      ${b('#/draw', '🧱', 'Workshop', 'A free whiteboard to draw architectures and wireframes.')}
      ${b('#/practice', '🎯', 'Training Grounds', `${PRACTICE.length} design challenges with a reference solution to compare.`)}
      ${b('#/videos', '🎬', 'Theater', 'Recent, hand-picked YouTube videos.')}
      ${b('#/creators', '👑', 'Guild of Masters', 'The best people to follow on YouTube, X and LinkedIn.')}
      ${b('#/books', '📚', 'Bookshop', 'The books that make you truly understand systems.')}
      ${b('#/courses', '🎓', 'Academy', 'Paid and free courses when you want more structure.')}
    </div>
  `;
};
