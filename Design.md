<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📦 SYSTEM DESIGN · NOTIFICATION WORKER</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: #0b1120;
            font-family: 'Fira Code', 'SF Mono', 'JetBrains Mono', 'Cascadia Code', monospace;
            display: flex;
            justify-content: center;
            padding: 2rem 1rem;
            color: #e2e8f0;
        }
        .card {
            max-width: 1000px;
            width: 100%;
            background: #1e293b;
            border-radius: 28px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px #334155 inset;
            overflow: hidden;
            backdrop-filter: blur(4px);
        }
        .header {
            background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
            padding: 1.75rem 2rem;
            border-bottom: 1px solid #334155;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
        }
        .header h1 {
            font-size: 1.8rem;
            font-weight: 500;
            letter-spacing: -0.5px;
            background: linear-gradient(135deg, #b3e5fc, #a5f3fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .badge {
            background: #263445;
            color: #a5f3fc;
            padding: 0.3rem 1rem;
            border-radius: 40px;
            font-size: 0.8rem;
            font-weight: 500;
            border: 1px solid #3b4b5e;
            box-shadow: 0 2px 5px rgba(0,0,0,0.4);
            margin-left: auto;
        }
        .copy-area {
            background: #0f172a;
            padding: 1.2rem 2rem;
            border-bottom: 1px solid #2d3a4e;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.8rem;
        }
        .copy-area span {
            color: #94a3b8;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .copy-area span::before {
            content: "📋";
            font-size: 1.2rem;
        }
        .copy-btn {
            background: #2b3b4e;
            border: none;
            color: #f1f5f9;
            font-family: inherit;
            font-size: 0.9rem;
            padding: 0.6rem 1.4rem;
            border-radius: 40px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            border: 1px solid #475569;
            transition: all 0.15s ease;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .copy-btn:hover {
            background: #3b4f65;
            border-color: #5f7a9a;
            transform: scale(1.02);
        }
        .copy-btn:active {
            transform: scale(0.98);
        }
        .content {
            padding: 2rem;
            background: #1a2536;
            border-bottom-left-radius: 28px;
            border-bottom-right-radius: 28px;
        }
        pre {
            background: #0e1624;
            padding: 1.6rem 1.8rem;
            border-radius: 24px;
            font-size: 0.9rem;
            line-height: 1.6;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            color: #cbd5e1;
            border: 1px solid #2f4055;
            box-shadow: inset 0 0 20px #00000040, 0 10px 20px -5px #00000080;
            font-family: 'Fira Code', 'Cascadia Code', monospace;
        }
        .keyword { color: #f472b6; }      /* pink */
        .section { color: #fbbf24; }       /* amber */
        .string { color: #a3e635; }         /* lime */
        .comment { color: #6b7280; }        /* gray */
        .number { color: #2dd4bf; }         /* teal */
        .decorator { color: #c084fc; }       /* purple */
        .md-title { color: #7aa2f7; }        /* light blue */
        hr {
            border: none;
            height: 1px;
            background: linear-gradient(90deg, transparent, #475569, transparent);
            margin: 1.2rem 0;
        }
        .status-bar {
            background: #1e2a3a;
            border-radius: 100px;
            padding: 0.5rem 1.5rem;
            margin-top: 1.2rem;
            display: inline-flex;
            gap: 1.5rem;
            border: 1px solid #3f526b;
            font-size: 0.85rem;
        }
        .status-bar span {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .green-dot { background: #22c55e; width: 10px; height: 10px; border-radius: 10px; display: inline-block; }
        .yellow-dot { background: #eab308; width: 10px; height: 10px; border-radius: 10px; display: inline-block; }
        .blue-dot { background: #3b82f6; width: 10px; height: 10px; border-radius: 10px; display: inline-block; }
    </style>
</head>
<body>
<div class="card">
    <div class="header">
        <h1>⚡ scalable-multi-channel-notif · DESIGN.md</h1>
        <div class="badge"># worker-queue · v1.3 · ACID · 10k burst ✓</div>
    </div>
    <div class="copy-area">
        <span> Entire specification — one‑click copy </span>
        <button class="copy-btn" id="copyBtn">
            <span>📋</span> COPY WHOLE FILE
        </button>
    </div>
    <div class="content">
        <pre id="designContent">
<span class="comment"># DESIGN.md: Scalable Multi-Channel Notification System</span>

<span class="section">## 1. Problem</span>

Modern applications require a reliable, high-throughput mechanism to deliver notifications (Email, SMS, Push) without blocking the main application lifecycle. Key challenges addressed:

<span class="keyword">* **Latency:**</span> External provider APIs (Twilio, FCM, Nodemailer) introduce variable network latency.
<span class="keyword">* **Reliability:**</span> External providers are subject to downtime or aggressive rate-limiting.
<span class="keyword">* **Duplicates:**</span> Network partitions can lead to "at-least-once" delivery challenges.
<span class="keyword">* **Traffic Spikes:**</span> Marketing campaigns or system alerts can cause sudden, massive bursts of traffic.

<hr>

<span class="section">## 2. Architecture</span>

The system utilizes an <span class="decorator">**Asynchronous Worker-Queue Model**</span> to decouple request acceptance from message delivery.

<span class="md-title">### High-Level Flow</span>

<span class="comment">```text
[ Client ] 
    ↓ (HTTP POST + Idempotency Key)
[ Express API ] ──────→ [ MySQL (Persistence Layer) ]
    ↓ (Publish)
[ RabbitMQ (Broker) ] ──→ [ Dead Letter Queue (Manual/Replay) ]
    ↓ (Consume)
[ Channel Workers ] ──→ [ External APIs (Twilio, FCM, SMTP) ]
    ↓ (Update)
[ MySQL (Final Status) ]

```</span>

<span class="md-title">### Component Breakdown</span>

* <span class="keyword">**Express API:**</span> Validates payloads and enforces persistence in MySQL *before* queuing to ensure the system never "loses" a notification once a 202 Accepted is returned.
* <span class="keyword">**RabbitMQ:**</span> Acts as the buffer. It handles task distribution and provides built-in support for retries (TTL) and failure isolation (DLQ).
* <span class="keyword">**Workers:**</span> Specialized Node.js consumers that handle channel-specific logic and provider-specific error mapping.
* <span class="keyword">**MySQL:**</span> Serves as the source of truth for notification lifecycles and provides the foundation for idempotency.

<hr>

<span class="section">## 3. Trade-offs</span>

* <span class="keyword">**Eventual Consistency vs. Real-time:**</span> We prioritize high availability and throughput. By returning a <span class="string">`202 Accepted`</span> immediately, we decouple user experience from downstream provider delays.
* <span class="keyword">**At-Least-Once Delivery:**</span> We guarantee delivery at least once. To mitigate duplicate notifications caused by worker retries, we use database-level checks on unique message IDs.
* <span class="keyword">**Shared Infrastructure:**</span> Currently, all channels share a primary queue. While this simplifies the initial footprint, it introduces a risk of <span class="decorator">**Head-of-Line (HoL) blocking**</span> (e.g., a slow SMS provider delaying Emails).

<hr>

<span class="section">## 4. Failure Scenarios & Resilience</span>

* <span class="keyword">**External Provider Downtime:**</span> Workers utilize <span class="string">`nack`</span> (negative acknowledgment) to requeue failed attempts. We implement a <span class="decorator">**Retry Queue**</span> with a TTL (Delay) to avoid hammering a failing service.
* <span class="keyword">**Poison Pill Messages:**</span> Notifications that fail repeatedly (e.g., 3+ times) are routed to a <span class="decorator">**Dead Letter Queue (DLQ)**</span> to prevent them from clogging the system.
* <span class="keyword">**Database Durability:**</span> By writing to MySQL before the queue, we guarantee persistence even if the broker crashes. If the DB is unavailable, the API rejects the request, allowing the client to safely retry.
* <span class="keyword">**Worker Crashes:**</span> Utilizing RabbitMQ <span class="string">`ack`</span> semantics; if a worker dies mid-process, the message is automatically requeued for another healthy worker.

<hr>

<span class="section">## 5. Scaling Plan (1k → 1M)</span>

Performance status: <span class="decorator">**Passed 10,000 request burst test with no observed failures.**</span>

<span class="md-title">### Phase 1: 1k - 10k (Current)</span>

* Single API instance and specialized workers.
* Vertical scaling of the MySQL instance for simple management.

<span class="md-title">### Phase 2: 100k (Horizontal Expansion)</span>

* <span class="keyword">**Horizontal Scaling:**</span> Deploy multiple worker replicas behind an orchestrator.
* <span class="keyword">**Load Balancing:**</span> Distribute API traffic across multiple nodes using Nginx or an ALB.
* <span class="keyword">**Observability:**</span> Implement structured logging and metrics tracking (queue depth, processing latency, and error rates per channel).

<span class="md-title">### Phase 3: 1M (Infrastructure Maturity)</span>

* <span class="keyword">**Queue Isolation:**</span> Split the "Main Queue" into dedicated queues (e.g., <span class="string">`notif.email`</span>, <span class="string">`notif.sms`</span>) to eliminate Head-of-Line blocking.
* <span class="keyword">**Redis Layer:**</span> Move idempotency checks and rate-limiting to a Redis layer with established TTLs to reduce MySQL read-pressure.
* <span class="keyword">**Database Partitioning:**</span> Partition the <span class="string">`notifications`</span> table by <span class="string">`created_at`</span> or <span class="string">`user_id`</span> to maintain query performance at scale.

<hr>

<span class="section">## 6. Implementation Choices</span>

* <span class="keyword">**RabbitMQ:**</span> Selected for its mature routing capabilities (DLQs, TTL) and strong delivery guarantees compared to simpler Redis-based queues.
* <span class="keyword">**MySQL:**</span> Chosen for ACID compliance, ensuring the notification status is always accurate and durable.
* <span class="keyword">**Node.js:**</span> The non-blocking I/O model is ideal for workers that spend the majority of their time waiting on external network calls.
        </pre>
        <div class="status-bar">
            <span><span class="green-dot"></span> 10k burst · no failures</span>
            <span><span class="yellow-dot"></span> queue isolation (phase 3)</span>
            <span><span class="blue-dot"></span> idempotent · ACID</span>
        </div>
    </div>
</div>
<script>
    (function() {
        const copyBtn = document.getElementById('copyBtn');
        const designContent = document.getElementById('designContent');

        function getRawContent() {
            let content = designContent.innerText || designContent.textContent;
            // clean up any extra indentation that came from HTML layout — but we want it exactly as shown.
            // we'll just return the text content, which preserves most formatting.
            return content;
        }

        copyBtn.addEventListener('click', async function() {
            const raw = getRawContent();
            try {
                await navigator.clipboard.writeText(raw);
                // visual feedback
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<span>✅</span> COPIED!';
                copyBtn.style.background = '#1f3a4b';
                copyBtn.style.borderColor = '#4c9aff';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.style.background = '#2b3b4e';
                    copyBtn.style.borderColor = '#475569';
                }, 1600);
            } catch (err) {
                alert('❌ copy failed, but you can select manually');
            }
        });
    })();
</script>
</body>
</html>