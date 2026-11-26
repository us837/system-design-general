/*
 * VIDEOS — YouTube only. Rule for this list: uploaded within the last 6 months (after 17 May 2026).
 * Upload months were checked via web search on 17 Nov 2026. Re-check and prune this list regularly.
 * To add one: { id: '<YouTube video id>', title, channel, uploaded: 'YYYY-MM', length: 'short'|'medium'|'long', tags: [] }
 * For a playlist use { playlist: '<list id>', ... } instead of id.
 */
window.VIDEOS = [
  { id: 'RNa0Lx4nu80', title: 'The Best Course On System Design in 2026', channel: '', uploaded: '2026-11', length: 'long', tags: ['full course', 'trade-offs'] },
  { id: 'soTfFFIQQ8U', title: 'Design Software Systems Like a Senior Engineer', channel: 'freeCodeCamp.org', uploaded: '2026-10', length: 'long', tags: ['full course', 'interview', 'framework'] },
  { id: '5ozClNjO44A', title: 'System Design Complete Course', channel: '', uploaded: '2026-10', length: 'medium', tags: ['overview', 'theory'] },
  // { id: 'YwchThwbxkQ', title: 'System Design Full Course 2026', channel: '', uploaded: '2026-08', length: 'long', tags: ['full course', 'backend'] },
  { id: 'SE2KF-vxvS0', title: 'System Design for Beginners (2026)', channel: '', uploaded: '2026-07', length: 'medium', tags: ['beginner', 'photo app'] },
  { id: '4ZNmvPL7oxA', title: 'Editor\'s pick', channel: '', uploaded: '', length: 'medium', tags: ['recommended'] }
];

/* CREATORS — people & channels worth following. Double-check handles before launch; people do change them. */
window.CREATORS = [
  { name: 'Alex Xu (ByteByteGo)', icon: '📘', about: 'Author of System Design Interview. Famous for clear visual explainers.', links: { YouTube: 'https://www.youtube.com/@ByteByteGo', X: 'https://x.com/alexxubyte', LinkedIn: 'https://www.linkedin.com/in/alexxubyte', Newsletter: 'https://blog.bytebytego.com' } },
  { name: 'Hello Interview', icon: '🎙️', about: 'Ex-FAANG interviewers walking through real system design questions.', links: { YouTube: 'https://www.youtube.com/@hello_interview', Website: 'https://www.hellointerview.com' } },
  { name: 'Arpit Bhayani', icon: '⚙️', about: 'Deep dives into databases, internals and real-world engineering.', links: { YouTube: 'https://www.youtube.com/@AsliEngineering', X: 'https://x.com/arpit_bhayani', LinkedIn: 'https://www.linkedin.com/in/arpitbhayani' } },
  { name: 'Hussein Nasser', icon: '🧪', about: 'Backend engineering, protocols, databases and proxies explained from first principles.', links: { YouTube: 'https://www.youtube.com/@hnasr', X: 'https://x.com/hnasr' } },
  { name: 'Gaurav Sen', icon: '🧠', about: 'Popular system design explainers and interview prep (InterviewReady).', links: { YouTube: 'https://www.youtube.com/@gkcs', X: 'https://x.com/gkcs_' } },
  { name: 'Jordan has no life', icon: '📚', about: 'Very detailed system design and distributed systems concept videos.', links: { YouTube: 'https://www.youtube.com/@jordanhasnolife5163' } },
  { name: 'Martin Kleppmann', icon: '📖', about: 'Author of Designing Data-Intensive Applications; distributed systems researcher.', links: { Website: 'https://martin.kleppmann.com' } },
  { name: 'Gergely Orosz', icon: '📰', about: 'The Pragmatic Engineer — how big tech actually builds and runs systems.', links: { X: 'https://x.com/GergelyOrosz', LinkedIn: 'https://www.linkedin.com/in/gergelyorosz', Newsletter: 'https://newsletter.pragmaticengineer.com' } },
  { name: 'Sahn Lam', icon: '🖼️', about: 'Co-author of System Design Interview Vol. 2; great visual posts.', links: { X: 'https://x.com/sahnlam', LinkedIn: 'https://www.linkedin.com/in/sahnlam' } },
  { name: 'Raul Junco', icon: '🧩', about: 'Short, practical posts on software architecture and system design.', links: { X: 'https://x.com/RaulJuncoV' } },
  { name: 'Neo Kim', icon: '✉️', about: 'The System Design Newsletter — real-world case studies in simple words.', links: { Newsletter: 'https://newsletter.systemdesign.one' } },
  { name: 'Marc Brooker', icon: '☁️', about: 'AWS distinguished engineer; thoughtful posts on distributed systems.', links: { Blog: 'https://brooker.co.za/blog/', X: 'https://x.com/MarcJBrooker' } },
  { name: 'Exponent', icon: '🎯', about: 'Mock interviews and system design walkthroughs.', links: { YouTube: 'https://www.youtube.com/@tryexponent' } },
  { name: 'Tech Dummies (Narendra L)', icon: '🛠️', about: 'Long-form whiteboard designs of popular systems.', links: { YouTube: 'https://www.youtube.com/@TechDummiesNarendraL' } }
];

