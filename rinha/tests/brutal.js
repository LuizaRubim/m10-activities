// brutal_script.js

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// --- Configuration ---
const BASE_URL = "http://localhost:9999";
const CLIENT_IDS = [1, 2, 3, 4, 5];
// console.log(`K6_SCRIPT_INIT: CLIENT_IDS array: ${JSON.stringify(CLIENT_IDS)}, Length: ${CLIENT_IDS.length}`);

// --- K6 Options for BRUTAL Test ---
export const options = {
  stages: [
    { duration: "20s", target: 100 },
    { duration: "3m", target: 100 },
    //{ duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.001"],
    http_req_duration: ["p(99)<600"],
    checks: ["rate>0.999"], // This will now be evaluated correctly
    extrato_req_duration: ["p(99)<400"],
    transacao_req_duration: ["p(99)<500"],
    transacao_errors_422_count: ["count<100000"],
    error_rate_422_transacao: ["rate<0.50"],
    error_rate_404: ["rate<0.0001"],
    error_rate_generic: ["rate<0.0001"],
  },
  summaryTrendStats: [
    "avg",
    "min",
    "med",
    "max",
    "p(90)",
    "p(95)",
    "p(99)",
    "count",
  ],
  discardResponseBodies: false,
};

// --- Custom Metrics ---
const extratoReqDuration = new Trend("extrato_req_duration");
const transacaoReqDuration = new Trend("transacao_req_duration");
const transacao422Counter = new Counter("transacao_errors_422_count");
const errorRate422Transacao = new Rate("error_rate_422_transacao");
const errorRate404 = new Rate("error_rate_404");
const errorRateGeneric = new Rate("error_rate_generic");
const successfulTransacoes = new Counter("successful_transacoes");
const successfulExtratos = new Counter("successful_extratos");

// --- Helper Functions ---
function getRandomClientId() {
  if (!CLIENT_IDS || CLIENT_IDS.length === 0) {
    console.error(`K6_VU ${__VU} FN_ERROR: CLIENT_IDS empty!`);
    return undefined;
  }
  return CLIENT_IDS[Math.floor(Math.random() * CLIENT_IDS.length)];
}

function getRandomTransactionType() {
  return Math.random() < 0.75 ? "d" : "c";
}

function getRandomAmount(transactionType, clienteId) {
  let amount;
  if (transactionType === "c") {
    const creditAmounts = [100, 500, 1000, 5000, 10000];
    amount = creditAmounts[Math.floor(Math.random() * creditAmounts.length)];
  } else {
    const probability = Math.random();
    if (probability < 0.4) {
      amount = Math.floor(Math.random() * 5000) + 1;
    } else if (probability < 0.8) {
      amount = Math.floor(Math.random() * 40000) + 5001;
    } else {
      amount = Math.floor(Math.random() * 200000) + 50000;
    }
    amount = Math.max(1, amount);
  }
  return amount;
}

