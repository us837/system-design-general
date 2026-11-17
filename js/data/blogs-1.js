/* Library: chapters + lessons. Each lesson body is simple markdown. Keep lessons under ~600 words. */
window.CHAPTERS = [
  { id: 'foundations', title: 'Chapter 1 · The Foundations', icon: '🧱' },
  { id: 'scaling', title: 'Chapter 2 · Growing Your Kingdom (Scaling)', icon: '📈' },
  { id: 'data', title: 'Chapter 3 · Storing Data', icon: '🗄️' },
  { id: 'distributed', title: 'Chapter 4 · Distributed Systems', icon: '🌐' },
  { id: 'async', title: 'Chapter 5 · Messages & Real-Time', icon: '📨' },
  { id: 'patterns', title: 'Chapter 6 · Architecture Patterns', icon: '🏗️' },
  { id: 'reliability', title: 'Chapter 7 · Reliability & Operations', icon: '🛡️' },
  { id: 'interview', title: 'Chapter 8 · The Interview Playbook', icon: '🎤' },
  { id: 'cases', title: 'Chapter 9 · Real Designs (Case Studies)', icon: '🏰' }
];
window.BLOGS = [];

window.BLOGS.push(
{ id: 'what-is-system-design', chapter: 'foundations', title: 'What Is System Design?', body: `
> **In one line:** System design is planning how the parts of a software system fit together so it works well for many people.

## A simple picture
Think of a small bakery. One baker, one oven, ten customers a day. Easy.

Now imagine ten thousand customers a day. One baker cannot keep up. You need more bakers, more ovens, a storage room, a delivery van, and a way to take orders without chaos.

Software is the same. A small app runs on one computer. A big app like YouTube needs thousands of computers working together. **System design is the plan for how they work together.**

## What you decide in system design
- **Where data lives.** Which database? How many copies?
- **How requests flow.** What happens when a user clicks a button?
- **How to grow.** What do we add when users go from 1,000 to 10 million?
- **How to survive failure.** What happens when a machine dies at 3 a.m.?

## The goals
A good system is:
1. **Scalable** — it handles more users by adding more machines.
2. **Reliable** — it keeps working when parts break.
3. **Available** — it is up when users need it.
4. **Fast** — responses come back quickly (low latency).
5. **Maintainable** — engineers can understand and change it.
6. **Cost-aware** — it does not waste money.

You can never max out all six. Making something faster may cost more. Making it more consistent may make it slower. **System design is the art of trade-offs.**

## Building blocks you will learn
Almost every big system is made of the same Lego pieces:
- Clients (browsers, phones)
- DNS
- Load balancers
- Application servers
- Caches
- Databases
- Message queues
- Object storage and CDNs

Once you know what each piece does and when to use it, you can design almost anything.

## How to use this library
Read the chapters in order. Each lesson is short. After a chapter, visit the **Quiz Arena** to check yourself, then go to **Build & Defend** to try the ideas with your own hands.

> **Remember:** There is rarely one right answer. There are only good reasons for your choices.
` },

{ id: 'how-the-web-works', chapter: 'foundations', title: 'What Happens When You Open a Website', body: `
> **In one line:** Your browser finds the server's address, connects to it, asks for the page, and shows what comes back.

## The journey of one click
You type **shop.com** and press Enter. Here is what happens, step by step.

1. **Find the address (DNS).** Computers talk using IP addresses like 93.184.216.34, not names. Your browser asks DNS: "What is the IP for shop.com?"
2. **Connect (TCP).** The browser opens a connection to that IP. TCP makes sure data arrives complete and in order.
3. **Secure it (TLS).** For HTTPS, the browser and server agree on encryption keys so no one can read the traffic.
4. **Ask (HTTP request).** The browser sends: "GET /home please."
5. **Work (server).** The server runs code, maybe reads a database, and builds a response.
6. **Answer (HTTP response).** The server sends back HTML, plus a status like 200 OK.
7. **Show (render).** The browser draws the page, then fetches images, CSS and scripts.

## Client and server
- The **client** asks. (Your browser or phone app.)
- The **server** answers. (A computer in a data center.)

This is the **client–server model**. Almost every system you design starts here.

## Where big systems add pieces
In a real large system the path looks more like this:

~~~
User → DNS → CDN → Load Balancer → App Servers → Cache → Database
~~~

Each new piece solves a problem:
- **CDN** — serves images and videos from a place near the user.
- **Load balancer** — spreads traffic over many servers.
- **Cache** — remembers popular answers so the database rests.

You will meet each of these in the next lessons.

> **Interview tip:** "What happens when you type a URL?" is a classic warm-up. Walk through DNS → TCP → TLS → HTTP → server → render.
` },

{ id: 'dns', chapter: 'foundations', title: 'DNS: The Internet Phone Book', body: `
> **In one line:** DNS turns a name like google.com into an IP address a computer can connect to.

## Why we need it
People remember names. Computers need numbers. DNS (Domain Name System) connects the two.

## How a lookup works
1. Your browser checks its own **cache**. Seen this name recently? Done.
2. If not, it asks a **resolver** (usually run by your internet provider or a service like 1.1.1.1).
3. The resolver asks a **root server**: "Who handles .com?"
4. The root points to the **.com TLD server**.
5. The TLD server points to the **authoritative server** for shop.com.
6. The authoritative server answers with the IP.
7. Everyone caches the answer for a while.

## TTL: how long answers live
Every DNS record has a **TTL** (time to live), for example 300 seconds. Short TTL = changes spread fast but more lookups. Long TTL = fewer lookups but slow changes.

## Common record types
| Record | What it maps |
|---|---|
| A | Name → IPv4 address |
| AAAA | Name → IPv6 address |
| CNAME | Name → another name (an alias) |
| MX | Domain → mail server |
| NS | Domain → its name servers |
| TXT | Domain → any text (often for verification) |

## DNS in system design
DNS is more than a phone book. It can help with scale:
- **Round-robin DNS** returns different IPs to different users to spread load.
- **GeoDNS** returns the IP of the data center closest to the user.
- **Failover DNS** stops returning the IP of a dead data center.

The weakness: clients cache answers. If a server dies, some users keep trying the old IP until the TTL ends. That is why we usually put a **load balancer** behind DNS for fast failover.
` },

{ id: 'http', chapter: 'foundations', title: 'HTTP and HTTPS in Plain Words', body: `
> **In one line:** HTTP is the language browsers and servers use to ask for and send things.

## A request
A request has:
- A **method** — what you want to do.
- A **path** — what you want it on, like /users/42.
- **Headers** — extra info, like who you are.
- An optional **body** — data you send.

## Methods you must know
| Method | Meaning | Safe to repeat? |
|---|---|---|
| GET | Read something | Yes |
| POST | Create something | No |
| PUT | Replace something | Yes |
| PATCH | Change part of something | Not always |
| DELETE | Remove something | Yes |

"Safe to repeat" is called **idempotent**: doing it twice has the same effect as doing it once. This matters a lot when networks fail and clients retry.

## Status codes
- **2xx — success.** 200 OK, 201 Created, 204 No Content.
- **3xx — go elsewhere.** 301 Moved Permanently, 302 Found (temporary), 304 Not Modified.
- **4xx — your fault.** 400 Bad Request, 401 Unauthorized (not logged in), 403 Forbidden (logged in but not allowed), 404 Not Found, 429 Too Many Requests.
- **5xx — server's fault.** 500 Internal Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout.

## HTTPS
HTTPS is HTTP inside **TLS** encryption. It protects against spying and tampering. Today, everything should be HTTPS.

## Versions in one breath
- **HTTP/1.1** — one request at a time per connection.
- **HTTP/2** — many requests share one connection (multiplexing).
- **HTTP/3** — runs on QUIC over UDP, faster on bad networks.

## Stateless
HTTP is **stateless**: each request stands alone. The server does not remember you between requests. To remember login, we send a **cookie** or **token** with every request. Statelessness is a gift: any server can handle any request, which makes scaling easy.
` },

{ id: 'apis', chapter: 'foundations', title: 'APIs: REST, GraphQL and gRPC', body: `
> **In one line:** An API is a menu of things one program can ask another program to do.

## REST
The most common style. Everything is a **resource** with a URL.

~~~
GET    /users/42        → read user 42
POST   /users           → create a user
PATCH  /users/42        → update user 42
DELETE /users/42        → delete user 42
GET    /users/42/orders → user 42's orders
~~~

**Good:** simple, uses plain HTTP, easy to cache.
**Bad:** you may fetch too much (over-fetching) or need many calls (under-fetching).

## GraphQL
One endpoint. The client writes a query saying exactly which fields it wants.

**Good:** no over-fetching, great for mobile apps with many screens.
**Bad:** harder to cache, a heavy query can hurt the server, more complex.

## gRPC
Calls a function on another machine as if it were local. Uses **Protocol Buffers** (compact binary data) over HTTP/2.

**Good:** very fast, strict typed contracts, supports streaming.
**Bad:** not friendly for browsers, harder to debug by eye.

## When to use which
| Situation | Pick |
|---|---|
| Public API for many developers | REST |
| Many client screens needing different data | GraphQL |
| Service-to-service inside your backend | gRPC |

## Good API habits
- **Pagination.** Never return a million rows. Use limit + cursor: GET /posts?limit=20&cursor=abc.
- **Versioning.** /v1/users lets you change things without breaking old clients.
- **Idempotency keys.** For payments, the client sends a unique key so a retry does not charge twice.
- **Clear errors.** Return proper status codes and a readable message.
- **Rate limits.** Protect yourself from abusive clients.

> **Interview tip:** Early in an interview, write down the main API calls. It shows you understand what the system must actually do.
` },

{ id: 'latency-throughput', chapter: 'foundations', title: 'Latency, Throughput and the Numbers to Know', body: `
> **In one line:** Latency is how long one request takes. Throughput is how many requests you finish per second.

## Two different things
Picture a highway.
- **Latency** = how long one car takes to drive from A to B.
- **Throughput** = how many cars arrive at B each hour.

You can have a fast road with few lanes (low latency, low throughput) or a slow road with many lanes (high latency, high throughput).

## Percentiles, not averages
Averages hide pain. We measure:
- **p50** — the median user.
- **p95 / p99** — the slow tail. If p99 is 2 seconds, 1 in 100 requests is painfully slow.

Big systems care about **p99** because one page may make 100 calls, so almost every user hits the slow tail somewhere.

## Rough speeds to remember
| Action | Rough time |
|---|---|
| Read from CPU cache | ~1 ns |
| Read from RAM | ~100 ns |
| Read 1 MB from RAM | ~10 µs |
| Read from SSD | ~100 µs |
| Network round trip inside a data center | ~0.5 ms |
| Read 1 MB from SSD | ~1 ms |
| Disk seek (spinning HDD) | ~10 ms |
| Round trip US ↔ Europe | ~150 ms |

The lessons:
- **Memory is far faster than disk.** That is why caches exist.
- **Network between continents is slow.** That is why CDNs and regional data centers exist.
- **Avoid many sequential network calls.** They add up.

## Handy unit facts
- 1 day ≈ 86,400 s ≈ **100,000 s** (round it).
- 1 million requests/day ≈ **12 per second**.
- 1 KB = 1,000 bytes; 1 MB = 1,000 KB; 1 GB = 1,000 MB; 1 TB = 1,000 GB; 1 PB = 1,000 TB (round numbers are fine for estimates).
` },

{ id: 'estimation', chapter: 'foundations', title: 'Back-of-the-Envelope Estimation', body: `
> **In one line:** Quick, rough math tells you how big your system must be before you design it.

## Why estimate?
Designing for 100 users and 100 million users are very different jobs. A few minutes of math tells you which one you are doing.

## The four numbers
1. **Requests per second (QPS)**
2. **Storage** per day and per year
3. **Bandwidth** in and out
4. **Memory** needed for caching

## The method, with an example
**App:** photo sharing. 10 million daily active users (DAU). Each user views 50 photos and uploads 1 photo per day. Average photo = 500 KB.

**QPS**
- Reads: 10M × 50 = 500M per day. ÷ 100,000 s ≈ **5,000 reads/s**.
- Writes: 10M × 1 = 10M per day ÷ 100,000 ≈ **100 writes/s**.
- Peak is often **2–3× average**, so plan for ~15,000 reads/s.

**Storage**
- 10M photos/day × 500 KB = **5 TB per day**.
- Per year: 5 TB × 365 ≈ **~1.8 PB**. Add copies for safety (×3) → ~5.5 PB.

**Bandwidth**
- Outgoing: 5,000 reads/s × 500 KB = **2.5 GB/s**. That screams **CDN**.

**Cache**
- The 80/20 rule: 20% of photos get 80% of views. Cache the metadata of popular items in RAM.

## Tips
- **Round aggressively.** 86,400 → 100,000. Nobody cares about exact digits.
- **Say assumptions out loud.** "I assume a 10:1 read-to-write ratio."
- **Let numbers drive decisions.** 100 writes/s fits on one database. 100,000 writes/s means sharding.
- **Know powers of ten.** Thousand (K), million (M), billion (B), trillion.

> **Interview tip:** Spend about 3–5 minutes here. The goal is not precision, it is spotting which parts will be under pressure.
` },

{ id: 'requirements', chapter: 'foundations', title: 'Functional vs Non-Functional Requirements', body: `
> **In one line:** Functional requirements say what the system does. Non-functional requirements say how well it does it.

## Functional: the features
These are verbs a user can do.
- Users can post a photo.
- Users can follow other users.
- Users can see a feed of photos from people they follow.

## Non-functional: the qualities
These describe the "-ilities".
- **Scale:** 100M daily users.
- **Latency:** feed loads under 200 ms (p99).
- **Availability:** 99.99% uptime.
- **Consistency:** is it okay if a new like shows up 2 seconds late? (Usually yes.)
- **Durability:** an uploaded photo must never be lost.
- **Security & privacy:** private accounts stay private.

## Why the split matters
Functional requirements decide your **APIs and data model**. Non-functional requirements decide your **architecture**: caching, replication, sharding, queues.

Two apps with the same features can need totally different designs. A chat app for 50 friends and WhatsApp have the same features but very different non-functional needs.

## Out of scope
Say clearly what you will **not** design. "I will skip ads, search and payments." This keeps the design focused.

## A good habit
Before drawing any box, write a short list:
1. Three to five core features.
2. Scale numbers.
3. The one or two qualities that matter most (for example, "low latency reads" or "never lose money").

That last point is your north star. A bank picks **consistency**. A social feed picks **availability and speed**. Knowing which one you are building tells you most of the answers.
` },

{ id: 'vertical-horizontal', chapter: 'scaling', title: 'Scaling Up vs Scaling Out', body: `
> **In one line:** Scale up by buying a bigger machine. Scale out by adding more machines.

## Vertical scaling (scale up)
Give your server more CPU, more RAM, faster disks.

**Good:**
- Super simple. No code changes.
- No distributed-system headaches.

**Bad:**
- There is a **ceiling**. The biggest machine only gets so big.
- Big machines get **very expensive**.
- It is still **one machine**. If it dies, you are down (a single point of failure).

## Horizontal scaling (scale out)
Add more ordinary machines and split the work.

**Good:**
- Nearly **no ceiling**. Need more? Add more.
- **Fault tolerant.** One machine dies, others keep going.
- Cheaper commodity hardware.

**Bad:**
- More complex. You need load balancing, data splitting, and coordination.
- Data consistency gets harder.

## The rule of thumb
1. Start simple. One server, scale up while it is cheap.
2. Move **stateless** parts (web/app servers) to horizontal scaling early. This is easy.
3. Scale **stateful** parts (databases) carefully: first with caching and read replicas, then sharding.

## Single point of failure (SPOF)
A SPOF is any part whose failure takes down everything. One database, one load balancer, one data center. Good designs remove SPOFs by having **at least two of everything** important.

| | Scale up | Scale out |
|---|---|---|
| Limit | Hardware ceiling | Practically none |
| Complexity | Low | Higher |
| Failure | Total outage | Partial |
| Cost curve | Steep | Linear |
` },

{ id: 'load-balancers', chapter: 'scaling', title: 'Load Balancers', body: `
> **In one line:** A load balancer stands in front of many servers and sends each request to one of them.

## Why
You have 10 app servers. Users should not need to know that. They talk to **one address**, the load balancer, and it spreads the work.

## What it gives you
- **Scale:** add servers behind it any time.
- **Availability:** it runs **health checks** and stops sending traffic to dead servers.
- **Zero-downtime deploys:** take servers out one by one to update them.
- **TLS termination:** decrypt HTTPS once at the edge so servers do less work.

## Layer 4 vs Layer 7
- **L4 (transport):** looks only at IP and port. Very fast, does not read the request.
- **L7 (application):** reads HTTP. Can route by path (/api → API servers, /images → image servers), headers or cookies. Smarter but a bit slower.

## Is the load balancer a single point of failure?
It can be. Real setups use **two or more** load balancers, in active-passive or active-active pairs, often sharing a floating IP. Cloud load balancers (AWS ELB/ALB, Google Cloud LB) handle this for you.

## Sticky sessions
Sometimes a user must keep hitting the same server (for example, if the server stores their session in memory). That is a **sticky session**. It works but hurts even load spreading. Better: keep servers **stateless** and store sessions in a shared store like Redis.

## Common products
- **Software:** NGINX, HAProxy, Envoy.
- **Cloud:** AWS ALB/NLB, Google Cloud Load Balancing, Azure Load Balancer.
- **Hardware:** F5 (in older data centers).

> **Interview tip:** The moment you have more than one app server, draw a load balancer.
` },

{ id: 'lb-algorithms', chapter: 'scaling', title: 'Load Balancing Algorithms', body: `
> **In one line:** The algorithm decides which server gets the next request.

## Round robin
Server 1, 2, 3, 1, 2, 3... Simple and fair **if** all servers and all requests are similar.

## Weighted round robin
A bigger server gets a bigger share. Server A (weight 3) gets three requests for every one that server B (weight 1) gets.

## Least connections
Send to the server with the fewest open connections. Great when requests take different amounts of time (like long uploads or WebSockets).

## Least response time
Send to the server that is answering fastest right now.

## IP hash
Hash the client's IP to pick a server. The same user keeps landing on the same server. Useful for stickiness, but uneven if a few IPs send lots of traffic.

## Consistent hashing
Used when the server **holds data** (like cache nodes). Adding or removing a server moves only a small part of the keys. (It gets its own lesson later.)

## Random / power of two choices
Pick two random servers, send to the less busy one. Surprisingly good and cheap at large scale.

## Which one?
| Situation | Good choice |
|---|---|
| Identical servers, short requests | Round robin |
| Servers of different sizes | Weighted round robin |
| Long or uneven requests | Least connections |
| Caches or stateful nodes | Consistent hashing |

> **Remember:** Health checks matter more than the algorithm. The best algorithm is useless if it sends traffic to a dead server.
` },

{ id: 'stateless', chapter: 'scaling', title: 'Stateless vs Stateful Services', body: `
> **In one line:** A stateless server keeps no memory of past requests, so any copy of it can handle any request.

## What is "state"?
State is data a server remembers between requests: a logged-in session, a shopping cart in memory, an open game.

## Stateful server
User logs in on Server A. Server A keeps the session in its memory. Next request lands on Server B. Server B says "who are you?" Broken.

Fixes like sticky sessions help, but if Server A dies, the user's session dies with it.

## Stateless server
The server keeps **nothing** important in its own memory. State lives somewhere shared:
- In the **request itself** (a signed token like a JWT).
- In a **shared store** (Redis for sessions).
- In the **database**.

Now any server can serve anyone. Add 10 more servers? Just do it. One dies? Nobody notices.

## The golden rule
**Push state down to the data layer. Keep the app layer stateless.**

Your web and app servers become identical, replaceable workers — like soldiers in an army. Your databases and caches are the castle vaults that need careful care.

## Some things must be stateful
Databases, caches, WebSocket servers holding live connections, and game servers are stateful by nature. Design those deliberately: replicate them, partition them, and plan for their failure.

> **Interview tip:** Saying "the app servers are stateless, sessions live in Redis" instantly shows you understand horizontal scaling.
` },

{ id: 'caching', chapter: 'scaling', title: 'Caching: Remember the Answer', body: `
> **In one line:** A cache keeps a copy of popular data in fast memory so you do not have to fetch it from slow storage again.

## Why it works
Reading RAM is about **1,000 times faster** than going to a database on disk over the network. And most traffic hits a small set of popular items (the **80/20 rule**).

## Where caches live
- **Browser cache** — on the user's device.
- **CDN** — near the user, for files.
- **Application cache** — Redis or Memcached next to your servers.
- **Database cache** — the database's own memory buffer.

## Cache hit and miss
- **Hit:** the data is in the cache. Fast!
- **Miss:** not there. Go to the database, then store it in the cache.
- **Hit ratio** = hits ÷ total. A 90% hit ratio means the database sees only 10% of reads.

## Eviction: what to throw out when full
- **LRU (Least Recently Used):** remove what was used longest ago. The most common.
- **LFU (Least Frequently Used):** remove what is used least often.
- **FIFO:** remove the oldest entry.
- **TTL:** each entry expires after a set time.

## The hard part: stale data
If the database changes, the cache may still hold the old value. Options:
- Set a **TTL** so old data expires.
- **Delete the cache key** when you update the database.
- Accept a little staleness when it is fine (like view counts).

> "There are only two hard things in computer science: cache invalidation and naming things."

## When not to cache
- Data that changes on almost every read.
- Data that must always be perfectly fresh (an account balance during payment).
- Data that is rarely read twice.

## Redis vs Memcached
- **Memcached:** simple, fast key-value strings, multi-threaded.
- **Redis:** also has lists, sets, sorted sets, counters, pub/sub, and can save to disk. The usual default today.
` },

{ id: 'cache-strategies', chapter: 'scaling', title: 'Cache Strategies: Aside, Through, Back', body: `
> **In one line:** A cache strategy decides who updates the cache and when.

## Cache-aside (lazy loading) — the default
1. App asks the cache.
2. Miss? App reads the database.
3. App writes the result into the cache.
4. On updates, app writes the database and **deletes** the cache key.

**Good:** only caches what is actually read. Cache dying is not fatal.
**Bad:** the first read is slow. Small window for stale data.

## Read-through
Like cache-aside, but the **cache itself** loads from the database on a miss. The app only talks to the cache.

## Write-through
Every write goes to the cache **and** the database at the same time.

**Good:** cache is always fresh.
**Bad:** writes are slower. You may cache things nobody reads.

## Write-back (write-behind)
Write to the cache only. The cache saves to the database **later**, in batches.

**Good:** super fast writes.
**Bad:** if the cache crashes before saving, **data is lost**.

## Write-around
Write straight to the database, skip the cache. The cache fills only when someone reads. Good for data that is written but rarely read soon after.

## Summary
| Strategy | Read speed | Write speed | Risk |
|---|---|---|---|
| Cache-aside | Fast after first | Normal | Brief staleness |
| Write-through | Fast | Slower | Low |
| Write-back | Fast | Fastest | Data loss |
| Write-around | Slow first read | Normal | Low |

## Two classic problems
- **Thundering herd / cache stampede:** a hot key expires and thousands of requests hit the database at once. Fix: let one request rebuild it (a lock), or refresh before expiry.
- **Hot key:** one key gets massive traffic (a celebrity's post). Fix: replicate that key across several cache nodes or keep a tiny local cache on each server.
` },

{ id: 'cdn', chapter: 'scaling', title: 'CDN: Content Near the User', body: `
> **In one line:** A CDN is a worldwide network of servers that keeps copies of your files close to users.

## The problem
Your server is in Virginia. A user in Mumbai downloads a 2 MB image. The data travels across the planet. Slow and expensive.

## The fix
A **Content Delivery Network** has hundreds of **edge servers** (Points of Presence) around the world. The Mumbai user gets the image from an edge in Mumbai.

## What goes on a CDN
- Images, videos, audio
- CSS, JavaScript, fonts
- Downloadable files
- Even whole static websites
- Sometimes API responses that are the same for everyone

## Pull vs push
- **Pull CDN:** the first user's request makes the edge fetch from your server (the **origin**), then cache it. Easy. The default.
- **Push CDN:** you upload files to the CDN ahead of time. Good for big files you know will be popular.

## Cache control
You tell the CDN how long to keep things with headers like Cache-Control: max-age=86400.

To update a file, the trick is **versioned file names**: app.v42.js. New version, new name, no stale copies.

## Benefits
- **Speed:** lower latency for users far away.
- **Less load:** your origin servers see a fraction of the traffic.
- **Lower cost:** CDN bandwidth is cheaper than yours.
- **Protection:** CDNs absorb DDoS attacks.

## Popular CDNs
Cloudflare, Amazon CloudFront, Akamai, Fastly, Google Cloud CDN.

> **Interview tip:** Any design with images or video should have a CDN in front of object storage. It is one of the easiest wins.
` },

{ id: 'proxies-gateway', chapter: 'scaling', title: 'Proxies and API Gateways', body: `
> **In one line:** A proxy is a middleman between a client and a server.

## Forward proxy
Sits in front of **clients**. The server sees the proxy, not you.
- Used by companies to filter web access.
- Used by VPNs to hide your IP.

## Reverse proxy
Sits in front of **servers**. The client sees the proxy, not the servers.
- Load balancing
- TLS termination
- Caching responses
- Compression
- Hiding your internal network

NGINX is the classic reverse proxy. A load balancer is a kind of reverse proxy.

## API Gateway
A smart reverse proxy for APIs. One front door for many backend services.

It typically handles:
- **Routing:** /orders → order service, /users → user service.
- **Authentication:** check the token once at the door.
- **Rate limiting:** stop abusive clients.
- **Request shaping:** combine or transform responses.
- **Logging and metrics.**

Examples: Kong, AWS API Gateway, Apigee, Envoy-based gateways.

## Backend for Frontend (BFF)
A gateway made for one specific client. A mobile BFF returns small, compact data; a web BFF returns richer data. Each team shapes its own API.

## Watch out
The gateway is on every request, so it must be:
- **Highly available** (several copies).
- **Fast** (no heavy business logic inside).

> **Remember:** Put cross-cutting concerns (auth, rate limits, logging) at the gateway. Keep business logic in services.
` }
);
