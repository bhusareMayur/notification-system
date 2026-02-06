import http from 'k6/http';
import { check } from 'k6';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

export const options = {
  vus: 100,           // 50 concurrent virtual users
  iterations: 10050,   // Total notifications to send
};

export default function () {
  // Correct combined path from app.js (/api) and routes (/notifications)
  const url = 'http://localhost:8080/api/notifications';
  
  const channels = ['EMAIL', 'SMS', 'PUSH'];
  const randomChannel = channels[Math.floor(Math.random() * channels.length)];

  const payloadData = {
    channel: randomChannel,
    title: 'Production Load Test',
    body: 'Testing 10k+ throughput',
    idempotencyKey: uuidv4()
  };

  // Assign the exact keys your controller validation expects
  if (randomChannel === 'EMAIL') {
    payloadData.email = 'ryann.gutkowski@ethereal.email';
  } else if (randomChannel === 'SMS') {
    payloadData.phoneNumber = '+14248422173'; 
  } else if (randomChannel === 'PUSH') {
    payloadData.deviceToken = 'mock-fcm-token-123';
  }

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(url, JSON.stringify(payloadData), params);

  // Check for successful queuing (200, 201, or 202)
  check(res, {
    'is status success': (r) => r.status >= 200 && r.status < 300,
  });
}