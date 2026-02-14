# 🚀 DESIGN.md — Scalable Multi-Channel Notification System

---

## 1. Problem

Modern applications require a **reliable, high-throughput mechanism** to deliver notifications (Email, SMS, Push) **without blocking the main application lifecycle**.

Key challenges addressed:

- **Latency:** External provider APIs (Twilio, FCM, Nodemailer) introduce unpredictable network delays.
- **Reliability:** Providers may experience downtime or aggressive rate-limiting.
- **Duplicates:** Network partitions can lead to *at-least-once* delivery side-effects.
- **Traffic Spikes:** Marketing campaigns or alerts can generate sudden, massive bursts of requests.

---

## 2. Architecture

The system follows an **Asynchronous Worker–Queue Model**, decoupling **request acceptance** from **message delivery** to improve throughput and fault tolerance.

### High-Level Flow

```text
[ Client ]
    ↓ (HTTP POST + Idempotency Key)
[ Express API ] ──────→ [ MySQL (Persistence Layer) ]
    ↓ (Publish)
[ RabbitMQ (Broker) ] ──→ [ Dead Letter Queue (Manual / Replay) ]
    ↓ (Consume)
[ Channel Workers ] ──→ [ External APIs (Twilio, FCM, SMTP) ]
    ↓ (Update)
[ MySQL (Final Status) ]
```

## Component Breakdown

### Express API
- Validates payloads
- Enforces persistence in MySQL before queuing
- Returns `202 Accepted` only after durability is ensured

### RabbitMQ
- Acts as a buffer and distributor
- Provides built-in TTL queues, DLQ routing, and delivery guarantees

### Workers
- Specialized Node.js consumers
- Channel-specific logic and provider-specific error mapping

### MySQL
- Source of truth for notification lifecycle
- Foundation for idempotency and consistency

---

## 3. Trade-offs

### Eventual Consistency vs Real-time
- Prioritizes availability and throughput
- User receives instant acknowledgment while delivery happens asynchronously

### At-Least-Once Delivery
- Guarantees message delivery
- Mitigated duplicates via unique message IDs and DB-level idempotency checks

### Shared Infrastructure
- All channels currently share a primary queue
- Simplifies initial deployment
- Risk: **Head-of-Line (HoL) Blocking** if one provider becomes slow

## 4. Failure Scenarios & Resilience

### External Provider Downtime
- Workers issue `nack`
- Messages routed to **Retry Queue** with TTL delay

### Poison Pill Messages
- Repeated failures (3+ attempts)
- Routed to **Dead Letter Queue (DLQ)** for manual replay

### Database Durability
- Persistence before queuing guarantees no data loss
- API rejects requests if DB unavailable → safe client retry

### Worker Crashes
- RabbitMQ `ack` semantics ensure automatic re-queue
- No message loss on worker failure

---

## 5. Scaling Plan (1k → 1M Requests)

**Performance Status:** Passed **10,000 request burst test** with no observed failures using k6.

### Phase 1 — 1k–10k (Current)
- Single API instance
- Specialized workers per channel
- Vertical MySQL scaling

### Phase 2 — 100k (Horizontal Expansion)
- Deploy multiple worker replicas
- Load balancing via **Nginx / ALB**
- Add structured logging + metrics:
  - Queue depth
  - Processing latency
  - Channel error rates

### Phase 3 — 1M (Infrastructure Maturity)

#### Queue Isolation
- Dedicated queues (`notif.email`, `notif.sms`, etc.)
- Eliminates **Head-of-Line (HoL) blocking**

#### Redis Layer
- Idempotency checks
- Rate limiting
- TTL-based memory control

#### Database Partitioning
- Partition by `created_at` or `user_id`
- Maintains query performance at scale

---

## 6. Implementation Choices

### RabbitMQ
- Mature routing, DLQs, TTL queues
- Strong delivery guarantees vs lightweight Redis queues

### MySQL
- ACID compliance
- Reliable lifecycle and status tracking

### Node.js
- Non-blocking I/O
- Ideal for network-bound worker operations

---

## 7. Observability (Planned / Ongoing)

### Structured Logs
- Success / Failure
- Retry counts
- Provider error mapping

### Metrics
- Queue backlog
- Throughput per channel
- Processing latency
- Failure ratios

---

## 8. Future Enhancements
- Channel-specific rate limiting
- Authentication & request signing
- Prometheus + Grafana dashboards
- Circuit breaker pattern for provider failures
- Bulk notification batching

---

## Final Note

This design prioritizes **reliability, scalability, and clarity of system behavior** over raw feature count.  
The architecture is intentionally **modular and extensible**, allowing incremental improvements without large-scale rewrites.
