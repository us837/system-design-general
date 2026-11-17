/* Router + app boot */
(function () {
  const main = document.getElementById('app');
  function route() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
    const name = parts[0] || 'home';
    const query = Object.fromEntries(new URLSearchParams(qs || ''));
    const page = PAGES[name] || PAGES.home;
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === (PAGES[name] ? name : 'home')));
    document.getElementById('sidenav').classList.remove('open');
    document.onkeydown = null;
    SK.closeModal();
    main.innerHTML = '';
    try { page(main, parts.slice(1), query); }
    catch (err) { console.error(err); main.innerHTML = `<div class="panel"><h2>Something broke 🔥</h2><pre>${SK.esc(err.stack || err)}</pre></div>`; }
    if (name !== 'learn') window.scrollTo(0, 0);
    const titles = { home: 'Kingdom', learn: 'Library', quiz: 'Quiz Arena', long: 'Scroll Tower', play: 'Build & Defend', draw: 'Workshop', practice: 'Training Grounds', videos: 'Theater', creators: 'Guild of Masters', books: 'Bookshop', courses: 'Academy' };
    document.title = (titles[name] || 'Kingdom') + ' · Scale Kingdom';
  }
  document.getElementById('menuBtn').onclick = () => document.getElementById('sidenav').classList.toggle('open');
  window.addEventListener('hashchange', route);
  SK.Player.render();
  route();
})();
