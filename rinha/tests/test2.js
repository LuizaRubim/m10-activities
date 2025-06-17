import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter } from 'k6/metrics';

// Custom error counters
export let errors = {
  limitExceeded: new Counter('limit_exceeded'),
  other: new Counter('other_errors'),
};

export const options = {
  stages: [
    { duration: '10s', target: 1000 },
    { duration: '20s', target: 2000 },
    { duration: '5s', target: 3000 }, // reach 10k VUs gradually
    { duration: '20s', target: 2000 },  // sustain peak load for 1 minute
    { duration: '20s', target: 1000 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'], // 95% of requests should finish under 800ms
    http_req_failed: ['rate<0.01'],   // <1% of requests should fail
    'limit_exceeded': ['count<100'],  // optional: limit exceeded should be rare
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:9999';

export function setup() {
  // wait for the API to come up
  for (let i = 0; i < 20; i++) {
    let res = http.get(`${BASE}/clientes/1/extrato`);
    if (res.status === 200) {
      console.log('✅ API is ready');
      return;
    }
    console.log(`⏳ still waiting for API… (${i + 1}/20)`);
    sleep(2);
  }
  throw new Error('API never became ready');
}

export default function () {
  // pick a random client 1–5 each VU/iteration
  const clientId = Math.floor(Math.random() * 5) + 1;

  group('create transaction', () => {
    const payload = JSON.stringify({
      valor: Math.floor(Math.random() * 10000) + 1,
      tipo: 'c',
      descricao: 'loadtest',
    });
    const res = http.post(
      `${BASE}/clientes/${clientId}/transacoes`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Count specific error types
    if (res.status === 422) {
      errors.limitExceeded.add(1);
    } else if (res.status !== 200) {
      errors.other.add(1);
    }

    check(res, {
      'POST status is 200': (r) => r.status === 200,
      'POST has saldo & limite': (r) => {
        const b = r.json();
        return b.saldo !== undefined && b.limite !== undefined;
      },
    });
  });

  group('get statement', () => {
    const res = http.get(`${BASE}/clientes/${clientId}/extrato`);

    check(res, {
      'GET status is 200': (r) => r.status === 200,
      'GET has ultimas_transacoes': (r) => {
        const b = r.json();
        return Array.isArray(b.ultimas_transacoes);
      },
    });
  });

  // randomized pause so VUs don't all sync exactly
  sleep(Math.random() * 1 + 0.5);
}