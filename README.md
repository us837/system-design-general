# Scale Kingdom — Learn System Design

A static, game-style website for learning system design. No build step and no backend: open `index.html` in a browser, or host the folder on any static host (GitHub Pages, Netlify, Cloudflare Pages, S3).

Progress (gold, trophies, read lessons, quiz history, drawings) is saved in the browser's localStorage.

## Sections

| Section | Route | What it is |
|---|---|---|
| 🏰 Kingdom | `#/` | Home hub with progress and castle level |
| 📜 Library | `#/learn` | 71 short lessons in 9 chapters, read in order (each under 600 words) |
| ⚔️ Quiz Arena | `#/quiz` | 1,028 questions. Journey mode gets harder stage by stage, with difficulty hidden. Battle mode lets you pick difficulty and topic. Already-seen questions are skipped until the pool runs out. |
| ✍️ Scroll Tower | `#/long` | Long-answer questions, checked against key points, with a model answer |
| 🛡️ Build & Defend | `#/play` | Main game: place servers, caches, queues and databases (relational or NoSQL, then the engine), connect roads, and survive traffic waves |
| 🧱 Workshop | `#/draw` | Free diagram editor (Draw.io / Miro style) |
| 🎯 Training Grounds | `#/practice` | Design challenges with an automatic check and a reference architecture |
| 🎬 Theater | `#/videos` | Embedded YouTube videos |
| 👑 Guild of Masters | `#/creators` | Creators to follow on YouTube, X and LinkedIn |
| 📚 Bookshop | `#/books` | Affiliate book links |
| 🎓 Academy | `#/courses` | Affiliate course links |

## Adding your affiliate links

- **Amazon books:** set `amazonTag` in `js/config.js`. Every book link then carries your tag. To link a specific product page instead of an Amazon search, set `asin` on that book in `js/data/media.js`. To use a different store, set `affiliateUrl`.
- **Courses (Udemy, Coursera, Educative, etc.):** paste each affiliate link into that course's `affiliateUrl` in `js/data/media.js`. Until you do, the course's public URL is used.
- The disclosure text is in `js/config.js` (`affiliateDisclosure`).

## Editing content

| What | File |
|---|---|
| Lessons | `js/data/blogs-1.js` … `blogs-5.js` (simple markdown inside template strings; don't use backticks) |
| Hand-written quiz questions | `js/data/quiz-1.js` … `quiz-3.js`, in the format `[difficulty, topic, question, [correct, wrong, wrong, wrong], explanation]` |
| Glossary | `js/data/glossary.js`. Each term automatically becomes two quiz questions. |
| Generated numeric questions | `js/data/quiz-gen.js` |
| Long-answer questions | `js/data/long.js` |
| Practice challenges | `js/data/practice.js` |
| Videos, creators, books, courses | `js/data/media.js` |
| Game missions and balance | `js/pages/play.js` (`MISSIONS`, `B`, `ENGINES`) |

The video list follows a rule: only videos uploaded within the last 6 months. Review it regularly.
