window.BLOGS.push(
{ id: 'monolith-microservices', chapter: 'patterns', title: 'Monolith vs Microservices', body: `
> **In one line:** A monolith is one big app. Microservices split the app into small services that talk over the network.

## Monolith
All features — users, orders, payments — live in **one codebase** and deploy as **one unit**.

**Good**
- Simple to build, test, deploy and debug.
- Function calls are fast; transactions are easy.
- Perfect for small teams and new products.

**Bad**
- As it grows, builds get slow and changes get risky.
- You scale everything together, even if only one part is busy.
- One bug can crash the whole thing.

## Microservices
Each service owns **one business capability** and **its own data**, deploys independently, and talks via APIs or events.

**Good**
- Teams work and deploy independently.
- Scale only the busy parts.
- Different tech per service when it helps.
- A failure can be contained.

**Bad**
- Network calls are slow and can fail.
- Distributed transactions, data consistency, tracing — all harder.
- Needs strong DevOps: CI/CD, monitoring, service discovery.

## The modular monolith
A middle path: one deployable app, but with **strict internal modules** and boundaries. Many teams start here and split out services only when a clear need appears.

## How to split
- Split by **business domain** (orders, catalog, payments), not by technical layer.
- Each service owns its database. **No sharing tables** between services.
- Prefer **async events** between services to reduce tight coupling.

## Warning signs
A "distributed monolith" is the worst of both worlds: many services that must all be deployed together because they are tightly linked.

> **Rule of thumb:** Start with a monolith. Move to microservices when team size and scale make the monolith painful — not before.
` },

{ id: 'service-discovery', chapter: 'patterns', title: 'Service Discovery and Service Mesh', body: `
> **In one line:** Service discovery is how services find each other's current addresses in a constantly changing system.

## The problem
In the cloud, servers come and go. Containers restart with new IPs. Hard-coding "orders service is at 10.0.3.7" breaks quickly.

## The registry
A **service registry** keeps a live list: service name → healthy instances.
- Services **register** when they start and send heartbeats.
- Dead instances are removed.
- Examples: **Consul, etcd, ZooKeeper, Eureka**, and Kubernetes' built-in DNS.

## Two styles
- **Client-side discovery:** the caller asks the registry and picks an instance itself.
- **Server-side discovery:** the caller talks to a load balancer or DNS name; it looks up the registry. Kubernetes Services work this way.

## Service mesh
As services multiply, every one needs retries, timeouts, TLS, metrics and tracing. A **service mesh** moves all of that out of your code into a **sidecar proxy** next to each service.
- Examples: **Istio, Linkerd** (often using **Envoy** proxies).
- Gives: mutual TLS between services, traffic splitting for canaries, retries, circuit breaking, uniform metrics.
- Cost: more moving parts and some latency.

## Configuration management
Related need: a central place for settings and feature flags (Consul KV, etcd, AWS AppConfig, LaunchDarkly), so you can change behavior without redeploying.
` },

{ id: 'rate-limiting', chapter: 'patterns', title: 'Rate Limiting', body: `
> **In one line:** A rate limiter caps how many requests a client can make in a time window.

## Why
- Stop abuse and brute-force login attempts.
- Protect the system from overload.
- Keep things fair between customers.
- Control costs (for example, calls to a paid AI model).

When the limit is hit, return **HTTP 429 Too Many Requests**, ideally with a Retry-After header.

## Algorithms
**Token bucket** — a bucket holds tokens, refilled at a steady rate. Each request takes a token. Empty bucket → reject. Allows short **bursts**. The most popular (used by AWS, Stripe).

**Leaky bucket** — requests enter a queue that drains at a fixed rate. Smooth output, no bursts.

**Fixed window counter** — count requests per minute window. Simple, but a burst at the edge of two windows can allow double the limit.

**Sliding window log** — store timestamps of each request, count those in the last 60 s. Accurate, but uses memory.

**Sliding window counter** — blend the current and previous window counts by weight. Accurate enough and cheap. A great practical choice.

## Where to put it
- At the **API gateway** or load balancer (most common).
- In a middleware inside each service.
- At the client (be polite), but never trust it alone.

## Distributed rate limiting
With many servers, counts must be shared. Usually **Redis**: atomic INCR with expiry, or a Lua script for token bucket. Watch out for race conditions — use atomic operations.

## Limit by what?
User ID, API key, IP address, or endpoint. Often several layers: per-IP for anonymous traffic, per-user for logged-in traffic, plus a global safety limit.
` },

{ id: 'resilience', chapter: 'patterns', title: 'Timeouts, Retries and Circuit Breakers', body: `
> **In one line:** Expect every network call to fail sometimes, and stop one failure from spreading.

## Timeouts
Never wait forever. A call without a timeout can hang a thread, then all threads, then the whole service. Set a timeout on **every** remote call.

## Retries with backoff and jitter
Many failures are brief. Retrying helps — if done right:
- **Exponential backoff:** wait 100 ms, 200 ms, 400 ms, 800 ms...
- **Jitter:** add randomness so thousands of clients do not retry at the same instant.
- **Limit retries:** 3 attempts, not infinite.
- Only retry **idempotent** operations (or use idempotency keys).

Bad retries cause a **retry storm**: a struggling service gets 3× the traffic and collapses.

## Circuit breaker
Like the breaker in your house.
- **Closed:** calls flow normally. Count failures.
- **Open:** too many failures → stop calling the broken service for a while. Fail fast or use a fallback.
- **Half-open:** after a pause, let a few test calls through. If they succeed, close again.

This gives the sick service time to recover and keeps your threads free.

## Bulkheads
Ships have walls so one leak does not sink the whole ship. In software: separate thread pools or connection pools per dependency, so a slow payment service cannot use up the threads that serve product pages.

## Fallbacks and graceful degradation
When something fails, give a reduced experience instead of an error:
- Show cached recommendations, or popular items, if personalization is down.
- Hide the reviews section if the review service is slow.

## Load shedding
When overloaded, **reject** some low-priority requests early so high-priority ones succeed.
` },

{ id: 'bloom-filters', chapter: 'patterns', title: 'Bloom Filters and Friends', body: `
> **In one line:** A Bloom filter quickly answers "definitely not here" or "probably here" using very little memory.

## How it works
- A bit array (all zeros) and a few hash functions.
- **Add** an item: hash it with each function, set those bits to 1.
- **Check** an item: hash it; if **any** bit is 0, it is **definitely not** in the set. If all are 1, it is **probably** in the set.

There can be **false positives**, never **false negatives**.

## Where it shines
- **Databases (Cassandra, RocksDB):** skip reading disk files that definitely do not have the key.
- **Web crawlers:** "have I already visited this URL?" for billions of URLs.
- **Username taken check:** fast first filter.
- **Malicious URL lists** in browsers.
- **Avoiding cache misses** for keys that do not exist.

## Other probabilistic tools
**Count-Min Sketch** — estimates how often items appear (approximate counts). Great for "top trending hashtags" with little memory.

**HyperLogLog** — estimates the number of **unique** items (like unique visitors) using about 12 KB, with ~1% error. Redis has it built in (PFADD, PFCOUNT).

**Skip list** — a sorted structure with fast search; Redis sorted sets use one.

## The trade
You give up perfect accuracy to save huge amounts of memory and time. At big scale, that trade is often worth it.

> **Interview tip:** Crawler, de-duplication, or "count unique users" questions are a perfect moment to mention a Bloom filter or HyperLogLog.
` },

{ id: 'geo', chapter: 'patterns', title: 'Location Systems: Geohash and Quadtrees', body: `
> **In one line:** To find "things near me" fast, we turn 2D locations into searchable keys.

## The problem
"Find drivers within 2 km." Checking the distance to all 5 million drivers on every request is far too slow. A normal index on latitude alone or longitude alone does not help much.

## Geohash
Split the world into a grid, then split each cell again, and again. Each cell gets a string like **"tdr1y"**.
- Longer string = smaller cell.
- Nearby places usually **share a prefix**.
- Search: compute the user's geohash, look up that cell **plus its 8 neighbors** (to handle edges).
- Easy to store in any database or Redis (Redis has GEO commands).

## Quadtree
A tree where each node is a square region. If a region has too many points, split it into **4 children**.
- Dense cities get small cells, empty oceans get big cells.
- Great for uneven data. Usually kept **in memory**.

## Other options
- **S2** (Google) and **H3** (Uber, hexagons): divide the sphere into cells. H3's hexagons have equal-distance neighbors, nice for ride-hailing.
- **PostGIS** for PostgreSQL: full geospatial queries with R-tree indexes.

## Moving objects
Drivers update location every few seconds. That is a **lot** of writes.
- Keep live locations in **memory** (Redis GEO, an in-memory grid).
- Don't write every ping to the main database. Batch or sample for history.

## Typical design
~~~
Driver app → location service → Redis GEO (live, by geohash)
Rider app  → matching service → query nearby cells → rank by ETA
~~~
` },

{ id: 'llm-systems', chapter: 'patterns', title: 'Designing Systems with AI Models', body: `
> **In one line:** Modern apps often call large language models; designing around them adds new parts like vector search, caching and guardrails.

## The basic flow
User question → your backend → LLM API → answer. Simple, but the model only knows its training data and nothing about **your** data.

## RAG: Retrieval-Augmented Generation
1. **Ingest:** split your documents into chunks.
2. **Embed:** turn each chunk into a vector (a list of numbers capturing meaning).
3. **Store:** put vectors in a **vector database** (pgvector, Pinecone, Milvus, Weaviate).
4. **Retrieve:** embed the user's question, find the most similar chunks.
5. **Generate:** send the question + those chunks to the LLM.

The model now answers using your fresh, private data — with sources.

## New system concerns
- **Latency:** LLM calls take seconds. **Stream** tokens to the user (SSE) so it feels fast.
- **Cost:** you pay per token. Cache repeated answers; use smaller models for easy tasks; route hard tasks to bigger ones.
- **Rate limits:** providers cap requests. Queue and retry with backoff.
- **Reliability:** have fallbacks and timeouts; consider a second provider or model.
- **Safety:** input filtering, output checks, and never let model output run actions without validation.
- **Evaluation:** keep test sets and measure quality on every change.

## Agents
An agent lets the model call **tools** (search, databases, APIs) in a loop. Treat tool calls like untrusted input: validate parameters, limit permissions, log everything.

## The usual building blocks
API gateway → orchestrator service → (cache, vector DB, LLM provider, tool services) → queue for long jobs → observability for prompts, tokens, latency and cost.
` }
);