const descriptions = [
  "padaria",
  "aluguel",
  "mercado",
  "pix",
  "invest",
  "ifood",
  "uber",
  "farmacia",
  "luz",
  "agua",
  "salario",
  "bonus",
  "reembolso",
  "transfer",
  "servico",
  "netflix",
  "spotify",
  "cafe",
  "lanche",
  "jogo",
];
function getRandomDescription() {
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// --- Main VU Logic ---
export default function () {
  const clienteId = getRandomClientId();
  if (typeof clienteId === "undefined") {
    errorRateGeneric.add(1);
    return;
  }

  // Action 1: Transaction
  group("POST /clientes/{id}/transacoes", function () {
    const transactionType = getRandomTransactionType();
    const amount = getRandomAmount(transactionType, clienteId);
    const description = getRandomDescription();
    const payload = JSON.stringify({
      valor: amount,
      tipo: transactionType,
      descricao: description,
    });
    const transacaoUrl = `${BASE_URL}/clientes/${clienteId}/transacoes`;
    const params = {
      headers: { "Content-Type": "application/json" },
      tags: { name: "TransacaoPOST", rinha: "transacoes" },
    };

    const res = http.post(transacaoUrl, payload, params);
    transacaoReqDuration.add(res.timings.duration);

    const isStatus200 = res.status === 200;
    const isStatus422 = res.status === 422;

    // ****** ACTUAL CHECKS FOR TRANSACTION ******
    check(res, {
      "[Transacao] Status is 200 (OK) or 422 (Unprocessable)":
        isStatus200 || isStatus422,
      "[Transacao] Response body is valid JSON if status 200": (r) =>
        !isStatus200 || (r.json() !== null && typeof r.json() === "object"),
      "[Transacao] Contains limite and saldo if status 200": (r) =>
        !isStatus200 ||
        (typeof r.json("limite") === "number" &&
          typeof r.json("saldo") === "number"),
      "[Transacao] Contains error message if status 422": (r) =>
        !isStatus422 ||
        (r.json() !== null && typeof r.json("error") === "string"),
    });
    // ******************************************

    if (isStatus200) {
      successfulTransacoes.add(1);
      errorRate422Transacao.add(0);
    } else if (isStatus422) {
      transacao422Counter.add(1);
      errorRate422Transacao.add(1);
    } else if (res.status === 404) {
      errorRate404.add(1);
      errorRate422Transacao.add(0);
      console.error(
        `Transacao - Client ID '${clienteId}' (URL: ${transacaoUrl}) resulted in 404: ${res.body}`,
      );
    } else {
      errorRateGeneric.add(1);
      errorRate422Transacao.add(0);
      console.error(
        `Transacao - Unexpected status ${res.status} for URL ${transacaoUrl}. Body: ${res.body}`,
      );
    }
  });

  // Action 2: Extrato
  group("GET /clientes/{id}/extrato", function () {
    const extratoUrl = `${BASE_URL}/clientes/${clienteId}/extrato`;
    const params = { tags: { name: "ExtratoGET", rinha: "extrato" } };

    const res = http.get(extratoUrl, params);
    extratoReqDuration.add(res.timings.duration);

    const isStatus200 = res.status === 200;

    // ****** ACTUAL CHECKS FOR EXTRATO ******
    check(res, {
      "[Extrato] Status is 200 (OK)": isStatus200,
      "[Extrato] Response body is valid JSON": (r) =>
        !isStatus200 || (r.json() !== null && typeof r.json() === "object"),
      "[Extrato] Contains saldo object": (r) =>
        !isStatus200 ||
        (r.json("saldo") !== undefined && typeof r.json("saldo") === "object"),
      "[Extrato] saldo.total is a number": (r) =>
        !isStatus200 || typeof r.json("saldo.total") === "number",
      "[Extrato] saldo.limite is a number": (r) =>
        !isStatus200 || typeof r.json("saldo.limite") === "number",
      "[Extrato] saldo.data_extrato is present": (r) =>
        !isStatus200 || typeof r.json("saldo.data_extrato") === "string",
      "[Extrato] ultimas_transacoes is an array": (r) =>
        !isStatus200 || Array.isArray(r.json("ultimas_transacoes")),
      "[Extrato] ultimas_transacoes has max 10 entries": (r) =>
        !isStatus200 || r.json("ultimas_transacoes").length <= 10,
    });
    // **************************************

    if (isStatus200) {
      successfulExtratos.add(1);
    } else if (res.status === 404) {
      errorRate404.add(1);
      console.error(
        `Extrato - Client ID '${clienteId}' (URL: ${extratoUrl}) resulted in 404: ${res.body}`,
      );
    } else {
      errorRateGeneric.add(1);
      console.error(
        `Extrato - Unexpected status ${res.status} for URL ${extratoUrl}. Body: ${res.body}`,
      );
    }
  });

  // Optional: Add a small sleep at the end of each VU iteration if desired for pacing
  sleep(0.05); // e.g., 50ms
}