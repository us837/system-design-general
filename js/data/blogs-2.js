window.BLOGS.push(
{ id: 'sql-vs-nosql', chapter: 'data', title: 'SQL vs NoSQL', body: `
> **In one line:** SQL databases store data in strict tables with relations. NoSQL databases trade some of that strictness for flexibility and easy scaling.

## Relational (SQL) databases
Data lives in **tables** with rows and columns. Tables link to each other with **keys**. You query with **SQL**.

Examples: **PostgreSQL, MySQL, SQL Server, Oracle, SQLite.**

**Strengths**
- **ACID transactions** — money moves safely.
- **Joins** — combine tables in one query.
- **Schema** — the database guards your data shape.
- Mature, well understood, great tools.

**Weaknesses**
- Harder to scale writes across many machines.
- Schema changes on huge tables can be painful.

## Non-relational (NoSQL) databases
A family of databases that do not use the table-and-join model.

Examples: **MongoDB, Cassandra, DynamoDB, Redis, Neo4j.**

**Strengths**
- **Built to scale out** across many machines.
- **Flexible shape** — no fixed schema (in many of them).
- Very fast for the access patterns they are designed for.

**Weaknesses**
- Fewer or weaker joins and transactions (varies a lot).
- You must design data around your **queries** up front.

## A note on the word "SQL"
SQL is a **language**, not a product. PostgreSQL and MySQL are both SQL databases. So the question is never "SQL or PostgreSQL" — PostgreSQL **is** a SQL database.

## How to choose
| You need | Lean toward |
|---|---|
| Money, orders, inventory, strong correctness | SQL |
| Complex queries and reporting | SQL |
| Massive write volume (logs, events, IoT) | NoSQL (wide-column) |
| Flexible, nested documents | NoSQL (document) |
| Simple lookups by key at huge scale | NoSQL (key-value) |
| Relationships many levels deep | Graph database |

> **Safe default:** When unsure, start with **PostgreSQL**. It scales further than most apps ever need, and you can add NoSQL for specific jobs later.
` },

{ id: 'nosql-types', chapter: 'data', title: 'The Four Kinds of NoSQL', body: `
> **In one line:** NoSQL comes in four main shapes: key-value, document, wide-column and graph.

## 1. Key-value stores
A giant dictionary. You give a key, you get a value.
- **Examples:** Redis, DynamoDB, Memcached, etcd.
- **Great for:** caching, sessions, shopping carts, feature flags, counters.
- **Limit:** you can only look up by key, not search inside values.

## 2. Document stores
Store JSON-like documents. Each document can have its own shape and nested fields.
- **Examples:** MongoDB, Couchbase, Firestore.
- **Great for:** product catalogs, user profiles, content management — anything with varied, nested data.
- **Limit:** joins across collections are weak.

## 3. Wide-column stores
Rows grouped by a **partition key**, with many columns that can vary per row. Built for huge write rates spread across many machines.
- **Examples:** Apache Cassandra, ScyllaDB, HBase, Google Bigtable.
- **Great for:** time series, logs, chat messages, sensor data, activity feeds.
- **Limit:** you must design tables for each query. Ad-hoc queries are hard.

## 4. Graph databases
Store **nodes** (things) and **edges** (relationships). Walking relationships is fast.
- **Examples:** Neo4j, Amazon Neptune.
- **Great for:** social networks ("friends of friends"), recommendations, fraud rings, knowledge graphs.
- **Limit:** not great for bulk analytics or simple key lookups.

## Bonus kinds
- **Time-series:** InfluxDB, TimescaleDB — metrics over time.
- **Search engines:** Elasticsearch, OpenSearch — full-text search.
- **Vector databases:** Pinecone, pgvector, Milvus — similarity search for AI embeddings.

## Polyglot persistence
Big systems use **several** databases, each for what it does best. For example: PostgreSQL for orders, Redis for sessions, Elasticsearch for search, Cassandra for activity logs.
` },

{ id: 'choosing-database', chapter: 'data', title: 'Picking a Database: A Field Guide', body: `
> **In one line:** Choose a database by your data shape, your queries, your scale and how correct the data must be.

## Four questions
1. **What does the data look like?** Tables with relations? Nested documents? Simple keys? A web of connections?
2. **How will you read it?** By ID? Complex filters? Text search? Graph walks?
3. **How much and how fast?** Writes per second, total size, growth.
4. **How strict?** Must every read be up to date? Do you need multi-row transactions?

## Popular choices
**PostgreSQL** — powerful open-source relational database. Strong transactions, rich SQL, JSON columns, extensions (PostGIS for maps, pgvector for AI). A great default.

**MySQL** — popular relational database, simple and fast for reads, huge community. Powers many large web apps.

**MongoDB** — document store. Flexible schemas, easy to start, scales with sharding.

**Cassandra** — wide-column. Masterless, writes are very fast, scales linearly, no single point of failure. Tunable consistency.

**DynamoDB** — AWS-managed key-value and document store. Predictable single-digit-millisecond latency at any scale, no servers to run.

**Redis** — in-memory key-value with data structures. Extremely fast. Mostly cache, sessions, leaderboards, rate limits, queues.

**Neo4j** — graph database for relationship-heavy queries.

**Elasticsearch** — search engine, not a primary database. Full-text and log search.

## Matching game
| Use case | Good pick |
|---|---|
| Bank transfers, orders | PostgreSQL / MySQL |
| Product catalog with varied fields | MongoDB |
| Chat history, IoT, event logs | Cassandra |
| Serverless app, key lookups at scale | DynamoDB |
| Leaderboards, sessions, rate limits | Redis |
| Friends-of-friends, fraud detection | Neo4j |
| Search box | Elasticsearch |

> **Interview tip:** Never just say "I'll use NoSQL." Name the type and the reason: "Cassandra, because we write 100K messages per second and read them by conversation ID."
` },

{ id: 'indexes', chapter: 'data', title: 'Database Indexes', body: `
> **In one line:** An index is a sorted lookup table that lets the database find rows without reading every row.

## The book analogy
To find "Kafka" in a 900-page book you do not read every page. You open the **index** at the back, find "Kafka → page 412", and jump there. A database index works the same way.

## Without an index
Query: find user with email = a@b.com. The database checks **every row** (a full table scan). With 100 million users, that is slow.

## With an index
The database keeps a sorted structure on the email column. It finds the row in a few steps — **O(log n)** instead of O(n).

## How they are built
- **B-tree (and B+tree):** the classic. Sorted, balanced tree. Great for exact matches and ranges (age between 20 and 30). Used by PostgreSQL and MySQL.
- **Hash index:** perfect for exact matches only.
- **LSM tree:** writes go to memory first, then flush to sorted files on disk. Great for heavy writes. Used by Cassandra and RocksDB.
- **Inverted index:** word → list of documents. Powers full-text search.

## The cost
Indexes are not free.
- **Slower writes:** every insert or update must also update each index.
- **More storage.**

So index the columns you **filter, join or sort by** often. Not everything.

## Composite indexes
An index on (country, city) helps queries filtering by country, or by country **and** city. It does **not** help a query on city alone. Order matters: leftmost first.

## Quick checklist
- Primary keys are indexed automatically.
- Add indexes for frequent WHERE, JOIN and ORDER BY columns.
- Use EXPLAIN to see whether a query uses an index.
- Remove indexes nobody uses.
` },

{ id: 'acid', chapter: 'data', title: 'Transactions and ACID', body: `
> **In one line:** A transaction is a group of steps that either all happen or none happen.

## The money example
Move $100 from Alice to Bob:
1. Subtract $100 from Alice.
2. Add $100 to Bob.

If the server crashes after step 1, money vanishes. A **transaction** makes both steps one unit.

## ACID
- **Atomicity — all or nothing.** If any step fails, everything rolls back.
- **Consistency — rules are kept.** Constraints (like "balance cannot be negative") are never broken.
- **Isolation — no stepping on toes.** Transactions running at the same time do not see each other's half-finished work.
- **Durability — saved means saved.** Once committed, data survives crashes (it is written to disk, usually via a write-ahead log).

## BASE: the NoSQL cousin
Many distributed NoSQL systems follow **BASE**:
- **Basically Available** — the system answers, even during trouble.
- **Soft state** — data may change as copies sync.
- **Eventually consistent** — all copies agree **eventually**.

## Which do you need?
- **ACID:** payments, orders, inventory, bookings, anything with money or limited stock.
- **BASE is fine:** likes, view counts, feeds, recommendations, analytics.

## Note
The line is blurry today. MongoDB supports multi-document ACID transactions. Google Spanner and CockroachDB give ACID across the globe. DynamoDB has transactions too. Always check the specific product.

> **Remember:** If being wrong costs money or trust, you want ACID.
` },

{ id: 'isolation-levels', chapter: 'data', title: 'Isolation Levels Made Simple', body: `
> **In one line:** Isolation levels decide how much transactions running at the same time can see of each other.

## The problems they prevent
- **Dirty read:** you read data another transaction has not committed yet. It rolls back, and you read a lie.
- **Non-repeatable read:** you read a row twice in one transaction and get different values because someone changed it in between.
- **Phantom read:** you run the same query twice and new rows appear.
- **Lost update:** two people read a value, both change it, the second save wipes the first.

## The four standard levels
| Level | Dirty | Non-repeatable | Phantom |
|---|---|---|---|
| Read Uncommitted | possible | possible | possible |
| Read Committed | prevented | possible | possible |
| Repeatable Read | prevented | prevented | possible* |
| Serializable | prevented | prevented | prevented |

*PostgreSQL's repeatable read also prevents phantoms in practice.

Stronger isolation = fewer weird bugs, but **slower** (more locking or more aborted retries).

## Defaults
- PostgreSQL: **Read Committed**.
- MySQL (InnoDB): **Repeatable Read**.

## Two ways to handle conflicts
- **Pessimistic locking:** lock the row first ("SELECT ... FOR UPDATE"). Others wait. Good when conflicts are common, like booking the last seat.
- **Optimistic locking:** do not lock. Keep a **version number**. On save, check the version is unchanged; if it changed, retry. Good when conflicts are rare.

## Example: the last concert ticket
Two users click "buy" at the same moment. Without care, both get the seat. Fix: lock the seat row, or use a conditional update like "UPDATE seats SET owner = me WHERE id = 7 AND owner IS NULL" and check that exactly one row changed.
` },

{ id: 'replication', chapter: 'data', title: 'Replication: Keeping Copies', body: `
> **In one line:** Replication keeps copies of the same data on several machines for safety and speed.

## Why copy data?
- **Survive failures:** a machine dies, another has the data.
- **Scale reads:** many copies can answer read queries.
- **Be close to users:** a copy in each region.

## Leader–follower (primary–replica)
- One **leader** takes all writes.
- **Followers** copy changes from the leader and serve reads.
- If the leader dies, a follower is **promoted** (failover).

This is the most common setup (PostgreSQL, MySQL, MongoDB replica sets).

## Sync vs async replication
- **Synchronous:** leader waits until a follower confirms. No data loss, but slower writes.
- **Asynchronous:** leader confirms immediately, followers catch up. Fast, but if the leader dies, the latest writes may be lost.
- Many systems use **semi-sync**: wait for one follower, not all.

## Replication lag
Async followers are a little behind. A user posts a comment, refreshes, reads from a follower, and the comment is missing. Fix: **read-your-own-writes** — read from the leader for a short time after a user writes.

## Multi-leader
Several leaders accept writes (for example one per region). Good for global apps, but two leaders can change the same data at once: **write conflicts**. You need rules like "last write wins" or merge logic.

## Leaderless
Any node accepts writes (Cassandra, DynamoDB-style). Uses **quorums**: write to W nodes, read from R nodes. If W + R > N (total copies), reads overlap with the latest write.

## Replication is not backup
If someone deletes a table, replication happily deletes it everywhere. You still need **backups**.
` },

{ id: 'sharding', chapter: 'data', title: 'Sharding: Splitting Data', body: `
> **In one line:** Sharding splits one big dataset across many databases, each holding a part.

## Why
Replication copies **all** data to each machine. That helps reads, but every machine still stores everything and the leader still takes every write. When data or writes outgrow one machine, you **split** it.

## Sharding strategies
**1. Range-based** — users A–M on shard 1, N–Z on shard 2.
- Good for range queries.
- Risk: **hot spots** (lots of names start with S).

**2. Hash-based** — shard = hash(user_id) mod N.
- Spreads data evenly.
- Range queries become hard. Changing N moves almost every key (fixed by **consistent hashing**).

**3. Directory-based** — a lookup table says which shard holds each key.
- Very flexible.
- The directory is extra work and must be highly available.

**4. Geographic** — EU users on EU shards. Helps latency and data laws.

## Choosing the shard key
The most important decision. A good key:
- Spreads data and traffic **evenly**.
- Keeps data that is read together **on the same shard**.

Example: chat app → shard by **conversation_id**, so one conversation's messages sit together.

## The pain of sharding
- **Cross-shard queries** must ask many shards and merge results.
- **Cross-shard transactions** are hard.
- **Rebalancing** when adding shards is work.
- **Hot keys** (a celebrity) can still overload one shard.

## Before you shard
Try these first: better indexes, caching, read replicas, a bigger machine. Shard when you truly must. Many managed databases (DynamoDB, Cassandra, MongoDB, Vitess, CockroachDB) shard for you.
` },

{ id: 'consistent-hashing', chapter: 'data', title: 'Consistent Hashing', body: `
> **In one line:** Consistent hashing places servers and keys on a ring so that adding or removing a server moves only a few keys.

## The problem with "hash mod N"
With 4 cache servers: server = hash(key) mod 4. Add a 5th server, now it is mod 5, and **almost every key** maps to a different server. The whole cache goes cold at once and the database melts.

## The ring
1. Imagine a circle of numbers, 0 to 2^32.
2. Hash each **server** to a point on the circle.
3. Hash each **key** to a point on the circle.
4. A key belongs to the **first server clockwise** from it.

## Adding a server
A new server lands somewhere on the ring. It takes over only the keys between itself and the previous server. Everything else stays put. On average only **1/N** of keys move.

## Removing a server
Its keys move to the next server clockwise. Others are untouched.

## Virtual nodes
With few servers, the ring can be lumpy: one server gets a huge arc. Fix: give each server **many points** (say 100 virtual nodes) on the ring. Load spreads evenly, and a stronger machine can get more virtual nodes.

## Where it is used
- Distributed caches (Memcached client libraries)
- Cassandra and DynamoDB data placement
- Load balancers for sticky routing
- CDNs

## Replication on the ring
To keep 3 copies, store the key on the first **3 distinct servers** clockwise.

> **Interview tip:** Whenever you shard a cache or a key-value store, mention consistent hashing and virtual nodes.
` },

{ id: 'data-modeling', chapter: 'data', title: 'Normalization vs Denormalization', body: `
> **In one line:** Normalization removes duplicate data. Denormalization adds duplicates on purpose to make reads fast.

## Normalized
Each fact lives in **one place**.
- users table: id, name
- posts table: id, user_id, text

To show a post with the author name, you **join** posts with users.

**Good:** no duplicates, updates happen once, data stays correct.
**Bad:** joins cost time, especially across many tables or shards.

## Denormalized
Copy data where it is read.
- posts table: id, user_id, **user_name**, text

**Good:** one fast read, no join.
**Bad:** if a user changes their name, you must update every post. Data can drift out of sync.

## When to denormalize
- Read-heavy systems (100 reads per write).
- Sharded or NoSQL databases where joins are hard or impossible.
- Precomputed views: like counts, feeds, leaderboards.

## Model around queries (NoSQL)
In Cassandra or DynamoDB you design the tables from your **queries**:
1. List every query the app makes.
2. Make a table (or index) per query.
3. Accept duplicated data.

Example: "get messages for a conversation, newest first" → partition key = conversation_id, sort key = timestamp.

## Materialized views
A stored, precomputed query result. The database (or a background job) keeps it updated. You get join-free reads without hand-copying data everywhere.

> **Rule of thumb:** Normalize for correctness first. Denormalize where measurements prove reads are too slow.
` },

{ id: 'object-storage', chapter: 'data', title: 'Object Storage for Files', body: `
> **In one line:** Object storage keeps big files (photos, videos, backups) cheaply and safely, addressed by a key.

## Why not put files in the database?
Databases are built for small, structured rows. A 200 MB video inside a database is slow, expensive and bloats backups.

## Object storage
Services like **Amazon S3, Google Cloud Storage, Azure Blob Storage** (and open-source MinIO).
- You store an **object** (the file bytes plus metadata) under a **key** like videos/2026/abc.mp4.
- Nearly unlimited space.
- Very **durable**: S3 is designed for 99.999999999% (eleven nines) durability by keeping copies across devices and buildings.
- Cheap per GB, with cheaper "cold" tiers for rarely used data.

## The standard pattern
1. File bytes go to **object storage**.
2. **Metadata** (owner, title, size, key) goes to the **database**.
3. A **CDN** sits in front of object storage for fast downloads.

## Direct uploads with pre-signed URLs
Do not stream big uploads through your app servers. Instead:
1. Client asks your API: "I want to upload."
2. API returns a **pre-signed URL**, a temporary link with permission to upload one object.
3. Client uploads **directly** to object storage.
4. Storage triggers an event; a worker processes the file (thumbnails, transcoding).

Your servers stay light.

## Block and file storage
- **Block storage** (like AWS EBS): raw disks attached to one machine. Databases use it.
- **File storage** (like NFS, AWS EFS): a shared folder many machines can mount.
- **Object storage**: HTTP API, huge scale, for blobs.

> **Interview tip:** Photos, videos, documents → object storage + CDN, metadata in a database. Every time.
` },

{ id: 'search', chapter: 'data', title: 'Search and the Inverted Index', body: `
> **In one line:** Search engines use an inverted index — a map from each word to the documents that contain it.

## Why LIKE is not enough
A query like "WHERE title LIKE '%pizza%'" must scan every row. It cannot rank results, handle typos, or match "pizzas" to "pizza".

## The inverted index
Take three documents:
1. "cheap pizza near me"
2. "best pizza oven"
3. "cheap flights"

Build:
| Word | Documents |
|---|---|
| cheap | 1, 3 |
| pizza | 1, 2 |
| oven | 2 |
| flights | 3 |

Search "cheap pizza" → intersect lists → document 1. Instant, even with billions of documents.

## Text processing
Before indexing, text is cleaned:
- **Tokenize:** split into words.
- **Lowercase.**
- **Remove stop words:** "the", "a".
- **Stemming:** "running" → "run".

## Ranking
Results are scored. Classic method: **TF-IDF / BM25** — words that appear often in this document but rarely overall matter most. Modern systems add popularity, freshness, personalization, and **semantic (vector) search**.

## Tools
**Elasticsearch / OpenSearch**, Apache Solr, Algolia, Meilisearch, Typesense.

## How it fits in a design
The database is the **source of truth**. Changes flow to the search index, often through a queue or **change data capture (CDC)**. The search index can be a little behind — that is usually fine.

~~~
App → Database → (CDC / queue) → Indexer → Elasticsearch ← Search API
~~~
` }
);
