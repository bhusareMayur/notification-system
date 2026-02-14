# Scalable Multi-Channel Notification System

A backend-focused, production-style notification system designed using asynchronous processing and message queues.  
The system supports **Email, SMS, and Push notifications** with built-in reliability mechanisms.

---

## 🚀 Key Features

- Asynchronous notification processing using **RabbitMQ**
- Supports multiple channels: **Email, SMS, Push**
- **Retry mechanism** with configurable attempts
- **Dead Letter Queue (DLQ)** for failed messages
- **Idempotent consumers** to prevent duplicate delivery
- **Manual retry from DLQ** for operational recovery
- **Structured logging** for retries, failures, and DLQ events
- Horizontally scalable worker architecture
- Persistent notification status tracking in database

---

## 🗃️ System Architecture (High Level)

```
Client
  ↓
Notification API
  ↓
RabbitMQ (notifications queue)
  ↓
Email Worker | SMS Worker | Push Worker
  ↓
Database (Status Tracking)
```

---

## 🧰 Tech Stack

- **Backend:** Node.js, Express.js  
- **Messaging:** RabbitMQ  
- **Database:** MySQL  
- **Infra:** Docker  
- **Email:** Nodemailer  
- **SMS:** Twilio  
- **Push:** Firebase Cloud Messaging (FCM)  
- **Testing:** Postman, k6  
- **Logging:** Structured console logs  

---

## 📦 Notification Flow

1. Client sends notification request to API
2. API validates request and stores metadata in DB
3. Message is published to RabbitMQ
4. Channel-specific worker consumes the message
5. On failure → retry queue
6. After max retries → Dead Letter Queue (DLQ)
7. Manual replay from DLQ supported

---

## 🔁 Retry & DLQ Strategy

- Automatic retries using RabbitMQ TTL queues
- Messages exceeding retry limit are routed to DLQ
- DLQ messages can be manually re-queued
- All retry and DLQ events are logged

---

## 🛡️ Idempotency

- Database-backed idempotency checks
- Prevents duplicate notifications during retries or crashes
- Safe at-least-once message delivery handling

---

## 📊 Logging & Observability

- Logs notification lifecycle events:
  - Retry attempts
  - DLQ routing
  - Manual replays
- Helps in debugging and operational monitoring

---

## ⚙️ Scalability

- Multiple workers can be run per channel
- RabbitMQ automatically load-balances messages
- Designed to scale horizontally without code changes

---

## 📈 Scale & Load Testing

- Load tested with **10,000+ concurrent API requests** using **k6**
- Requests were accepted without API crashes or data loss
- Messages were queued reliably in RabbitMQ under burst traffic
- Workers processed messages asynchronously without blocking the API
- Notification states remained consistent in MySQL (`PENDING → SENT / FAILED`)
- Queue depth, delivery rate, and retries were verified via RabbitMQ dashboard

> Note: Tests were performed in a controlled local environment to validate system behavior under load.


---

## 🧪 Running Locally

### Prerequisites

- Node.js
- Docker
- RabbitMQ

### Start RabbitMQ (Docker)

```bash
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

### Start Notification API

```bash
node src/server.js
```

### Start Workers

```bash
node src/workers/email.worker.js
node src/workers/sms.worker.js
node src/workers/push.worker.js
```
## Documentation
- [Architecture & Design Document](./Design.md)