window.ENGINEERING_BLOGS = [
  { name: 'The System Design Primer (GitHub)', url: 'https://github.com/donnemartin/system-design-primer' },
  { name: 'Netflix Tech Blog', url: 'https://netflixtechblog.com' },
  { name: 'Uber Engineering', url: 'https://www.uber.com/blog/engineering/' },
  { name: 'Discord Engineering', url: 'https://discord.com/category/engineering' },
  { name: 'AWS Architecture Blog', url: 'https://aws.amazon.com/blogs/architecture/' },
  { name: 'Cloudflare Blog', url: 'https://blog.cloudflare.com' },
  { name: 'Meta Engineering', url: 'https://engineering.fb.com' },
  { name: 'Stripe Engineering', url: 'https://stripe.com/blog/engineering' }
];

/*
 * BOOKS — links go to Amazon with your tag from js/config.js (SITE_CONFIG.amazonTag).
 * Set `asin` for a direct product page, or `affiliateUrl` to use any store/link you like.
 */
window.BOOKS = [
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', level: 'Core', color: '#7a3e9d', about: 'The best book on how databases, replication, partitioning and streams really work. Look for the latest edition.', asin: '', affiliateUrl: 'https://link.amazon/B076U7oPS' },
  { title: 'System Design Interview – An Insider\'s Guide (Vol. 1)', author: 'Alex Xu', level: 'Beginner', color: '#1d6db3', about: 'Step-by-step designs of classic interview problems with clear diagrams.', asin: '', affiliateUrl: 'https://link.amazon/B03jBpatR' },
  { title: 'System Design Interview – An Insider\'s Guide (Vol. 2)', author: 'Alex Xu & Sahn Lam', level: 'Intermediate', color: '#2b8a3e', about: 'More advanced designs: proximity service, payment system, stock exchange and more.', asin: '', affiliateUrl: 'https://link.amazon/B0ar7jCBZ' },
  { title: 'Understanding Distributed Systems', author: 'Roberto Vitillo', level: 'Beginner', color: '#c2410c', about: 'A short, friendly intro to the ideas behind large distributed systems.', asin: '', affiliateUrl: 'https://link.amazon/B03QhQnUY' },
  { title: 'Database Internals', author: 'Alex Petrov', level: 'Advanced', color: '#334155', about: 'How storage engines and distributed databases work under the hood.', asin: '', affiliateUrl: 'https://link.amazon/B07ILaqT3' },
  { title: 'Building Microservices (2nd ed.)', author: 'Sam Newman', level: 'Intermediate', color: '#0e7490', about: 'When and how to split systems into services — and when not to.', asin: '', affiliateUrl: 'https://link.amazon/B00L1irz5' },
  // { title: 'Fundamentals of Software Architecture', author: 'Mark Richards & Neal Ford', level: 'Intermediate', color: '#a16207', about: 'Architecture styles, characteristics and trade-off thinking.', asin: '', affiliateUrl: '' },
  // { title: 'Software Architecture: The Hard Parts', author: 'Neal Ford, Mark Richards, Pramod Sadalage, Zhamak Dehghani', level: 'Advanced', color: '#9f1239', about: 'Trade-off analysis for distributed architectures, data ownership and sagas.', asin: '', affiliateUrl: '' },
  // { title: 'Site Reliability Engineering', author: 'Google (Beyer, Jones, Petoff, Murphy)', level: 'Intermediate', color: '#15803d', about: 'How Google runs production: SLOs, error budgets, on-call, postmortems.', asin: '', affiliateUrl: '' },
  // { title: 'Release It! (2nd ed.)', author: 'Michael T. Nygard', level: 'Intermediate', color: '#b91c1c', about: 'Stability patterns like circuit breakers and bulkheads from real outages.', asin: '', affiliateUrl: '' },
  // { title: 'Web Scalability for Startup Engineers', author: 'Artur Ejsmont', level: 'Beginner', color: '#4338ca', about: 'Practical scaling of web apps: caching, queues, databases, search.', asin: '', affiliateUrl: '' },
  // { title: 'Acing the System Design Interview', author: 'Zhiyong Tan', level: 'Intermediate', color: '#0f766e', about: 'Interview-focused walkthroughs with trade-off discussions.', asin: '', affiliateUrl: '' },
  // { title: 'Machine Learning System Design Interview', author: 'Ali Aminian & Alex Xu', level: 'Advanced', color: '#6d28d9', about: 'Designing ML systems like recommendations, search ranking and ads.', asin: '', affiliateUrl: '' },
  // { title: 'AI Engineering', author: 'Chip Huyen', level: 'Intermediate', color: '#be185d', about: 'Building applications on foundation models: RAG, evaluation, serving.', asin: '', affiliateUrl: '' },
  // { title: 'Designing Machine Learning Systems', author: 'Chip Huyen', level: 'Intermediate', color: '#0369a1', about: 'End-to-end ML systems in production: data, training, deployment, monitoring.', asin: '', affiliateUrl: '' }
];