window.BLOGS.push(
{ id: 'availability', chapter: 'reliability', title: 'Availability, Nines and SLOs', body: `
> **In one line:** Availability is the share of time your system works, usually written in "nines".

## The nines
| Availability | Downtime per year | Per month |
|---|---|---|
| 99% | 3.65 days | 7.3 hours |
| 99.9% | 8.77 hours | 43.8 minutes |
| 99.99% | 52.6 minutes | 4.4 minutes |
| 99.999% | 5.26 minutes | 26 seconds |

Each extra nine is **much** harder and more expensive.

## Availability adds up (badly)
If a request must pass through 3 components, each 99.9% available, total ≈ 99.9% × 99.9% × 99.9% ≈ **99.7%**. Chains reduce availability.

Redundancy fixes it: two copies in parallel, each 99%, give 1 − (0.01 × 0.01) = **99.99%** (if failures are independent).

## SLI, SLO, SLA
- **SLI (Indicator):** what you measure. "Percent of requests answered under 300 ms."
- **SLO (Objective):** your internal target. "99.9% of requests under 300 ms each month."
- **SLA (Agreement):** a contract with customers, with penalties. Usually looser than the SLO.

## Error budget
If your SLO is 99.9%, you are **allowed** 0.1% failure. That is your error budget. Budget left? Ship features faster. Budget spent? Focus on reliability. This turns "stability vs speed" into data.

## Reliability vs availability vs durability
- **Available:** it answers.
- **Reliable:** it answers **correctly**, over time.
- **Durable:** data, once saved, is not lost.

## MTTR and MTBF
- **MTBF:** mean time between failures.
- **MTTR:** mean time to recovery.
Failures will happen. Fast detection and fast recovery (low MTTR) often matter more than preventing every failure.
` },

{ id: 'redundancy-dr', chapter: 'reliability', title: 'Redundancy, Failover and Disaster Recovery', body: `
> **In one line:** Keep spares of everything important, switch to them fast, and have a plan for when a whole region disappears.

## Redundancy
- **Active-passive:** a standby waits and takes over on failure. Simple. The standby is "wasted" capacity.
- **Active-active:** all copies serve traffic. Better use of resources, but data sync is harder.

## Failure domains
Spread copies so one event cannot kill them all:
- Different **machines** → survives a server crash.
- Different **racks** → survives a power strip failure.
- Different **availability zones** (separate buildings) → survives a data center outage.
- Different **regions** (cities or countries) → survives a natural disaster.

Running across **multiple AZs** is the standard baseline in the cloud.

## RPO and RTO
- **RPO (Recovery Point Objective):** how much data can you lose? "5 minutes of writes."
- **RTO (Recovery Time Objective):** how long can you be down? "1 hour."

Smaller numbers cost more.

## DR strategies (cheap → expensive)
1. **Backup & restore:** store backups in another region. Hours to recover.
2. **Pilot light:** a tiny core (database replica) runs in the other region; scale up on disaster.
3. **Warm standby:** a smaller full copy runs all the time.
4. **Multi-region active-active:** both regions serve users. Near-zero RTO. Most complex.

## Backups that actually work
- Automate them.
- Keep copies in another region and account.
- **Test restores regularly.** An untested backup is a hope, not a backup.

## Chaos engineering
Break things on purpose (kill servers, add latency) in a controlled way to prove the system survives. Netflix's Chaos Monkey made this famous.
` },

{ id: 'observability', chapter: 'reliability', title: 'Observability: Logs, Metrics, Traces', body: `
> **In one line:** Observability means you can understand what your system is doing from the outside, using logs, metrics and traces.

## Metrics
Numbers over time. Cheap to store, great for dashboards and alerts.
- **RED** for services: **R**ate (requests/s), **E**rrors, **D**uration (latency).
- **USE** for resources: **U**tilization, **S**aturation, **E**rrors.
- The **four golden signals:** latency, traffic, errors, saturation.
- Tools: Prometheus, Grafana, Datadog, CloudWatch.

## Logs
Text records of events. Rich detail for debugging.
- Use **structured logs** (JSON) with fields like request_id, user_id.
- Send them to a central place: ELK (Elasticsearch, Logstash, Kibana), Loki, Splunk.
- Mind the cost; sample noisy logs.

## Traces
Follow **one request** across many services.
- Each request gets a **trace ID**, passed along in headers.
- Each step is a **span** with timing.
- You see exactly which service made the request slow.
- Tools: OpenTelemetry (the standard), Jaeger, Zipkin, Tempo.

## Alerts
- Alert on **symptoms users feel** (error rate, latency SLO burn), not every CPU spike.
- Every alert should be actionable. Noisy alerts get ignored.
- Have **runbooks**: what to do when this alert fires.

## Health checks
- **Liveness:** is the process alive? (If not, restart it.)
- **Readiness:** can it take traffic now? (If not, remove from the load balancer.)

> **Interview tip:** End your design with one minute on monitoring: "We'd track p99 latency, error rate, queue depth, and cache hit ratio, with alerts on SLO burn."
` },

{ id: 'deployments', chapter: 'reliability', title: 'Safe Deployments', body: `
> **In one line:** Ship new code gradually so a bad release hurts few users and can be undone fast.

## Rolling deployment
Update servers a few at a time. Old and new versions run side by side for a while, so they must be **compatible**.

## Blue-green deployment
Two identical environments.
- **Blue** serves users today.
- Deploy to **green**, test it.
- Flip the load balancer to green.
- Problem? Flip back instantly.
Costs double the infrastructure during the switch.

## Canary release
Send a small slice of traffic (1%, then 5%, 25%, 100%) to the new version. Watch error rate and latency. If metrics look bad, roll back automatically. Named after canaries in coal mines.

## Feature flags
Ship code turned **off**, then turn it on for chosen users without redeploying.
- Separate **deploy** (code is live) from **release** (users see it).
- Instant kill switch.
- Enables A/B tests.
- Clean up old flags or they become clutter.

## Database migrations without downtime
Use **expand and contract**:
1. **Expand:** add the new column/table; code writes to both old and new.
2. Backfill old data.
3. Switch reads to the new shape.
4. **Contract:** remove the old column later.
Never rename or drop something in one step while old code still uses it.

## CI/CD
- **Continuous Integration:** every change is built and tested automatically.
- **Continuous Delivery/Deployment:** passing changes are released automatically or with one click.

Small, frequent releases are **safer** than big rare ones.
` },

{ id: 'security', chapter: 'reliability', title: 'Security Basics for System Design', body: `
> **In one line:** Know who the user is, check what they may do, encrypt data, and trust no input.

## Authentication vs authorization
- **Authentication (AuthN):** who are you? (Login, password, passkeys, MFA.)
- **Authorization (AuthZ):** what are you allowed to do? (Roles, permissions.)

## Sessions vs tokens
- **Session:** server stores session data; browser holds a session ID cookie. Easy to revoke.
- **JWT (JSON Web Token):** a signed token holding user info. Any server can verify it without a lookup — great for stateless scaling. Harder to revoke, so keep them **short-lived** and use refresh tokens.

## OAuth 2.0 and OpenID Connect
- **OAuth 2.0:** lets an app access something **on your behalf** without your password ("Allow this app to read your calendar").
- **OpenID Connect:** a layer on top for **login** ("Sign in with Google").

## Authorization models
- **RBAC:** permissions by role (admin, editor, viewer).
- **ABAC:** rules on attributes (department, time, ownership).

## Encryption
- **In transit:** TLS/HTTPS everywhere, including between internal services (mTLS).
- **At rest:** encrypt disks and databases. Manage keys with a **KMS**.
- **Passwords:** never store them. Store a slow, salted hash (bcrypt, scrypt, Argon2).

## Common attacks and defenses
| Attack | Defense |
|---|---|
| SQL injection | Parameterized queries |
| XSS | Escape output, Content Security Policy |
| CSRF | SameSite cookies, CSRF tokens |
| DDoS | CDN, rate limiting, WAF |
| Credential stuffing | Rate limits, MFA, breached-password checks |

## Principles
- **Least privilege:** each service gets only the access it needs.
- **Defense in depth:** many layers, not one wall.
- **Secrets** live in a secrets manager, never in code.
` },

{ id: 'containers', chapter: 'reliability', title: 'Containers, Kubernetes and Serverless', body: `
> **In one line:** Containers package an app with everything it needs; orchestrators like Kubernetes run many of them reliably.

## Containers
A **container** bundles your code, runtime and libraries into one image (Docker). It runs the same on a laptop and in production.
- Lighter than virtual machines (they share the host's operating system kernel).
- Start in seconds.

## Kubernetes (K8s)
Runs and manages containers across many machines.
- **Pod:** one or more containers running together.
- **Deployment:** "keep 5 copies of this pod running". Replaces crashed pods automatically.
- **Service:** a stable name and load balancing for a set of pods.
- **Ingress:** routes outside HTTP traffic into services.
- **Horizontal Pod Autoscaler:** adds pods when CPU or traffic rises.
- **ConfigMaps and Secrets:** configuration outside the image.

Kubernetes gives you self-healing, scaling, rolling deploys and service discovery — at the cost of real complexity.

## Serverless
You write a function; the cloud runs it on demand (**AWS Lambda, Google Cloud Functions, Cloudflare Workers**).
- **Good:** no servers to manage, scales to zero, pay per use.
- **Bad:** cold starts (first call is slower), time limits, vendor lock-in, harder local testing, can get expensive at steady high load.
- Great for: event handlers, glue code, spiky or low traffic.

## Autoscaling
Add capacity when load rises, remove it when load falls. Scale on CPU, request rate or queue depth. Keep a minimum number of instances for sudden spikes, because new instances take time to start.

## Infrastructure as Code
Define servers, networks and databases in code (**Terraform**, Pulumi, CloudFormation). Reviewable, repeatable, versioned.
` }
);

