/* Theater (videos), Guild of Masters (creators), Bookshop (books), Academy (courses) */
(function () {
  const { esc } = SK;
  const CFG = window.SITE_CONFIG || {};
  const disclosure = () => CFG.showAffiliateDisclosure ? `<p class="affiliate-note">ℹ️ ${esc(CFG.affiliateDisclosure)}</p>` : '';
  const monthName = ym => { if (!ym) return ''; const [y, m] = ym.split('-'); return new Date(+y, +m - 1, 1).toLocaleString('en', { month: 'short', year: 'numeric' }); };

  PAGES.videos = function (main) {
    const lens = { short: 'Short', medium: 'Medium', long: 'Long / full course' };
    const render = (filter) => {
      const list = VIDEOS.filter(v => !filter || v.length === filter);
      main.querySelector('#vids').innerHTML = list.map(v => {
        const src = v.playlist ? `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(v.playlist)}` : `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}`;
        const link = v.playlist ? `https://www.youtube.com/playlist?list=${encodeURIComponent(v.playlist)}` : `https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}`;
        return `<div class="panel card video-card">
          <iframe src="${src}" title="${esc(v.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
          <h3 style="font-size:18px">${esc(v.title)}</h3>
          <div class="row-flex">${v.channel ? `<span class="chip">${esc(v.channel)}</span>` : ''}${v.uploaded ? `<span class="chip">📅 ${monthName(v.uploaded)}</span>` : ''}<span class="chip">${lens[v.length] || ''}</span>${(v.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>
          <div class="spacer"></div><a class="btn small blue" href="${link}" target="_blank" rel="noopener">Open on YouTube ↗</a>
        </div>`;
      }).join('') || '<div class="panel">No videos in this group yet.</div>';
    };
    main.innerHTML = `
      <h1 class="page-title stroke">🎬 Theater</h1>
      <p class="page-sub">Hand-picked system design videos from the last 6 months. Watch one after finishing a Library chapter.</p>
      <div class="row-flex" style="margin-bottom:16px">
        <button class="btn small gold" data-f="">All</button>${Object.entries(lens).map(([k, v]) => `<button class="btn small grey" data-f="${k}">${v}</button>`).join('')}
      </div>
      <div class="grid" id="vids" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr))"></div>`;
    main.querySelectorAll('[data-f]').forEach(b => b.onclick = () => {
      main.querySelectorAll('[data-f]').forEach(x => x.classList.replace('gold', 'grey')); b.classList.replace('grey', 'gold'); render(b.dataset.f);
    });
    render('');
  };

  PAGES.creators = function (main) {
    const icon = { YouTube: '▶️', X: '𝕏', LinkedIn: '💼', Newsletter: '✉️', Website: '🌐', Blog: '📝' };
    main.innerHTML = `
      <h1 class="page-title stroke">👑 Guild of Masters</h1>
      <p class="page-sub">Follow these people and channels. A few minutes a day of their posts will keep your skills sharp.</p>
      <div class="grid">${CREATORS.map(c => `
        <div class="panel card creator-card">
          <div class="avatar">${c.icon}</div><h3>${esc(c.name)}</h3><p>${esc(c.about)}</p>
          <div class="links">${Object.entries(c.links).map(([k, u]) => `<a class="btn small ${k === 'YouTube' ? 'red' : k === 'LinkedIn' ? 'blue' : k === 'X' ? 'grey' : 'purple'}" href="${esc(u)}" target="_blank" rel="noopener">${icon[k] || '🔗'} ${k}</a>`).join('')}</div>
        </div>`).join('')}</div>
      <div class="spacer"></div>
      <div class="panel"><h2 style="margin-top:0">📰 Engineering blogs worth reading</h2>
        <div class="links">${ENGINEERING_BLOGS.map(b => `<a class="btn small grey" href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.name)} ↗</a>`).join('')}</div>
      </div>`;
  };

  function bookUrl(b) {
    if (b.affiliateUrl) return b.affiliateUrl;
    const dom = CFG.amazonDomain || 'www.amazon.com';
    const tag = CFG.amazonTag ? (b.asin ? `?tag=${encodeURIComponent(CFG.amazonTag)}` : `&tag=${encodeURIComponent(CFG.amazonTag)}`) : '';
    if (b.asin) return `https://${dom}/dp/${encodeURIComponent(b.asin)}${tag}`;
    return `https://${dom}/s?k=${encodeURIComponent(b.title + ' ' + b.author)}&i=stripbooks${tag}`;
  }
  PAGES.books = function (main) {
    main.innerHTML = `
      <h1 class="page-title stroke">📚 Bookshop</h1>
      <p class="page-sub">The books that turn "I watched a video" into "I really understand it".</p>
      ${disclosure()}
      <div class="grid">${BOOKS.map(b => `
        <div class="panel card book-card">
          <div class="cover" style="background:linear-gradient(135deg, ${b.color}, #111)">${esc(b.title)}</div>
          <span class="chip">${esc(b.level)}</span>
          <h3 style="font-size:18px">${esc(b.title)}</h3>
          <p><b>${esc(b.author)}</b><br>${esc(b.about)}</p>
          <a class="btn gold small" href="${esc(bookUrl(b))}" target="_blank" rel="noopener sponsored">🛒 Get the book</a>
        </div>`).join('')}</div>`;
  };

  PAGES.courses = function (main) {
    main.innerHTML = `
      <h1 class="page-title stroke">🎓 Academy</h1>
      <p class="page-sub">When you want a structured path, a guided course or mock interviews.</p>
      ${disclosure()}
      <div class="grid">${COURSES.map(c => `
        <div class="panel card">
          <div class="row-flex"><span class="chip ${c.price === 'Free' ? 'easy' : 'medium'}">${esc(c.price)}</span><span class="chip">${esc(c.level)}</span></div>
          <h3>${esc(c.title)}</h3>
          <p><b>${esc(c.provider)}</b><br>${esc(c.about)}</p>
          <a class="btn small" href="${esc(c.affiliateUrl || c.url)}" target="_blank" rel="noopener sponsored">View course ↗</a>
        </div>`).join('')}</div>`;
  };
})();
