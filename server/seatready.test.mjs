import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import {
  Enquiry,
  eligibleCourses,
  sampleMatch,
  quoteSnapshot,
  verifyCapture,
  validateMatch,
} from "./domain.mjs";
import { createStore } from "./store.mjs";
import { createApp } from "./app.mjs";
const input = {
  text: "Our beginners want to use AI for emails and reports.",
  seats: 3,
  budget: 200,
  format: "online",
  mode: "sample",
};
test("validates input and rejects client-supplied prices", () => {
  assert.equal(Enquiry.safeParse(input).success, true);
  for (const patch of [
    { seats: -1 },
    { seats: 1.5 },
    { seats: 31 },
    { budget: NaN },
    { text: "short" },
    { totalCents: 1 },
    { format: "video" },
  ])
    assert.equal(Enquiry.safeParse({ ...input, ...patch }).success, false);
});
test("enforces budget, format and current capacity before asking AI", () => {
  assert.deepEqual(
    eligibleCourses({ ...input, budget: 150 }).map((c) => c.id),
    ["ai-workday"],
  );
  assert.equal(eligibleCourses({ ...input, budget: 10 }).length, 0);
  assert.equal(eligibleCourses({ ...input, format: "in_person" }).length, 0);
  assert.equal(eligibleCourses(input, () => 2).length, 0);
});
test("sample matching does not force an unrelated course", () => {
  const e = {
    ...input,
    text: "We want an advanced scuba diving certification.",
  };
  assert.equal(sampleMatch(e, eligibleCourses(e)).courseId, null);
  assert.equal(
    sampleMatch(input, eligibleCourses(input)).courseId,
    "ai-workday",
  );
});
test("rejects AI course ids outside the eligible set", () => {
  assert.throws(() =>
    validateMatch(
      { courseId: "invented", summary: "Fake", reasons: [], questions: [] },
      eligibleCourses(input),
    ),
  );
});
test("calculates price from trusted catalogue in integer cents", () => {
  assert.equal(quoteSnapshot("ai-workday", 3).totalCents, 44700);
  assert.throws(() => quoteSnapshot("unknown", 3));
});
test("quotes are isolated by browser session and not automatically paid", () => {
  const s = createStore(":memory:");
  const q = s.add("ai-workday", 3, "session-a");
  assert.equal(q.status, "quoted");
  assert.equal(s.get(q.id, "session-b"), undefined);
  assert.equal(s.list("session-b").length, 0);
  s.db.close();
});
test("reserving multiple orders cannot oversell the sample course", () => {
  const s = createStore(":memory:");
  const a = s.add("ai-workday", 8, "a"),
    b = s.add("ai-workday", 8, "b");
  s.reserve(a.id, "a");
  assert.equal(s.available("ai-workday"), 4);
  assert.throws(() => s.reserve(b.id, "b"), /enough seats/);
  s.reserve(a.id, "a");
  assert.equal(s.available("ai-workday"), 4);
  s.db.close();
});
test("expired quotes cannot start checkout and release unconfirmed holds", () => {
  const s = createStore(":memory:");
  const q = s.add("ai-workday", 5, "a");
  s.reserve(q.id, "a");
  s.db
    .prepare("UPDATE quotes SET expiresAt=? WHERE id=?")
    .run(Date.now() - 1, q.id);
  assert.equal(s.available("ai-workday"), 12);
  assert.throws(() => s.reserve(q.id, "a"), /expired/);
  s.db.close();
});
function capture(q) {
  return {
    id: q.orderId,
    status: "COMPLETED",
    purchase_units: [
      {
        custom_id: q.id,
        payments: {
          captures: [
            {
              id: "CAPTURE-1",
              status: "COMPLETED",
              amount: { currency_code: "USD", value: "447.00" },
            },
          ],
        },
      },
    ],
  };
}
test("requires matching completed capture, currency, amount and quote identity", () => {
  const q = {
    id: "quote-1",
    orderId: "ORDER-1",
    totalCents: 44700,
    currency: "USD",
  };
  assert.equal(verifyCapture(capture(q), q), "CAPTURE-1");
  for (const mutate of [
    (x) => (x.status = "APPROVED"),
    (x) => (x.id = "OTHER"),
    (x) => (x.purchase_units[0].custom_id = "OTHER"),
    (x) => (x.purchase_units[0].payments.captures[0].status = "PENDING"),
    (x) => (x.purchase_units[0].payments.captures[0].amount.value = "0.01"),
    (x) =>
      (x.purchase_units[0].payments.captures[0].amount.currency_code = "MYR"),
  ]) {
    const x = capture(q);
    mutate(x);
    assert.throws(() => verifyCapture(x, q));
  }
});
async function fixture(t, configured = false) {
  const store = createStore(":memory:");
  let captures = 0,
    creates = 0;
  let lastQuote;
  const providers = {
    status: () => ({
      ai: { configured: false, lastStatus: "untested" },
      paypal: { configured, environment: "sandbox", clientId: null },
    }),
    recommend: async () => {
      throw new Error("Live AI must not be called in these tests");
    },
    createOrder: async (q) => {
      creates++;
      lastQuote = q;
      return { id: "ORDER-1" };
    },
    getOrder: async () => ({ status: "APPROVED" }),
    captureOrder: async (q) => {
      captures++;
      return capture(q);
    },
  };
  const app = createApp({
    store,
    providers,
    allowedOrigins: ["http://localhost:5180"],
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => {
    server.close();
    store.db.close();
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const status = await fetch(base + "/api/status");
  const cookie = status.headers.get("set-cookie").split(";")[0];
  const post = (path, body = {}, extra = {}) =>
    fetch(base + "/api" + path, {
      method: "POST",
      headers: {
        Origin: "http://localhost:5180",
        "Content-Type": "application/json",
        Cookie: cookie,
        ...extra,
      },
      body: JSON.stringify(body),
    });
  return {
    post,
    store,
    providers,
    counts: () => ({ captures, creates }),
    lastQuote: () => lastQuote,
  };
}
test("API rejects foreign origins, invalid bodies and tampered quotes", async (t) => {
  const { post } = await fixture(t);
  assert.equal(
    (await post("/recommend", input, { Origin: "https://attacker.example" }))
      .status,
    403,
  );
  assert.equal((await post("/recommend", { ...input, seats: 0 })).status, 400);
  assert.equal(
    (await post("/recommend", { ...input, totalCents: 1 })).status,
    400,
  );
});
test("sample quote works; disconnected PayPal never starts an order", async (t) => {
  const { post, counts } = await fixture(t);
  const r = await post("/recommend", input);
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.equal(data.source, "sample");
  assert.equal(data.quote.totalCents, 44700);
  const payment = await post(`/quotes/${data.quote.id}/order`, {});
  assert.equal(payment.status, 503);
  assert.equal(counts().creates, 0);
});
test("order and capture retries are idempotent; paid state follows verified capture", async (t) => {
  const { post, counts } = await fixture(t, true);
  const { quote } = await (await post("/recommend", input)).json();
  const ids = await Promise.all([
    post(`/quotes/${quote.id}/order`),
    post(`/quotes/${quote.id}/order`),
  ]);
  assert.equal(
    ids.every((r) => r.ok),
    true,
  );
  assert.equal(counts().creates, 1);
  const a = await (await post(`/quotes/${quote.id}/capture`)).json();
  assert.equal(a.status, "paid");
  assert.equal(a.captureId, "CAPTURE-1");
  const b = await (await post(`/quotes/${quote.id}/capture`)).json();
  assert.equal(b.captureId, a.captureId);
  assert.equal(counts().captures, 1);
});

test("reconciles a completed remote capture after local expiry without charging again", async (t) => {
  const { post, store, providers, counts } = await fixture(t, true);
  const { quote } = await (await post("/recommend", input)).json();
  await post(`/quotes/${quote.id}/order`);
  store.db
    .prepare("UPDATE quotes SET status='capturing',expiresAt=? WHERE id=?")
    .run(Date.now() - 1000, quote.id);
  providers.getOrder = async () => capture({ ...quote, orderId: "ORDER-1" });
  const response = await post(`/quotes/${quote.id}/capture`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "paid");
  assert.equal(counts().captures, 0);
});

test("checking a booking never initiates a new payment", async (t) => {
  const { post, providers, counts } = await fixture(t, true);
  const { quote } = await (await post("/recommend", input)).json();
  await post(`/quotes/${quote.id}/order`);
  let response = await post(`/quotes/${quote.id}/reconcile`);
  assert.equal((await response.json()).status, "ordered");
  assert.equal(counts().captures, 0);
  providers.getOrder = async () => capture({ ...quote, orderId: "ORDER-1" });
  response = await post(`/quotes/${quote.id}/reconcile`);
  assert.equal((await response.json()).status, "paid");
  assert.equal(counts().captures, 0);
});
