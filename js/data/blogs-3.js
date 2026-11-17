window.BLOGS.push(
{ id: 'cap', chapter: 'distributed', title: 'The CAP Theorem', body: `
> **In one line:** When the network between your servers breaks, you must choose: stay consistent or stay available.

## The three letters
- **C — Consistency:** every read gets the latest write (or an error).
- **A — Availability:** every request gets a non-error answer (maybe not the latest).
- **P — Partition tolerance:** the system keeps going even when messages between nodes are lost.

## The real meaning
In a distributed system, network **partitions will happen**. Cables fail, switches die. So P is not optional.

When a partition happens, you choose:
- **CP:** refuse some requests to avoid giving stale or conflicting data.
- **AP:** answer every request, even if some answers are stale, and fix things up later.

When there is **no** partition, you can have both C and A.

## A tiny story
Two bank servers, New York and London. The cable between them breaks. A user in London asks for their balance.
- **CP choice:** "Sorry, try again later." (Correct, but unavailable.)
- **AP choice:** "Your balance is $500." (Available, but might be outdated.)

## Who picks what
- **CP-leaning:** banking systems, HBase, MongoDB (default settings), etcd, ZooKeeper, Spanner.
- **AP-leaning:** Cassandra, DynamoDB (default), DNS, shopping carts, social feeds.

Many databases let you **tune** the choice per query.

## How to use CAP in a design
Ask: "What is worse for this feature — showing old data, or showing an error?"
- A like count that is 2 seconds old? Fine → **AP**.
- Selling the same seat twice? Terrible → **CP**.

> **Remember:** CAP is about behavior **during a partition**. Different parts of one system can make different choices.
` },

{ id: 'consistency-models', chapter: 'distributed', title: 'Consistency Models and PACELC', body: `
> **In one line:** A consistency model is a promise about how fresh the data you read will be.

## From strongest to weakest
**Strong (linearizable) consistency** — after a write finishes, every reader sees it. Like one single copy. Simple to reason about, but slower and less available.

**Sequential consistency** — everyone sees operations in the same order, though maybe not instantly.

**Causal consistency** — things that are related appear in order. You will never see a reply before the comment it answers.

**Read-your-writes** — you always see your own changes, even if others see them later.

**Monotonic reads** — once you see a value, you never go back in time to an older one.

**Eventual consistency** — if writes stop, all copies will **eventually** match. In the meantime, readers might see old data.

## PACELC: CAP's smarter sibling
CAP only talks about partitions. PACELC adds the normal case:

**If Partition → choose Availability or Consistency. Else → choose Latency or Consistency.**

Even on a healthy day, waiting for copies to agree takes time. So:
- **PA/EL:** Cassandra, DynamoDB defaults — fast and available, eventually consistent.
- **PC/EC:** Spanner, traditional sharded SQL with sync replicas — consistent, pays with latency.

## Picking per feature
| Feature | Model |
|---|---|
| Bank balance during transfer | Strong |
| Seeing your own profile edit | Read-your-writes |
| Chat replies in order | Causal |
| Follower counts, likes | Eventual |

> **Interview tip:** Say which model each part needs. "Feeds can be eventually consistent; payments must be strongly consistent."
` },

{ id: 'quorum', chapter: 'distributed', title: 'Quorums: Majority Rules', body: `
> **In one line:** A quorum is the minimum number of copies that must agree for a read or write to count.

## Setup
You keep **N** copies of each piece of data (often N = 3).
- A write succeeds when **W** copies confirm it.
- A read asks **R** copies and takes the newest answer.

## The magic rule
**If W + R > N, every read overlaps with the latest write.**

With N = 3, W = 2, R = 2: any 2 copies you read must share at least one copy with the 2 you wrote. So you always see the latest value.

## Tuning the knobs
| Setting | Effect |
|---|---|
| W = N, R = 1 | Fast reads, slow and fragile writes |
| W = 1, R = N | Fast writes, slow reads |
| W = 2, R = 2 (N=3) | Balanced, tolerates 1 failure |
| W = 1, R = 1 | Fastest, but may read stale data |

## Majority quorum
A **majority** is more than half: 2 of 3, 3 of 5. Any two majorities always overlap. This is why clusters use **odd numbers** of nodes — 5 nodes survive 2 failures; 6 nodes still only survive 2.

## Where you see it
- Cassandra lets you choose ONE, QUORUM or ALL per query.
- DynamoDB-style systems use it.
- Consensus algorithms (Raft, Paxos) need a majority to commit.

## Sloppy quorum and hinted handoff
If some home nodes are down, a sloppy quorum lets **other nodes** take the write temporarily and hand it back later. Better availability, weaker guarantees.
` },

{ id: 'consensus', chapter: 'distributed', title: 'Consensus and Leader Election', body: `
> **In one line:** Consensus is how a group of servers agrees on one value, even when some of them fail.

## Why it is hard
Messages get delayed. Servers crash. A slow server looks just like a dead one. Yet the group must agree on things like **"who is the leader?"** or **"what is the next entry in the log?"**

## Raft in plain words
Raft is the most popular, easy-to-understand consensus algorithm.

1. **Roles:** every node is a **follower**, **candidate** or **leader**.
2. **Heartbeats:** the leader sends regular "I'm alive" messages.
3. **Election:** if a follower hears nothing for a random timeout, it becomes a candidate and asks for votes. A node that gets a **majority** becomes leader for a new **term**.
4. **Log replication:** clients send writes to the leader. The leader copies the entry to followers. Once a **majority** has it, the entry is **committed**.
5. **Safety:** a node with an outdated log cannot win an election.

Random timeouts make split votes rare.

## Split brain
The danger: two nodes both think they are leader and accept conflicting writes. Majority voting prevents it — only one side of a network split can have a majority. Old leaders are fenced off using the **term number** (a fencing token).

## Where consensus lives
You rarely write it yourself. You use:
- **etcd** (Raft) — Kubernetes stores its state here.
- **ZooKeeper** (ZAB) — used by older Kafka, HBase.
- **Consul** (Raft) — service discovery.
- Databases like CockroachDB, TiDB and Kafka (KRaft) use Raft inside.

## What you use it for
- Leader election
- Distributed locks
- Configuration storage
- Service discovery
` },

{ id: 'clocks', chapter: 'distributed', title: 'Time, Clocks and Ordering', body: `
> **In one line:** In distributed systems, machine clocks disagree, so we use logical clocks to order events.

## Why wall clocks fail
Each server's clock drifts. Even with NTP syncing, clocks can differ by milliseconds or more, and can even jump backwards. So "the event with the bigger timestamp happened later" is **not** safe across machines.

## Last-write-wins and its danger
Many systems resolve conflicts with **last write wins (LWW)** using timestamps. If clocks are skewed, an older write can beat a newer one and data is silently lost. Fine for some data (a profile photo), bad for others (a bank balance).

## Lamport clocks
A simple counter per node:
- Increment before each event.
- Send the counter with every message.
- On receiving, set your counter to max(yours, received) + 1.

This gives an order consistent with cause and effect: if A caused B, A's number is smaller.

## Vector clocks
Each node keeps a counter **for every node**. By comparing vectors you can tell if two events are **ordered** or **concurrent** (a real conflict). Used to detect conflicts in systems like early Dynamo and Riak.

## Hybrid logical clocks and TrueTime
- **Hybrid logical clocks** mix physical time and a counter. Used by CockroachDB, MongoDB.
- **Google TrueTime** uses GPS and atomic clocks to give a time **interval** with known uncertainty. Spanner waits out that uncertainty to give global strong consistency.

## Practical advice
- Do not trust timestamps from different machines for strict ordering.
- Use a single sequencer (a database sequence, a Kafka partition offset) when order matters.
- Use **version numbers** for optimistic concurrency.
` },

{ id: 'idempotency', chapter: 'distributed', title: 'Idempotency: Safe to Retry', body: `
> **In one line:** An idempotent operation gives the same result whether you do it once or ten times.

## Why it matters
Networks fail. A client sends "charge $50", the server charges the card, but the reply is lost. The client sees a timeout and **retries**. Without care, the user pays $100.

In distributed systems, **retries are everywhere**: clients, load balancers, queues. So operations must be safe to repeat.

## Naturally idempotent
- **GET** — reading does not change anything.
- **PUT** — "set name to Ana" twice is still "Ana".
- **DELETE** — deleting twice leaves it deleted.
- "Set status = shipped".

## Not idempotent
- **POST** to create — two calls make two orders.
- "Add $50", "increment counter".

## Idempotency keys
The standard fix for payments and orders:
1. The client generates a unique key (a UUID) per action.
2. It sends the key with the request, for example in an Idempotency-Key header.
3. The server stores the key with the result.
4. If the same key comes again, the server returns the **saved result** instead of doing the work twice.

Stripe's API works this way.

## Other techniques
- **Unique constraints** in the database (one row per order_id).
- **Conditional updates:** "update only if version = 7".
- **Deduplication tables** for message consumers: record processed message IDs.

## With message queues
Most queues deliver **at least once**, so a consumer may see the same message twice. Make consumers idempotent and "exactly once" becomes "**effectively** once".

> **Interview tip:** Any time money or orders appear, say "idempotency key". It is one of the most valued details.
` },

{ id: 'distributed-transactions', chapter: 'distributed', title: 'Distributed Transactions: 2PC and Sagas', body: `
> **In one line:** When one action touches several services or databases, you need a plan to keep them all in agreement.

## The problem
Booking a trip: reserve a flight (Flight service), a hotel (Hotel service) and charge the card (Payment service). Each has its own database. A normal transaction cannot span all three.

## Two-Phase Commit (2PC)
A **coordinator** runs two rounds:
1. **Prepare:** "Can you commit?" Each participant locks its data and votes yes or no.
2. **Commit:** if all said yes, "Commit!" Otherwise, "Abort!"

**Good:** strong, all-or-nothing.
**Bad:** slow, holds locks, and if the coordinator dies mid-way, participants can be **stuck** waiting. Rare in modern microservices.

## Saga pattern
Break the big action into **local steps**. Each step has a **compensating action** that undoes it.

1. Reserve flight → (undo: cancel flight)
2. Reserve hotel → (undo: cancel hotel)
3. Charge card → (undo: refund)

If step 3 fails, run the undos for 2 and 1.

**Two styles:**
- **Choreography:** each service listens for events and reacts. No central boss. Simple at first, hard to follow when large.
- **Orchestration:** a central orchestrator tells each service what to do next. Easier to understand and monitor. Tools: Temporal, AWS Step Functions.

**Trade-off:** sagas are **eventually consistent**. For a moment, the flight is booked but the payment is not. Your design must tolerate that.

## The outbox pattern
A common bug: you save to the database and then publish an event, but the publish fails. Fix: write the event into an **outbox table in the same local transaction**, and a separate process sends outbox rows to the queue. Now the database and the event can never disagree.
` },

{ id: 'unique-ids', chapter: 'distributed', title: 'Generating Unique IDs at Scale', body: `
> **In one line:** In a distributed system, you need IDs that are unique across many machines without asking one central counter every time.

## Why auto-increment breaks
A single database counter (1, 2, 3...) is simple, but with many shards each would generate the same numbers. And one central counter is a bottleneck and a single point of failure.

## Options
**UUID (v4)** — 128-bit random number.
- Generated anywhere, no coordination.
- Not sortable by time. Big. Random inserts can slow B-tree indexes.
- **UUIDv7** fixes the sort problem by putting a timestamp first.

**Database ticket server** — a dedicated database hands out ranges.
- Simple, numeric.
- Must be highly available.

**Range allocation** — each server grabs a block (1–1000, 1001–2000) and hands out IDs locally. Fast, few coordination calls.

**Snowflake (Twitter style)** — 64-bit ID made of:
| Bits | Part |
|---|---|
| 1 | Sign (unused) |
| 41 | Timestamp in milliseconds (about 69 years) |
| 10 | Machine ID (1,024 machines) |
| 12 | Sequence (4,096 per ms per machine) |

- Roughly **sortable by time**.
- Fits in a 64-bit integer.
- Generated locally — no network call.
- Needs reasonably synced clocks.

## Choosing
| Need | Pick |
|---|---|
| Simple, globally unique | UUID |
| Time-sortable, compact, huge scale | Snowflake or UUIDv7 |
| Short public IDs (URL shortener) | Counter or range + Base62 encoding |

## Base62
Turn a number into a short string with 0–9, a–z, A–Z. Seven Base62 characters give 62^7 ≈ **3.5 trillion** combinations. Perfect for short links.
` }
);