/*
 * COURSES — paste your affiliate link into `affiliateUrl` once you join each program.
 * `url` is the normal public page used until then.
 */
window.COURSES = [
  { title: 'Grokking the System Design Interview', provider: 'DesignGurus', price: 'Paid', level: 'Beginner → Intermediate', about: 'The classic interview course with many worked designs.', url: 'https://www.designgurus.io/course/grokking-the-system-design-interview', affiliateUrl: '' },
  { title: 'ByteByteGo — System Design courses', provider: 'ByteByteGo', price: 'Paid', level: 'All levels', about: 'Online versions of Alex Xu\'s books plus ML and GenAI system design.', url: 'https://bytebytego.com', affiliateUrl: '' },
  { title: 'Hello Interview Premium', provider: 'Hello Interview', price: 'Freemium', level: 'Intermediate', about: 'Written guides, "System Design in a Hurry", and mock interviews with experts.', url: 'https://www.hellointerview.com', affiliateUrl: '' },
  { title: 'Software Architecture & Design of Modern Large Scale Systems', provider: 'Udemy (Michael Pogrebinsky)', price: 'Paid', level: 'Beginner → Intermediate', about: 'Architecture building blocks and patterns for large-scale systems.', url: 'https://www.udemy.com/courses/search/?q=software%20architecture%20design%20of%20modern%20large%20scale%20systems', affiliateUrl: '' },
  { title: 'System Design Interview courses on Udemy', provider: 'Udemy', price: 'Paid', level: 'All levels', about: 'Browse top-rated system design interview courses.', url: 'https://www.udemy.com/courses/search/?q=system%20design%20interview', affiliateUrl: '' },
  { title: 'Software Design and Architecture Specialization', provider: 'Coursera (University of Alberta)', price: 'Paid / audit', level: 'Beginner', about: 'Design principles, patterns and architecture fundamentals.', url: 'https://www.coursera.org/specializations/software-design-architecture', affiliateUrl: '' },
  { title: 'Cloud Computing Concepts', provider: 'Coursera (UIUC)', price: 'Paid / audit', level: 'Intermediate', about: 'Distributed systems theory: gossip, consensus, P2P, key-value stores.', url: 'https://www.coursera.org/learn/cloud-computing', affiliateUrl: '' },
  { title: 'System Design Interview Course', provider: 'Exponent', price: 'Paid', level: 'Intermediate', about: 'Video lessons and mock interviews from big-tech engineers.', url: 'https://www.tryexponent.com/courses/system-design-interview', affiliateUrl: '' },
  { title: 'Grokking Modern System Design', provider: 'Educative', price: 'Paid', level: 'Intermediate', about: 'Interactive, text-based course with building blocks and designs.', url: 'https://www.educative.io/search?query=system%20design', affiliateUrl: '' },
  { title: 'MIT 6.5840 Distributed Systems', provider: 'MIT (free)', price: 'Free', level: 'Advanced', about: 'Lectures, papers and labs (Raft, sharded KV store). Hard but gold.', url: 'https://pdos.csail.mit.edu/6.824/', affiliateUrl: '' }
];
