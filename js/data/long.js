/*
 * Long-answer questions. Each answer is checked against key points.
 * A key point counts as covered if the answer contains ANY of its keywords (case-insensitive).
 */
window.LONG_QUESTIONS = [
{ id: 'l1', d: 'e', topic: 'scaling', title: 'Scale up or scale out?',
  prompt: 'Explain the difference between vertical and horizontal scaling. When would you choose each, and what are the risks?',
  points: [
    { p: 'Vertical = bigger machine (more CPU/RAM)', k: ['vertical', 'scale up', 'bigger machine', 'more cpu', 'more ram'] },
    { p: 'Horizontal = more machines', k: ['horizontal', 'scale out', 'more machines', 'more servers', 'add servers'] },
    { p: 'Vertical has a hardware ceiling / gets expensive', k: ['ceiling', 'limit', 'expensive', 'cost'] },
    { p: 'Single point of failure risk', k: ['single point of failure', 'spof', 'one machine dies', 'fails'] },
    { p: 'Horizontal needs load balancing / stateless design', k: ['load balancer', 'stateless', 'load balancing'] },
    { p: 'Horizontal adds complexity (coordination, consistency)', k: ['complex', 'consistency', 'coordination', 'distributed'] }
  ],
  model: 'Vertical scaling means upgrading one machine with more CPU, RAM or faster disks. It is simple and needs no code changes, but it hits a hardware ceiling, becomes very expensive, and the machine stays a single point of failure. Horizontal scaling means adding more machines and spreading work with a load balancer. It has almost no ceiling and tolerates failures, but it adds complexity: services must be stateless, data must be partitioned or replicated, and consistency gets harder. In practice, scale stateless app servers horizontally early, and scale databases carefully—first vertically, then with replicas and sharding.' },
{ id: 'l2', d: 'e', topic: 'scaling', title: 'Why caches work',
  prompt: 'Why does caching make systems faster? Describe cache-aside and how you would handle stale data.',
  points: [
    { p: 'Memory is much faster than disk/database', k: ['memory', 'ram', 'faster', 'in-memory'] },
    { p: 'Popular data is a small hot set (80/20)', k: ['80/20', 'popular', 'hot', 'frequently'] },
    { p: 'Cache-aside: read cache, on miss read DB and fill cache', k: ['miss', 'cache-aside', 'lazy', 'populate', 'fill'] },
    { p: 'Use TTL / expiry', k: ['ttl', 'expire', 'expiry', 'time to live'] },
    { p: 'Invalidate / delete key on update', k: ['invalidat', 'delete the key', 'evict', 'delete key', 'remove the key'] },
    { p: 'Reduces database load', k: ['database load', 'db load', 'offload', 'fewer queries', 'reduce load'] }
  ],
  model: 'Caches keep copies of frequently read data in memory, which is orders of magnitude faster than querying a database on disk over the network. Because most traffic targets a small hot set of data (the 80/20 rule), even a modest cache can serve most reads and greatly reduce database load. In cache-aside, the app checks the cache first; on a miss it reads the database and stores the result in the cache. To limit staleness, set a TTL on entries and delete (invalidate) the cache key whenever the underlying data is updated. For data that must always be exact, skip the cache or read from the source.' },
{ id: 'l3', d: 'm', topic: 'data', title: 'Choose a database for an online store',
  prompt: 'An online store has orders and payments, a product catalog with very different attributes per category, a search box, and shopping carts. Which databases would you use for each part, and why?',
  points: [
    { p: 'Orders/payments in a relational DB with ACID', k: ['postgres', 'mysql', 'relational', 'sql', 'acid', 'transaction'] },
    { p: 'Catalog in a document store or JSON column', k: ['mongo', 'document', 'jsonb', 'json'] },
    { p: 'Search with Elasticsearch / inverted index', k: ['elasticsearch', 'opensearch', 'search engine', 'inverted index', 'solr', 'algolia'] },
    { p: 'Carts/sessions in a key-value store like Redis/DynamoDB', k: ['redis', 'key-value', 'dynamodb', 'key value'] },
    { p: 'Sync search index from the DB (CDC/queue)', k: ['cdc', 'change data capture', 'queue', 'sync', 'kafka', 'debezium'] },
    { p: 'Justify with consistency vs flexibility trade-offs', k: ['consistency', 'flexible', 'schema', 'trade'] }
  ],
  model: 'Orders and payments need ACID transactions and strong consistency, so they belong in a relational database such as PostgreSQL. The product catalog has varied attributes per category, which fits a document store like MongoDB, or PostgreSQL JSONB columns if we want fewer systems. Search needs full-text matching, ranking and typo tolerance, so we use Elasticsearch or OpenSearch with an inverted index, kept in sync from the primary database via change data capture or a queue. Shopping carts are simple key lookups with high traffic and short lifetimes, a good fit for Redis or DynamoDB with TTLs. This is polyglot persistence: each store is chosen for its access pattern and consistency needs.' },
{ id: 'l4', d: 'm', topic: 'distributed', title: 'Explain CAP to a teammate',
  prompt: 'Explain the CAP theorem in simple words, and give one example of a feature that should choose consistency and one that should choose availability.',
  points: [
    { p: 'Defines C, A and P', k: ['consistency', 'availability', 'partition'] },
    { p: 'Partitions are unavoidable in distributed systems', k: ['unavoidable', 'will happen', 'must tolerate', 'network fails', 'cannot avoid', 'inevitable'] },
    { p: 'During a partition you choose C or A', k: ['during a partition', 'choose', 'trade', 'either'] },
    { p: 'Consistency example (payments, inventory, booking)', k: ['payment', 'bank', 'inventory', 'booking', 'ticket', 'seat', 'balance'] },
    { p: 'Availability example (likes, feeds, carts)', k: ['like', 'feed', 'cart', 'view count', 'social', 'comment'] },
    { p: 'Without partitions you can have both / per-feature choice', k: ['no partition', 'normal operation', 'per feature', 'different parts', 'pacelc'] }
  ],
  model: 'CAP says that in a distributed system, when a network partition happens, you must choose between consistency (every read sees the latest write or gets an error) and availability (every request gets a non-error answer, possibly stale). Partitions are unavoidable in real networks, so partition tolerance is required and the real choice is C or A during the failure. When there is no partition you can have both. A seat booking or bank balance should choose consistency: better to show an error than sell a seat twice. A like counter or social feed should choose availability: a few seconds of stale data is fine. Different features in the same system can make different choices.' },
{ id: 'l5', d: 'm', topic: 'distributed', title: 'Safe payment retries',
  prompt: 'A mobile app calls POST /payments. The network times out and the app retries. How do you make sure the customer is not charged twice?',
  points: [
    { p: 'Idempotency key generated by client', k: ['idempotency key', 'idempotent', 'unique key', 'request id', 'uuid'] },
    { p: 'Server stores key with result', k: ['store', 'save', 'record', 'table', 'persist'] },
    { p: 'Duplicate key returns the saved result', k: ['same result', 'return the saved', 'return the previous', 'duplicate', 'already processed', 'return the stored', 'return the original'] },
    { p: 'Unique constraint / atomic check', k: ['unique constraint', 'unique index', 'atomic', 'transaction', 'lock'] },
    { p: 'Pass idempotency to the payment provider too', k: ['provider', 'stripe', 'psp', 'downstream', 'processor'] },
    { p: 'Check status before retrying on timeout', k: ['check status', 'query status', 'status', 'reconcil'] }
  ],
  model: 'The client generates a unique idempotency key (a UUID) for the payment attempt and sends it with every retry. The server stores the key with the request and its result, protected by a unique constraint so two concurrent requests with the same key cannot both proceed. If a request arrives with a key that has already been processed, the server returns the stored result instead of charging again. The server also passes an idempotency key to the payment provider, and on a timeout it queries the payment status before retrying. Nightly reconciliation catches anything that slips through.' },
{ id: 'l6', d: 'm', topic: 'async', title: 'When to use a message queue',
  prompt: 'Describe three situations where adding a message queue improves a system, and two problems queues introduce.',
  points: [
    { p: 'Decoupling producers and consumers', k: ['decoupl', 'independent', 'loosely'] },
    { p: 'Absorbing traffic spikes', k: ['spike', 'burst', 'buffer', 'smooth', 'peak'] },
    { p: 'Background / slow work (emails, video)', k: ['background', 'async', 'email', 'video', 'slow', 'thumbnail'] },
    { p: 'Retries and dead letter queues', k: ['retry', 'retries', 'dead letter', 'dlq'] },
    { p: 'Problem: duplicates / need idempotency', k: ['duplicate', 'idempoten', 'at-least-once', 'twice'] },
    { p: 'Problem: delay / eventual consistency / debugging', k: ['delay', 'latency', 'eventual', 'debug', 'ordering', 'complex', 'monitor'] }
  ],
  model: 'Queues help when (1) we want to decouple services so the producer does not depend on the consumer being up; (2) traffic is spiky, because the queue buffers bursts and workers drain them at a steady rate; and (3) work is slow, such as sending emails, resizing images or transcoding video, so the API can reply immediately while workers process in the background. Failed messages can be retried and eventually moved to a dead letter queue. Queues also introduce problems: most deliver at least once, so consumers must be idempotent to handle duplicates; and work becomes asynchronous, adding delay, eventual consistency and harder debugging and monitoring (watch queue depth).' },
{ id: 'l7', d: 'm', topic: 'data', title: 'Sharding a user database',
  prompt: 'Your users table has grown too big for one database. Explain how you would shard it, how you choose the shard key, and what problems you expect.',
  points: [
    { p: 'Shard key choice (e.g., user_id)', k: ['shard key', 'user_id', 'userid', 'partition key'] },
    { p: 'Hash-based for even spread', k: ['hash'] },
    { p: 'Consistent hashing for rebalancing', k: ['consistent hashing', 'rebalanc', 'virtual node'] },
    { p: 'Hot spots / celebrities', k: ['hot', 'celebrity', 'uneven', 'skew'] },
    { p: 'Cross-shard queries/transactions are hard', k: ['cross-shard', 'cross shard', 'scatter', 'join', 'multiple shards'] },
    { p: 'Try simpler options first (replicas, cache)', k: ['replica', 'cache', 'index', 'vertical', 'before shard'] }
  ],
  model: 'Before sharding, I would try indexes, caching, read replicas and a bigger machine. If we still need to shard, I would choose user_id as the shard key, because most queries are per user and it spreads evenly. Hashing the user_id gives a uniform distribution; using consistent hashing (or many logical shards mapped to physical nodes) makes rebalancing cheaper when adding capacity. Expected problems: queries that do not include user_id must scatter to all shards (so add secondary lookup tables or a search index), cross-shard transactions are hard (use sagas or avoid them), and hot users can overload one shard, which needs caching or splitting.' },
{ id: 'l8', d: 'h', topic: 'cases', title: 'Design a URL shortener (short essay)',
  prompt: 'Design a URL shortener handling 100M new links per month and 100× more redirects. Cover code generation, storage, the read path and scaling.',
  points: [
    { p: 'Estimate reads vs writes', k: ['qps', 'per second', 'read-heavy', '100x', '100×', 'ratio'] },
    { p: 'Base62 code from unique counter / range allocation', k: ['base62', 'base 62', 'counter', 'range', 'snowflake'] },
    { p: 'Key-value store (DynamoDB/Cassandra) or sharded SQL', k: ['key-value', 'dynamodb', 'cassandra', 'shard', 'key value'] },
    { p: 'Cache hot links in Redis/CDN', k: ['cache', 'redis', 'cdn'] },
    { p: '301 vs 302 trade-off', k: ['301', '302'] },
    { p: 'Analytics via queue, async', k: ['queue', 'kafka', 'async', 'analytics'] },
    { p: 'Rate limiting / abuse', k: ['rate limit', 'abuse', 'spam', 'malware'] }
  ],
  model: 'Writes are about 40/s and reads about 4,000/s on average, so the system is read-heavy. To create codes, each app server takes a range of IDs from a coordinator and encodes the next number in Base62; 7 characters gives about 3.5 trillion codes with no collisions. Mappings (code → long URL, owner, expiry) are stored in a key-value store like DynamoDB or Cassandra, partitioned by code. On redirect, the service checks Redis first and falls back to the database; very hot links can even be served from the CDN edge. A 302 redirect lets us count clicks, while a 301 reduces load but hides analytics. Click events go to a queue for asynchronous analytics so redirects stay fast. Creation is rate-limited and URLs are checked against malware lists.' },
{ id: 'l9', d: 'h', topic: 'cases', title: 'Real-time chat delivery',
  prompt: 'Explain how a message from Alice reaches Bob in a chat app with hundreds of millions of users, including when Bob is offline.',
  points: [
    { p: 'WebSocket connections to gateway servers', k: ['websocket', 'persistent connection', 'gateway'] },
    { p: 'Session registry: which server holds Bob', k: ['registry', 'session', 'which server', 'mapping', 'presence'] },
    { p: 'Route between servers via pub/sub', k: ['pub/sub', 'pubsub', 'redis', 'kafka', 'route'] },
    { p: 'Persist messages (Cassandra by conversation)', k: ['cassandra', 'store', 'persist', 'conversation_id', 'database'] },
    { p: 'Offline: push notification (APNs/FCM)', k: ['push', 'apns', 'fcm', 'notification'] },
    { p: 'Acks / delivery receipts / dedup', k: ['ack', 'receipt', 'delivered', 'dedup', 'message id'] }
  ],
  model: 'Alice and Bob each keep a WebSocket open to a chat gateway server. When Alice sends a message, her gateway passes it to the chat service, which assigns a time-ordered message ID, writes it to a store such as Cassandra partitioned by conversation_id, and acknowledges Alice. The service looks up Bob in a session registry (Redis) to find which gateway he is connected to and forwards the message there via pub/sub; the gateway pushes it to Bob, and Bob\'s client sends a delivered receipt. If Bob is offline, the service sends a push notification through APNs or FCM, and when he reconnects his client fetches messages since its last seen ID. Delivery is at-least-once, so clients deduplicate by message ID.' },
{ id: 'l10', d: 'h', topic: 'cases', title: 'News feed fan-out',
  prompt: 'Compare fan-out on write and fan-out on read for a social news feed. What would you choose for a platform with celebrities, and why?',
  points: [
    { p: 'Fan-out on write: push into followers\' timelines', k: ['fan-out on write', 'fanout on write', 'push'] },
    { p: 'Fan-out on read: pull at read time', k: ['fan-out on read', 'fanout on read', 'pull'] },
    { p: 'Write is costly for celebrities with many followers', k: ['celebrit', 'million followers', 'many followers', 'expensive write'] },
    { p: 'Read is slow when following many people', k: ['slow read', 'read latency', 'merge', 'following many'] },
    { p: 'Hybrid approach', k: ['hybrid', 'combine', 'mix'] },
    { p: 'Timeline cache (Redis) with limited length', k: ['redis', 'cache', 'timeline cache'] }
  ],
  model: 'With fan-out on write (push), each new post is inserted into every follower\'s precomputed timeline, usually a Redis list, so reading is a fast lookup; but a celebrity with 100M followers would trigger 100M writes per post. With fan-out on read (pull), the timeline is assembled at read time by fetching recent posts from everyone you follow and merging; writes are cheap but reads become slow for users who follow many accounts. For a platform with celebrities, a hybrid works best: push posts from normal users into followers\' cached timelines, but skip fan-out for celebrities and merge their recent posts in at read time. Timeline caches keep only the latest few hundred IDs, and inactive users are skipped during fan-out.' },
{ id: 'l11', d: 'm', topic: 'patterns', title: 'Rate limiting design',
  prompt: 'Design rate limiting for a public API used by many customers. Which algorithm, where does it run, and how do multiple servers share counts?',
  points: [
    { p: 'Token bucket or sliding window', k: ['token bucket', 'sliding window', 'leaky bucket'] },
    { p: 'Runs at gateway / middleware', k: ['gateway', 'middleware', 'edge', 'load balancer'] },
    { p: 'Shared counters in Redis', k: ['redis', 'shared', 'central'] },
    { p: 'Atomic operations / Lua', k: ['atomic', 'lua', 'incr', 'race'] },
    { p: 'Return 429 + Retry-After', k: ['429', 'retry-after', 'too many requests'] },
    { p: 'Limit by API key / user / IP; fail-open decision', k: ['api key', 'per user', 'per ip', 'fail open', 'fail-open'] }
  ],
  model: 'I would use a token bucket per API key, which allows short bursts while enforcing an average rate (a sliding window counter is a good alternative). It runs as middleware in the API gateway before requests reach services. Because there are many gateway instances, the bucket state lives in Redis, and each check-and-decrement runs atomically in a Lua script to avoid race conditions. Rules are cached locally. When the limit is exceeded we return 429 Too Many Requests with a Retry-After header and remaining-quota headers. Limits apply per API key, with per-IP limits for anonymous traffic. If Redis is unavailable, we fail open and alert, so customers are not blocked by our own outage.' },
{ id: 'l12', d: 'm', topic: 'reliability', title: 'Making a service highly available',
  prompt: 'Your service must reach 99.99% availability. What design choices would you make?',
  points: [
    { p: 'Remove single points of failure / redundancy', k: ['single point', 'redundan', 'spof', 'multiple instances'] },
    { p: 'Multiple availability zones / regions', k: ['availability zone', 'multi-az', 'region', 'zones'] },
    { p: 'Load balancer with health checks', k: ['health check', 'load balancer'] },
    { p: 'Database replication and automatic failover', k: ['replica', 'failover', 'replication'] },
    { p: 'Safe deploys (canary, rollback)', k: ['canary', 'rollback', 'blue-green', 'blue green', 'feature flag'] },
    { p: 'Monitoring/alerting and fast recovery (MTTR)', k: ['monitor', 'alert', 'mttr', 'observability', 'on-call'] }
  ],
  model: '99.99% allows only about 52 minutes of downtime per year, so every component must be redundant. Stateless app servers run as multiple instances across at least three availability zones behind redundant load balancers with health checks. The database uses replication with automatic failover to a standby in another zone, and backups are tested. Dependencies get timeouts, retries with backoff and circuit breakers so one failure does not cascade. Most outages come from changes, so deploys use canaries, feature flags and instant rollback. Finally, strong monitoring on SLOs, actionable alerts and runbooks keep mean time to recovery low; for even higher targets, consider multi-region.' },
{ id: 'l13', d: 'h', topic: 'distributed', title: 'Booking across services',
  prompt: 'A travel app books a flight, a hotel, and charges a card — three services, three databases. How do you keep them consistent?',
  points: [
    { p: 'No single ACID transaction across services', k: ['cannot use', 'no single transaction', 'distributed transaction', 'across services'] },
    { p: '2PC and its downsides', k: ['2pc', 'two-phase', 'two phase'] },
    { p: 'Saga with local transactions', k: ['saga'] },
    { p: 'Compensating actions (cancel, refund)', k: ['compensat', 'refund', 'cancel', 'undo'] },
    { p: 'Orchestration or choreography', k: ['orchestrat', 'choreograph'] },
    { p: 'Idempotency / outbox for reliable events', k: ['idempot', 'outbox'] }
  ],
  model: 'Each service owns its database, so a single ACID transaction is not possible. Two-phase commit could coordinate them but it is slow, holds locks and can block if the coordinator fails, so it is rarely used across microservices. Instead I would use a saga: a sequence of local transactions—reserve flight, reserve hotel, charge card—each with a compensating action (cancel flight, cancel hotel, refund). If the charge fails, the saga runs the compensations in reverse order. An orchestrator (for example a workflow engine like Temporal) makes the flow explicit and easy to monitor. Every step is idempotent so retries are safe, and services publish events using the outbox pattern so database changes and events never disagree. The system is eventually consistent during the saga.' },
{ id: 'l14', d: 'e', topic: 'foundations', title: 'What happens when you type a URL',
  prompt: 'Describe what happens from the moment a user types a URL into the browser until the page appears.',
  points: [
    { p: 'DNS lookup', k: ['dns'] },
    { p: 'TCP connection', k: ['tcp', 'handshake', 'connection'] },
    { p: 'TLS for HTTPS', k: ['tls', 'https', 'ssl', 'encrypt'] },
    { p: 'HTTP request/response', k: ['http request', 'get request', 'request', 'response'] },
    { p: 'Server processing (LB, app, DB)', k: ['server', 'load balancer', 'database'] },
    { p: 'Browser renders and loads assets', k: ['render', 'html', 'css', 'javascript', 'assets'] }
  ],
  model: 'The browser first resolves the domain name to an IP address with DNS, checking caches before asking a resolver that walks root, TLD and authoritative servers. It then opens a TCP connection to that IP and, for HTTPS, performs a TLS handshake to set up encryption. It sends an HTTP GET request. The request typically passes a CDN or load balancer, reaches an application server that may read caches and databases, and returns an HTTP response with a status code and HTML. The browser parses the HTML, fetches CSS, JavaScript and images (often from a CDN), and renders the page.' },
{ id: 'l15', d: 'm', topic: 'scaling', title: 'Serving images globally',
  prompt: 'Users all over the world upload and view photos. How would you store and serve them efficiently?',
  points: [
    { p: 'Object storage (S3) for bytes', k: ['s3', 'object storage', 'blob', 'gcs'] },
    { p: 'Metadata in a database', k: ['metadata', 'database'] },
    { p: 'CDN for delivery', k: ['cdn', 'edge'] },
    { p: 'Pre-signed URL direct upload', k: ['pre-signed', 'presigned', 'signed url', 'direct upload'] },
    { p: 'Async processing: thumbnails/resizing', k: ['thumbnail', 'resiz', 'worker', 'queue', 'async'] },
    { p: 'Cache headers / versioned names', k: ['cache-control', 'ttl', 'version', 'immutable'] }
  ],
  model: 'Photo bytes go to object storage such as S3, which is cheap, durable and effectively unlimited, while metadata (owner, caption, storage key, sizes) goes to a database. Clients upload directly to object storage using pre-signed URLs, so app servers do not handle large payloads. An upload event goes onto a queue, and workers generate thumbnails and resized versions. Images are served through a CDN, so users download from a nearby edge location; we use immutable, versioned object keys and long Cache-Control lifetimes so CDNs can cache aggressively.' },
{ id: 'l16', d: 'h', topic: 'cases', title: 'Ticket sale spike',
  prompt: 'A popular concert goes on sale and 2 million fans arrive in the first minute for 50,000 seats. Design the booking flow so no seat is sold twice and the system stays up.',
  points: [
    { p: 'Virtual waiting room / queue admission', k: ['waiting room', 'queue', 'admission', 'throttle'] },
    { p: 'Atomic seat hold (conditional update / lock)', k: ['atomic', 'lock', 'conditional', 'for update', 'compare'] },
    { p: 'Hold with expiry/TTL', k: ['expir', 'ttl', 'timeout', 'hold'] },
    { p: 'Relational DB as source of truth', k: ['sql', 'postgres', 'relational', 'source of truth', 'acid'] },
    { p: 'Cache/CDN for read-heavy event data', k: ['cache', 'cdn'] },
    { p: 'Bot protection / rate limits', k: ['bot', 'captcha', 'rate limit'] },
    { p: 'Idempotent payment then confirm', k: ['payment', 'idempot'] }
  ],
  model: 'First, put a virtual waiting room in front of the booking flow, admitting users at a rate the backend can handle and showing their position; this protects the database and is fair. Static event and venue data are served from a CDN and caches. When a user selects a seat, we place a hold with an atomic conditional update in a relational database—only if the seat is available or its previous hold expired—so exactly one request can win. Holds carry an expiry (about 10 minutes) and are released automatically. Payment is processed idempotently; on success the seat becomes booked, on failure or timeout it is released. Rate limits, CAPTCHAs and per-account limits fight bots.' },
{ id: 'l17', d: 'm', topic: 'async', title: 'Polling vs WebSockets vs SSE',
  prompt: 'Compare short polling, long polling, Server-Sent Events and WebSockets. Give a good use case for each.',
  points: [
    { p: 'Short polling: periodic requests, wasteful', k: ['short polling', 'every few seconds', 'interval', 'wasteful'] },
    { p: 'Long polling: server holds request', k: ['long polling', 'hold', 'held open'] },
    { p: 'SSE: one-way server → client stream', k: ['sse', 'server-sent', 'one-way', 'one way'] },
    { p: 'WebSockets: two-way persistent', k: ['websocket', 'two-way', 'bidirectional', 'full duplex'] },
    { p: 'Use cases (chat, scores, notifications)', k: ['chat', 'score', 'notification', 'game', 'ticker', 'dashboard'] },
    { p: 'Scaling stateful connections', k: ['stateful', 'connection', 'scale', 'sticky'] }
  ],
  model: 'Short polling asks the server at fixed intervals; it is simple but wasteful and updates arrive late—fine for a dashboard refreshed every minute. Long polling keeps a request open until data is available, giving near real-time updates on any infrastructure, good for older environments. Server-Sent Events stream events one way from server to client over HTTP with auto-reconnect, ideal for live scores, notifications or streaming AI responses. WebSockets provide a persistent two-way connection with low overhead, the right choice for chat and multiplayer games; but connections are stateful, so you need a registry of which server holds each user and pub/sub between servers to scale.' },
{ id: 'l18', d: 'h', topic: 'data', title: 'Replication lag problems',
  prompt: 'You use a primary database with asynchronous read replicas. Describe two user-visible problems caused by replication lag and how to fix them.',
  points: [
    { p: 'Read-your-writes problem', k: ['read your', 'read-your', 'own write', 'missing after', 'just posted'] },
    { p: 'Monotonic reads / going back in time', k: ['monotonic', 'back in time', 'disappear', 'different replica'] },
    { p: 'Fix: read from primary after a write', k: ['read from the primary', 'read from primary', 'route to primary', 'leader'] },
    { p: 'Fix: sticky replica per user', k: ['same replica', 'sticky', 'pin'] },
    { p: 'Fix: track replication position / version', k: ['position', 'lsn', 'version', 'timestamp'] },
    { p: 'Data loss risk on failover', k: ['failover', 'data loss', 'lose'] }
  ],
  model: 'With asynchronous replicas, a user can write something and immediately read from a replica that has not caught up, so their own comment seems missing (a read-your-writes violation). Another problem is non-monotonic reads: two consecutive reads hit different replicas, so data appears and then disappears. Fixes: route a user\'s reads to the primary for a short window after they write, or track the write\'s replication position (LSN/version) and only read from replicas that have caught up; pin each user to one replica to keep reads monotonic. Also note that async replication can lose the latest writes if the primary fails before replicas receive them.' },
{ id: 'l19', d: 'm', topic: 'reliability', title: 'Observing a slow service',
  prompt: 'Users say checkout is sometimes slow. What would you measure and which tools would help you find the cause?',
  points: [
    { p: 'Latency percentiles (p95/p99)', k: ['p99', 'p95', 'percentile', 'latency'] },
    { p: 'Metrics: rate, errors, saturation', k: ['metric', 'error rate', 'saturation', 'red', 'golden'] },
    { p: 'Distributed tracing to find slow span', k: ['trac', 'span', 'opentelemetry', 'jaeger'] },
    { p: 'Structured logs with request IDs', k: ['log', 'request id', 'correlation'] },
    { p: 'Check dependencies: DB queries, pools, third parties', k: ['database', 'query', 'pool', 'third-party', 'dependency', 'payment provider'] },
    { p: 'Alerts / SLOs', k: ['alert', 'slo'] }
  ],
  model: 'I would first look at latency percentiles (p95, p99) for the checkout endpoint rather than averages, alongside request rate, error rate and saturation of resources like CPU, connection pools and queue depth. Distributed tracing with OpenTelemetry shows each span in the checkout request, so we can see whether time goes to the database, the inventory service or the payment provider. Structured logs with a shared request ID let us inspect the slow requests in detail. Typical culprits are slow queries missing an index, exhausted connection pools, or a slow third-party call without a timeout. Finally, set an SLO on checkout latency and alert on burn rate.' },
{ id: 'l20', d: 'h', topic: 'cases', title: 'Nearby drivers',
  prompt: 'Design the part of a ride-sharing app that finds nearby available drivers and assigns one to a rider.',
  points: [
    { p: 'Frequent location updates (every few seconds)', k: ['every few seconds', 'location update', 'ping', 'gps'] },
    { p: 'In-memory geo index (Redis GEO)', k: ['redis', 'in-memory', 'in memory'] },
    { p: 'Geohash / quadtree / H3 cells', k: ['geohash', 'quadtree', 'h3', 's2', 'cell', 'grid'] },
    { p: 'Search neighbor cells and rank by ETA', k: ['neighbor', 'eta', 'rank', 'distance'] },
    { p: 'Atomic driver reservation to avoid double assign', k: ['atomic', 'lock', 'double', 'reserve', 'compare'] },
    { p: 'Shard by city/region', k: ['city', 'region', 'shard'] }
  ],
  model: 'Drivers send GPS updates every few seconds, which is a very high write rate, so live positions are kept in memory, for example in Redis GEO or an in-memory index keyed by geohash or H3 cell; only samples are stored long-term. To match, the service finds the rider\'s cell and searches it plus neighboring cells for available drivers, then ranks candidates by estimated time of arrival from a routing service. The best driver is offered the trip with a short timeout. Reservation is an atomic conditional update (available → reserved) so a driver cannot be assigned twice. Since activity is local, data and services are sharded by city or region.' }
];