window.BLOGS.push(
{ id: 'message-queues', chapter: 'async', title: 'Message Queues', body: `
> **In one line:** A message queue lets one part of a system drop off work for another part to do later.

## The restaurant analogy
The waiter does not cook. They pin an order ticket on the rail and go back to customers. Cooks take tickets when ready. The rail is a **queue**.

## How it works
- A **producer** sends a message to the queue.
- The queue stores it safely.
- A **consumer** takes the message and processes it.
- The consumer **acknowledges** (acks) it, and the queue deletes it.

## Why use a queue
- **Decoupling:** producer and consumer do not need to know each other or be up at the same time.
- **Absorb spikes:** a sudden burst of 100,000 orders waits in the queue instead of crashing the workers.
- **Faster responses:** the API replies "accepted" immediately; slow work (emails, video processing) happens in the background.
- **Scale workers independently:** queue growing? Add more consumers.
- **Retry on failure:** if a consumer crashes before acking, the message is delivered again.

## Dead letter queue (DLQ)
A message that keeps failing (a "poison message") is moved to a separate **dead letter queue** after a few tries, so it does not block everything. Engineers inspect it later.

## Back pressure
If consumers cannot keep up, the queue grows. Watch the **queue depth**. Add consumers, or slow producers down.

## Products
- **RabbitMQ** — classic broker, flexible routing.
- **Amazon SQS** — fully managed, simple.
- **Kafka** — a distributed log; great for streams (next lesson).
- **Redis streams / lists** — lightweight queues.

## Common uses
Sending emails, resizing images, transcoding video, generating reports, processing payments, fan-out of notifications.
` },

{ id: 'kafka-pubsub', chapter: 'async', title: 'Pub/Sub and Event Streaming (Kafka)', body: `
> **In one line:** In pub/sub, one message is broadcast to every interested subscriber. Kafka stores those messages as a durable, replayable log.

## Queue vs pub/sub
- **Queue (point-to-point):** each message goes to **one** consumer. Splitting work.
- **Pub/sub:** each message goes to **every** subscriber group. Broadcasting events.

Example: "OrderPlaced" is published once. The email service, the inventory service and the analytics service each receive it.

## Kafka basics
- **Topic:** a named stream of events, like "orders".
- **Partition:** a topic is split into partitions for scale. Order is guaranteed **within** a partition.
- **Offset:** the position of a message in a partition.
- **Producer** writes to a topic. A **key** (like user_id) decides the partition, so all events for one user stay in order.
- **Consumer group:** consumers in a group share the partitions. Each partition goes to one consumer in the group. Different groups each get **all** messages.
- **Retention:** messages are kept for days or forever, even after being read. Consumers can **replay** from any offset.
- **Replication:** each partition is copied to several brokers.

## Why Kafka is everywhere
- Huge throughput (millions of events per second).
- Durable and replayable.
- Feeds many systems from one source: search indexes, caches, analytics, data lakes.

## Parallelism rule
Max consumers working in parallel in one group = **number of partitions**. Plan partitions for future scale.

## Alternatives
Apache Pulsar, Amazon Kinesis, Google Pub/Sub, Redpanda, NATS.
` },

{ id: 'delivery-semantics', chapter: 'async', title: 'At-Most, At-Least, Exactly Once', body: `
> **In one line:** Delivery semantics describe whether a message can be lost, duplicated, or neither.

## At-most-once
Send and forget. The consumer acks **before** processing.
- If it crashes mid-way, the message is **lost**.
- Never duplicated.
- Okay for: metrics, logs where a tiny loss is fine.

## At-least-once
The consumer acks **after** processing.
- If it crashes after processing but before acking, the message is delivered **again**.
- Never lost, but may be **duplicated**.
- The most common choice. Make consumers **idempotent**.

## Exactly-once
Each message affects the result exactly one time.
- True exactly-once delivery across a network is impossible in general.
- What systems offer is **exactly-once processing** (effectively once): at-least-once delivery + deduplication or transactions.
- Kafka supports this within Kafka (idempotent producers + transactions).

## How to get "effectively once" yourself
1. Every message has a **unique ID**.
2. The consumer records processed IDs (or uses a unique constraint).
3. Duplicates are detected and skipped.
4. Better: update the result and record the ID in the **same transaction**.

## Ordering
- Global ordering is expensive.
- Usually you need order **per entity** (per user, per order). Use a partition key so related messages go to the same partition.

| Semantic | Lost? | Duplicated? | Use for |
|---|---|---|---|
| At-most-once | Maybe | No | Metrics |
| At-least-once | No | Maybe | Most things |
| Exactly-once | No | No | Payments, counters (with effort) |
` },

{ id: 'realtime', chapter: 'async', title: 'Real-Time: Polling, WebSockets, SSE', body: `
> **In one line:** To push live updates to users, you can poll, long-poll, stream with SSE, or open a two-way WebSocket.

## Short polling
The client asks every few seconds: "Anything new?"
- Simple.
- Wasteful: most answers are "no". Updates arrive late (up to the interval).

## Long polling
The client asks, and the server **holds** the request open until there is news (or a timeout). Then the client asks again.
- Near real-time.
- Works everywhere.
- Each update costs a new request.

## Server-Sent Events (SSE)
One long HTTP connection where the **server streams** events to the client.
- Simple, built into browsers, auto-reconnects.
- **One direction only** (server → client).
- Great for: live scores, notifications, stock tickers, streaming AI responses.

## WebSockets
A persistent, **two-way** connection. Both sides send whenever they want.
- True real-time, low overhead per message.
- Great for: chat, multiplayer games, collaborative editing.
- **Stateful:** each server holds many open connections. Harder to load balance and scale.

## Scaling WebSockets
- Use a load balancer that supports long-lived connections.
- Keep a mapping of **which user is connected to which server** (often in Redis).
- When a message for user B arrives at server 1, but B is on server 7, route it through **pub/sub** (Redis pub/sub, Kafka) to server 7.

## Choosing
| Need | Pick |
|---|---|
| Updates every minute are fine | Short polling |
| Server → client stream | SSE |
| Two-way, low latency | WebSockets |
| Must work behind strict old proxies | Long polling |

## Push notifications
When the app is closed, use **APNs** (Apple) or **FCM** (Google) to reach the device.
` },

{ id: 'batch-stream', chapter: 'async', title: 'Batch vs Stream Processing', body: `
> **In one line:** Batch processing handles a big pile of data at once. Stream processing handles each event as it arrives.

## Batch processing
Collect data, then process it all on a schedule (every hour, every night).
- **Example:** nightly sales report, monthly invoices, training a recommendation model.
- **Tools:** Apache Spark, Hadoop MapReduce, dbt, data warehouses (BigQuery, Snowflake, Redshift).
- **Good:** simple, efficient for huge volumes, easy to rerun.
- **Bad:** results are hours old.

## MapReduce in one breath
- **Map:** split the data and process pieces in parallel (count words in each file).
- **Shuffle:** group results by key.
- **Reduce:** combine each group (sum the counts).

## Stream processing
Process each event within seconds or milliseconds.
- **Example:** fraud detection on each card swipe, live dashboards, trending hashtags.
- **Tools:** Apache Flink, Kafka Streams, Spark Structured Streaming.
- **Good:** fresh results.
- **Bad:** harder — late events, out-of-order data, state management.

## Windows
Streams use **windows** to group events:
- **Tumbling:** fixed, non-overlapping (every 1 minute).
- **Sliding:** overlapping (last 5 minutes, updated every minute).
- **Session:** grouped by activity gaps.

## Lambda and Kappa
- **Lambda architecture:** run both a batch layer (accurate) and a speed layer (fast), merge results. Powerful but two codebases.
- **Kappa architecture:** everything is a stream; to recompute, replay the log. Simpler.

## Data warehouse vs data lake
- **Warehouse:** clean, structured tables for analytics (Snowflake, BigQuery).
- **Lake:** raw files of any kind in object storage. **Lakehouse** formats (Iceberg, Delta Lake) add tables on top.
` },

{ id: 'event-driven', chapter: 'async', title: 'Event-Driven Design, CQRS, Event Sourcing', body: `
> **In one line:** In event-driven systems, services announce what happened, and others react — instead of calling each other directly.

## Commands vs events
- **Command:** "Do this." (ChargeCard) — sent to one service.
- **Event:** "This happened." (OrderPlaced) — anyone can listen.

## Why event-driven
- Services are **loosely coupled**. The order service does not need to know the email service exists.
- Adding a new feature = adding a new listener. No changes to the producer.
- Natural fit for async work and audit trails.

**Downsides:** harder to trace a full flow, eventual consistency, need good monitoring.

## CQRS
**Command Query Responsibility Segregation** — use **separate models** for writing and reading.
- The **write side** handles commands with a normalized model and rules.
- The **read side** keeps denormalized views shaped for queries.
- Events keep the read side updated.

Use it when reads and writes have very different shapes or scale. Do not use it for simple CRUD apps — it adds complexity.

## Event sourcing
Instead of storing the **current state**, store **every event** that ever happened. The current state is computed by replaying events.

Bank account example:
1. Opened
2. Deposited 100
3. Withdrew 30

Balance = 70. You never overwrite; you append.

**Good:** full history and audit, time travel ("what was the state last Tuesday?"), rebuild new views from old events.
**Bad:** more complex, events are forever (schema changes are hard), need **snapshots** so replay stays fast.

## Change Data Capture (CDC)
Read the database's change log (like PostgreSQL WAL or MySQL binlog) and turn each change into an event. Tools: **Debezium**. Lets you get events without changing app code.
` }
);