window.BLOGS.push(
{ id: 'interview-framework', chapter: 'interview', title: 'A Step-by-Step Interview Framework', body: `
> **In one line:** Clarify, estimate, define the API and data, draw the high-level design, dive deep, then discuss trade-offs.

A 45-minute system design interview, split up:

## 1. Clarify requirements (5 min)
- What are the **core features**? Pick 3–5.
- Who are the users? How many?
- What matters most: speed, consistency, availability, cost?
- What is **out of scope**?
Never start drawing before this.

## 2. Estimate scale (3–5 min)
DAU, reads/s, writes/s, read:write ratio, storage per year, bandwidth. Only enough to guide decisions.

## 3. Define the API (3–5 min)
List the main endpoints:
~~~
POST /tweets {text}
GET  /feed?cursor=...
POST /follow/{userId}
~~~

## 4. Data model (3–5 min)
Main entities, key fields, and which database for each. Say **why**.

## 5. High-level design (10 min)
Draw the boxes: clients → load balancer → services → cache → databases → queues → object storage/CDN. Walk through **one request end to end**.

## 6. Deep dives (10–15 min)
Pick the 2–3 hardest parts. Often the interviewer will steer you. Examples: feed fan-out, hot keys, sharding, consistency for payments, real-time delivery.

## 7. Wrap up (2–3 min)
- Bottlenecks and single points of failure.
- How you would scale 10× further.
- Monitoring and alerts.

## Habits that impress
- **Think out loud.** The interviewer grades your reasoning.
- **Always state trade-offs:** "X gives us A but costs B."
- **Start simple, then evolve.** Don't draw 30 boxes at once.
- **Use numbers** to justify choices.
- **Check in:** "Should I go deeper here or move on?"
` },

{ id: 'tradeoffs', chapter: 'interview', title: 'The Big Trade-Offs Cheat Sheet', body: `
> **In one line:** Every design choice gives you something and costs you something — knowing both sides is the skill.

| Choice | You gain | You pay |
|---|---|---|
| Strong consistency | Correct, simple reasoning | Latency, lower availability |
| Eventual consistency | Speed, availability | Stale reads, conflict handling |
| SQL | Transactions, joins, schema | Harder horizontal write scaling |
| NoSQL | Scale-out, flexible schema | Weaker joins/transactions, query-first design |
| Normalization | No duplicates, easy updates | Joins at read time |
| Denormalization | Fast reads | Duplicate data, harder updates |
| Caching | Speed, less DB load | Staleness, invalidation complexity |
| Sync calls | Simple, immediate result | Coupling, cascading failure |
| Async (queues) | Decoupling, spike absorption | Delay, eventual consistency, harder debugging |
| Push (fan-out on write) | Fast reads | Heavy writes for big fan-outs |
| Pull (fan-out on read) | Cheap writes | Slower reads |
| Monolith | Simplicity | Scaling teams and parts independently |
| Microservices | Independent deploy and scale | Network complexity, ops cost |
| Sync replication | No data loss | Slower writes |
| Async replication | Fast writes | Possible data loss on failover |
| Long-polling / SSE | Simple | Less interactive than WebSockets |
| WebSockets | Two-way real time | Stateful connections to scale |
| Batch | Efficient, simple | Results are late |
| Stream | Fresh results | Complexity |

## Phrases that show maturity
- "It depends on whether we optimize for X or Y. Here, I'd pick X because..."
- "We can start with the simpler option and migrate when we hit this number."
- "This is a single point of failure; we'll add a replica and failover."
- "For this part, stale data for a few seconds is acceptable."

> **Remember:** There is no perfect design. A good answer names the trade-off and justifies the choice with the requirements.
` }
);
