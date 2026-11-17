window.BLOGS.push(
{ id: 'case-url-shortener', chapter: 'cases', title: 'Design a URL Shortener', body: `
> **In one line:** Turn long URLs into short codes, and redirect anyone who visits the short code — very fast, at huge read volume.

## Requirements
- Create a short link for a long URL. Optional custom alias and expiry.
- Visiting the short link redirects to the long URL.
- **Scale:** 100M new links/month; reads are ~100× writes.
- **Non-functional:** redirects under ~50 ms, highly available. Links never collide.

## Estimates
- Writes: 100M / month ≈ **40/s**. Reads ≈ **4,000/s** (peak maybe 20,000/s).
- Storage: 100M × 12 months × 5 years × ~500 bytes ≈ **3 TB**. Small.

## API
~~~
POST /links {longUrl, alias?, expiresAt?} → {shortCode}
GET  /{shortCode} → 301/302 redirect
~~~
**301** (permanent) lets browsers cache — less load, but you lose click analytics. **302** (temporary) sends every click to you — use it if you track clicks.

## Generating the short code
- **Hash** the URL (MD5/SHA) and take 7 chars: collisions need checking.
- **Counter + Base62:** a unique number → Base62 string. No collisions. Use **range allocation** so each server gets a block of IDs and needs no central call per link. 7 chars of Base62 ≈ 3.5 trillion codes.

## Data
Key-value shape: shortCode → longUrl, createdAt, expiresAt, userId. Fits **DynamoDB/Cassandra** or a sharded **PostgreSQL**. Shard by shortCode.

## High-level design
~~~
Client → LB → Link Service → Cache (Redis) → DB
                           ↘ ID range allocator
Clicks → queue → analytics workers
~~~
- Redirects check **Redis first** (most traffic hits a few hot links).
- Click events go to a **queue** so redirects stay fast.

## Deep dives
- **Hot links:** cache + CDN edge redirects.
- **Abuse:** rate limit creation; scan URLs against malware lists.
- **Expiry:** lazy delete on read + a background cleanup job.
` },

{ id: 'case-rate-limiter', chapter: 'cases', title: 'Design a Distributed Rate Limiter', body: `
> **In one line:** Limit each client to N requests per time window across a whole fleet of servers, adding almost no latency.

## Requirements
- Limit by user ID, API key or IP. Different rules per endpoint.
- Works across many API servers.
- Very low overhead (under ~1–2 ms).
- Return 429 with headers: X-RateLimit-Remaining, Retry-After.
- If the limiter breaks, **fail open** (let traffic through) for most APIs, so users are not blocked.

## Where it runs
As middleware in the **API gateway**, before requests reach services.

## Algorithm
**Token bucket** or **sliding window counter**, stored in **Redis**:
- Key: rate:{userId}:{endpoint}
- Token bucket state: tokens left + last refill time.
- Run the check-and-update as a single **Lua script** so it is atomic (no race between read and write).

## Design
~~~
Client → Gateway [rate-limit middleware] → Services
                    ↕
              Redis cluster (sharded by key)
              Rules config (cached locally)
~~~

## Deep dives
- **Scale:** shard Redis by key with consistent hashing; each check is one fast call.
- **Latency:** keep rules in local memory; refresh every few seconds.
- **Multi-region:** each region limits locally (slightly over-generous globally) or syncs counts asynchronously. Perfect global accuracy is rarely worth the latency.
- **Hot keys:** a single huge customer can be given a local in-memory pre-check before Redis.
- **Fairness and bursts:** token bucket allows short bursts; tune bucket size.
- **Observability:** metrics on rejections per rule, so you can spot attacks and bad limits.
` },

{ id: 'case-chat', chapter: 'cases', title: 'Design a Chat App (like WhatsApp)', body: `
> **In one line:** Deliver messages between users in real time, store history, and show online status — for hundreds of millions of users.

## Requirements
- 1:1 and group chats (groups up to ~500).
- Real-time delivery, delivered/read receipts, online presence.
- Message history on any device. Push notifications when offline.
- **Scale:** 500M DAU, ~50 messages each per day → **25B messages/day ≈ 300K/s** average.

## Connections
Clients keep a **WebSocket** to a **chat gateway** server. Millions of open connections are spread over many gateways. A **session store** (Redis) maps userId → gatewayId.

## Sending a message
1. Alice's app sends the message over her WebSocket.
2. The chat service gives it an ID (time-sortable), stores it, and acks Alice ("sent ✓").
3. It looks up Bob's gateway in the session store.
4. Online? Forward via **pub/sub** to Bob's gateway → Bob's socket ("delivered ✓✓").
5. Offline? Send a **push notification** (APNs/FCM). Bob fetches on reconnect.

## Storage
Heavy writes, read by conversation, newest first → **Cassandra/ScyllaDB** (wide-column).
- Partition key: **conversation_id**; clustering key: **message_id** (time-ordered).
- Media (images, voice) → **object storage + CDN**; the message only holds the link.

## Groups
Small groups: fan out by writing once and delivering to each member's gateway. Very large groups/channels: members pull.

## Presence
Heartbeats every ~30 s update last-seen in Redis with a TTL. Only push presence changes to contacts who are currently looking.

## Deep dives
- **Ordering:** per-conversation sequence numbers.
- **Delivery guarantee:** at-least-once + client-side dedup by message ID.
- **End-to-end encryption:** keys live on devices (Signal protocol); servers only relay ciphertext.
- **Multi-device:** each device has its own queue/cursor.
` },

{ id: 'case-news-feed', chapter: 'cases', title: 'Design a News Feed (like X/Twitter)', body: `
> **In one line:** Show each user a fast, fresh timeline of posts from the people they follow.

## Requirements
- Post short text/media. Follow users. View home timeline.
- **Scale:** 200M DAU, 2 posts/user/day ≈ 5K posts/s; timeline reads ≈ 100× more.
- Timeline loads in under ~200 ms. A few seconds of delay for new posts is fine (eventual consistency).

## The core question: fan-out
**Fan-out on write (push):** when someone posts, insert the post ID into each follower's precomputed timeline (in Redis).
- Reads are super fast — just read your list.
- A celebrity with 100M followers means 100M writes per post. 😬

**Fan-out on read (pull):** at read time, gather recent posts from everyone you follow and merge.
- Cheap writes.
- Slow reads if you follow many people.

**Hybrid (the real answer):**
- Normal users → push.
- Celebrities (followers > threshold) → **not** pushed. At read time, merge your precomputed timeline with recent posts from the celebrities you follow.

## Components
~~~
Post Service → Posts DB (sharded by post_id) + object storage/CDN for media
            → Kafka "new post" → Fan-out workers → Timeline cache (Redis lists per user)
Timeline Service → timeline cache + celebrity posts → hydrate post details (post cache) → client
Social Graph Service → followers/following (sharded DB + cache)
~~~

## Details
- Timeline cache keeps only the latest ~800 IDs per user. Older pages come from the database.
- Inactive users: skip fan-out for them; build their timeline on login.
- **Pagination** with cursors (last seen post ID), not page numbers.
- **Ranking:** a ranking service can reorder candidates by predicted engagement.
- Counts (likes, reposts) are approximate and updated asynchronously.
` },

{ id: 'case-notifications', chapter: 'cases', title: 'Design a Notification System', body: `
> **In one line:** Send the right message to the right user on the right channel (push, SMS, email, in-app), reliably and without spamming.

## Requirements
- Channels: mobile push (APNs/FCM), SMS, email, in-app.
- Triggered by other services ("your order shipped") or scheduled campaigns.
- Respect user preferences, quiet hours and rate limits.
- At-least-once delivery, no duplicate spam. Track delivery and opens.
- **Scale:** tens of millions of notifications per day, big bursts for campaigns.

## Design
~~~
Services → Notification API → validate + dedupe + preferences
         → Kafka/queues per channel (push, sms, email)
         → Channel workers → third-party providers (APNs, FCM, Twilio, SES)
         → Status events → tracking DB / analytics
~~~

## Key parts
- **Templates** with variables and localization, stored centrally.
- **User preferences & contact info** (device tokens, emails, opt-outs) in a database + cache.
- **Separate queues per channel** so a slow SMS provider cannot delay push notifications.
- **Priority queues:** a password reset jumps ahead of a marketing blast.

## Reliability
- Workers retry with exponential backoff; failing messages go to a **dead letter queue**.
- **Idempotency:** each notification has an ID; workers skip IDs already sent.
- Fallback providers for SMS and email.
- Remove dead device tokens when providers report them invalid.

## Not annoying users
- Per-user rate limits ("max 3 marketing pushes per day").
- **Batching/digests:** "5 people liked your photo" instead of 5 pushes.
- Quiet hours by user time zone.
` },

{ id: 'case-video', chapter: 'cases', title: 'Design a Video Platform (like YouTube)', body: `
> **In one line:** Let creators upload huge videos, convert them into many formats, and stream them smoothly worldwide.

## Requirements
- Upload videos; watch with smooth playback on any device and network.
- Search, view counts, comments (lighter focus).
- **Scale:** billions of views/day; uploads of hundreds of hours of video every minute.
- Playback must start fast and rarely buffer. Uploads must never be lost.

## Upload pipeline
1. Client requests upload → API returns a **pre-signed URL**.
2. Client uploads directly to **object storage**, in **chunks** (resumable if the network drops).
3. Upload-complete event → **queue**.
4. **Transcoding workers** convert the original into many resolutions (240p → 4K) and codecs, split into small **segments** (2–6 s each).
5. Thumbnails are generated; metadata saved to the DB; video marked ready.

Transcoding is split into many parallel tasks (a DAG of steps) across a worker fleet.

## Playback
- **Adaptive bitrate streaming (HLS/DASH):** the player downloads a manifest listing quality levels, then picks segment quality based on current bandwidth. Network slows → switch down, no buffering.
- Segments served from a **CDN**. Popular videos are cached at the edge; long-tail videos may come from regional caches or origin.

## Data
- Video metadata, users, channels → SQL (sharded) or a scalable store.
- View counts → aggregated asynchronously (stream processing), not a DB write per view.
- Comments → wide-column or sharded SQL.
- Search → Elasticsearch.

## Costs
Storage and CDN bandwidth dominate. Store fewer renditions for rarely watched videos; move old originals to cold storage.
` },

{ id: 'case-ride-sharing', chapter: 'cases', title: 'Design a Ride-Sharing App (like Uber)', body: `
> **In one line:** Match riders with nearby drivers in seconds, track trips live, and charge correctly.

## Requirements
- Rider requests a ride; sees fare estimate and ETA.
- Match with a nearby available driver; live tracking.
- Payments at the end.
- **Scale:** millions of drivers sending location every ~4 s → **hundreds of thousands of location updates/s**.
- Matching in seconds. Never assign one driver to two riders.

## Location service
- Drivers send GPS pings over a persistent connection.
- Store **latest** location in memory: **Redis GEO** or an in-memory geo index keyed by **geohash / H3 cell**.
- Do not write every ping to a database; sample to a time-series store for history and analytics.

## Matching
1. Rider requests → matching service finds candidate drivers in nearby cells.
2. Rank by ETA (using a routing service), rating, etc.
3. Offer to the best driver with a short timeout; if declined, try the next.
4. **Lock the driver** with an atomic operation (e.g., set status from available → reserved only if currently available) to avoid double-booking.

## Trip service
Trip state machine: requested → matched → driver arriving → in progress → completed → paid. Stored in a **strongly consistent** database (SQL), because money and state transitions matter.

## Other parts
- **Pricing service:** surge pricing from supply/demand per cell.
- **Payment service:** idempotent charges, ledger in SQL.
- **Notifications:** push to rider/driver.
- **Sharding by region/city:** most activity is local, so each city's data can live together.

~~~
Apps ⇄ Gateway/WebSockets → Location svc (Redis GEO) → Matching svc → Trip svc (SQL) → Payment svc
~~~
` },

{ id: 'case-web-crawler', chapter: 'cases', title: 'Design a Web Crawler', body: `
> **In one line:** Download billions of web pages politely, avoid duplicates, and keep them fresh.

## Requirements
- Start from seed URLs, follow links, store page content for indexing.
- **Scale:** ~1 billion pages/month ≈ **400 pages/s**. Average page 500 KB → ~500 TB/month raw.
- Polite: obey robots.txt and do not hammer any one website.
- Robust to traps, bad HTML and slow servers.

## The loop
1. **URL Frontier** gives the next URL.
2. **DNS resolver** (with its own cache — DNS is a hidden bottleneck).
3. **Fetcher** downloads the page.
4. **Parser** extracts text and links.
5. **Content dedup:** hash the content; skip if seen (mirror sites).
6. **URL filter + dedup:** normalize URLs; check "seen before?" with a **Bloom filter** / URL store.
7. New URLs go back to the frontier. Content goes to **object storage** for the indexer.

## The URL Frontier (the interesting part)
- **Priority:** important/fresh pages first (PageRank, change frequency).
- **Politeness:** one queue **per host**; each host is crawled by one worker with a delay between requests.
- So: front queues by priority → back queues by host.

## Freshness
Recrawl pages based on how often they change. News homepages: hourly. Old blog posts: rarely.

## Traps and safety
- Max depth and max URL length (calendar pages that go on forever).
- Timeouts on slow servers.
- Respect robots.txt (cache it per host).

## Scale-out
Partition the frontier and workers **by host hash**, so one host is always handled by the same worker (politeness is local). Add machines linearly.
` },

{ id: 'case-autocomplete', chapter: 'cases', title: 'Design Search Autocomplete', body: `
> **In one line:** As the user types, suggest the top few popular completions within ~100 ms.

## Requirements
- Return top 5–10 suggestions for a prefix, ranked by popularity.
- Very low latency (each keystroke is a request).
- **Scale:** 10M DAU × ~20 keystrokes × several searches ≈ tens of thousands of QPS.
- Suggestions can be a little stale (updated hourly or daily is fine).

## Data structure: trie
A **trie** stores strings by characters along a tree path. Every prefix is a node.
- Naive: walk to the prefix node, then search all children for the top results. Too slow.
- **Optimization:** store the **top-K completions at every node**. Lookup = walk to the node and read its list. O(length of prefix).
- Limit prefix length (e.g., 50 characters).

## Building it
- Log searches → **Kafka** → aggregate counts (batch, e.g., hourly with Spark, or streaming).
- Build a new trie offline, then swap it in. Don't update the serving trie on every query.

## Serving
~~~
Client (debounce typing) → LB → Autocomplete svc → Trie (in memory) / Redis cache
~~~
- Shard the trie by **prefix ranges** (a–f, g–m...) — watch for uneven popular letters; shard by observed traffic.
- Cache responses for popular prefixes at the CDN or in browser for a short time.

## Client tricks
- **Debounce:** wait ~100 ms after typing stops before calling.
- Fetch once for "ca" and filter locally for "cat" if possible.

## Extras
- Personalization (recent searches), trending boosts (time-decayed counts), filtering offensive terms, multiple languages.
` },

{ id: 'case-kv-store', chapter: 'cases', title: 'Design a Distributed Key-Value Store', body: `
> **In one line:** Build a giant dictionary — put(key, value), get(key) — spread across many machines, always available, and scalable.

## Requirements
- Simple API: put, get, delete. Small values (< 10 KB).
- Huge data, high throughput, low latency.
- Highly available; tunable consistency.
- Survives node and data center failures.

## Partitioning
Use **consistent hashing** with **virtual nodes** to spread keys across nodes. Adding a node moves only a small share of keys.

## Replication
Each key is stored on the next **N** distinct nodes on the ring (N = 3), ideally in different availability zones.

## Consistency
**Quorum:** choose W and R per request. W + R > N gives strong-ish reads; W = R = 1 gives speed. Conflicts from concurrent writes are detected with **vector clocks** or resolved with last-write-wins.

## Handling failures
- **Gossip protocol:** nodes regularly share who they think is alive. No central monitor.
- **Hinted handoff:** if a replica is down, another node keeps the write and hands it back later.
- **Read repair:** when a read finds stale replicas, fix them.
- **Anti-entropy with Merkle trees:** compare hash trees between replicas to find and sync differences efficiently.

## Storage engine on each node
**LSM tree:** writes go to a **commit log** (durability) and an in-memory **memtable**; when full, flush to an immutable sorted file (**SSTable**). Background **compaction** merges files. **Bloom filters** skip files that do not have a key.

## Write path / read path
- Write: commit log → memtable → ack → (later) SSTable.
- Read: memtable → Bloom filter check → SSTables → merge newest version.

This is the design behind **Amazon Dynamo**, **Cassandra** and **Riak**.
` },

{ id: 'case-payments', chapter: 'cases', title: 'Design a Payment System', body: `
> **In one line:** Move money correctly, exactly once, with a full audit trail — correctness beats speed.

## Requirements
- Customers pay merchants by card or wallet through a payment processor (PSP like Stripe, Adyen).
- Never double-charge, never lose a payment.
- Full auditability and reconciliation.
- Moderate volume (thousands of TPS at most), but strict correctness.

## Flow
1. Checkout creates a **payment intent** with an **idempotency key**.
2. Payment service stores it as PENDING (SQL).
3. Calls the PSP (hosted card page keeps raw card numbers out of your system — easier PCI compliance).
4. PSP responds (or calls a **webhook** later) → status SUCCEEDED / FAILED.
5. Write **ledger** entries; notify order service via an event (using the **outbox pattern**).

## The ledger
**Double-entry bookkeeping:** every transaction has a debit and an equal credit. Entries are **append-only** — never edited. Balances are derived. Mistakes are fixed with new reversing entries.

## Correctness tools
- **Idempotency keys** everywhere (client → service, service → PSP).
- **ACID database** (PostgreSQL) for payments and ledger.
- **State machine** with allowed transitions only.
- **Retries with backoff** for PSP timeouts — and **query status** before retrying to avoid double charges.
- **Reconciliation:** a nightly job compares your records with the PSP's settlement files. Mismatches raise alerts.

## Other concerns
- Distributed flows (order + payment + inventory) via **sagas** with compensations (refunds).
- Fraud checks before charging.
- Encryption, tokenization, strict access control, audit logs.

~~~
Checkout → Payment svc (idempotency) → PSP
               ↓ SQL: payments + ledger + outbox → Kafka → Order / Notification svcs
Nightly: Reconciliation job ↔ PSP reports
~~~
` },

{ id: 'case-file-storage', chapter: 'cases', title: 'Design Cloud File Storage (like Dropbox)', body: `
> **In one line:** Store users' files in the cloud and keep them in sync across all their devices.

## Requirements
- Upload, download, share files; automatic sync across devices; version history.
- Files up to several GB. Reliable even on flaky networks.
- **Scale:** 100M users, petabytes of data.

## Chunking — the key idea
Split each file into **chunks** (~4 MB). For each chunk compute a hash.
- **Resumable uploads:** only retry failed chunks.
- **Delta sync:** edit a big file → only the **changed chunks** upload.
- **Deduplication:** chunks with the same hash are stored once, even across users.

## Components
~~~
Desktop/Mobile client (watcher + chunker + local DB)
   → Metadata service (SQL): files, versions, chunk lists, sharing
   → Block service → object storage (chunks by hash)
   → Notification service (long poll / WebSocket): "file X changed"
~~~

## Sync flow
1. Client detects a change, splits the file, hashes chunks.
2. Asks the metadata service which chunks are new.
3. Uploads only the missing chunks (pre-signed URLs to object storage).
4. Commits a new **file version** in the metadata DB (a transaction).
5. Notification service tells the user's other devices; they download the new chunks.

## Conflicts
Two devices edit the same file offline. On sync, the second commit sees the version changed. Keep both: save a "conflicted copy" and let the user choose.

## Data
- Metadata needs strong consistency → **SQL**, sharded by user/namespace.
- Chunks → object storage, replicated across zones; cold tiers for old versions.
` },

{ id: 'case-ticketing', chapter: 'cases', title: 'Design a Ticket Booking System', body: `
> **In one line:** Sell limited seats to huge, sudden crowds without ever selling the same seat twice.

## Requirements
- Browse events, view seat map, reserve seats, pay, get tickets.
- **Never double-book.** Reservations hold for ~10 minutes during checkout.
- Huge spikes: a big concert can bring millions of users in seconds.

## Core: reserving a seat safely
Seat states: AVAILABLE → HELD (with expiry) → BOOKED.

Hold with an atomic conditional update in **SQL**:
~~~
UPDATE seats SET status='HELD', held_by=?, hold_until=now()+10min
WHERE seat_id=? AND (status='AVAILABLE' OR hold_until < now())
~~~
Exactly one user's update succeeds. Or use a **Redis lock with TTL** for the hold, with the database as the final truth.

Expired holds are released automatically (the hold_until check, plus a cleanup job).

## Handling the spike: virtual waiting room
- Users enter a **queue** before reaching the booking page.
- Let them in at a rate the system can handle; show their position.
- Protects the database and is fairer than "whoever refreshes fastest".

## Other parts
- **Event and venue data** is read-heavy and rarely changes → cache heavily, serve via CDN.
- **Seat availability view** can be slightly stale (cached for a second); the hold step is the strict check.
- **Payments** via an idempotent payment service; on success, BOOKED; on failure or timeout, release.
- **Bots:** rate limiting, CAPTCHAs, per-account limits.

~~~
Users → CDN → Waiting room → Booking svc → SQL (seats, holds, orders)
                                       → Payment svc → Ticket/Notification svc
~~~
` },

{ id: 'case-leaderboard', chapter: 'cases', title: 'Design a Real-Time Leaderboard', body: `
> **In one line:** Keep millions of player scores ranked in real time and answer "top 10" and "what is my rank?" instantly.

## Requirements
- Update a player's score after each match.
- Show top 10 and the player's own rank (with neighbors).
- **Scale:** 50M players, thousands of score updates per second.
- Updates visible in about a second.

## Why SQL struggles
"ORDER BY score DESC LIMIT 10" is fine with an index, but "what is my rank?" means counting everyone above you — slow on 50M rows, every time.

## Redis sorted sets
A **sorted set** keeps members ordered by score (using a skip list).
- ZINCRBY leaderboard 50 player42 → update score: O(log n).
- ZREVRANGE leaderboard 0 9 WITHSCORES → top 10: O(log n + 10).
- ZREVRANK leaderboard player42 → my rank: O(log n).

Perfect fit.

## Design
~~~
Game servers → Score service → (1) SQL/NoSQL: durable score history
                            → (2) Redis sorted set: live ranking
Clients → Leaderboard API → Redis (+ user profile cache for names/avatars)
~~~
- The database is the source of truth; Redis can be rebuilt from it.
- Use separate sorted sets per period (daily, weekly, season) — e.g., leaderboard:2026-11.

## Scaling further
- 50M members fit in one Redis node's memory (a few GB). Add replicas for reads.
- For far bigger scale, **shard by score range**, or keep exact top-N in one set and approximate ranks for everyone else.
- Ties: combine score with timestamp so earlier achievers rank higher.

## Friends leaderboard
Fetch friend IDs, then get their scores (ZMSCORE) and sort — small lists, cheap.
` }
);
