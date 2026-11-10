import express from "express";
import { randomUUID } from "node:crypto";
import {
  Enquiry,
  AppError,
  eligibleCourses,
  sampleMatch,
  verifyCapture,
} from "./domain.mjs";
import { courseById } from "./catalogue.mjs";
export function createApp({
  store,
  providers,
  allowedOrigins = [
    "http://localhost:5180",
    "http://127.0.0.1:5180",
    "http://localhost:4181",
    "http://127.0.0.1:4181",
  ],
}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    if (
      req.method !== "GET" &&
      (!allowedOrigins.includes(req.get("origin")) ||
        !req.is("application/json"))
    )
      return res.status(403).json({
        error: "Open SeatReady in its local browser tab to continue.",
      });
    const match = /\bseatready_session=([a-f0-9-]{36})\b/.exec(
      req.get("cookie") || "",
    );
    req.session = match?.[1] || randomUUID();
    if (!match)
      res.cookie("seatready_session", req.session, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    next();
  });
  const safe = (q) =>
    q
      ? {
          id: q.id,
          courseId: q.courseId,
          course: courseById(q.courseId),
          seats: q.seats,
          totalCents: q.totalCents,
          currency: q.currency,
          createdAt: q.createdAt,
          expiresAt: q.expiresAt,
          status: q.status,
          orderId: q.orderId,
          captureId: q.captureId,
        }
      : null;
  app.get("/api/status", (_req, res) =>
    res.json({ ...providers.status(), catalogue: "sample", localOnly: true }),
  );
  app.get("/api/courses", (_req, res) => res.json(store.catalogue()));
  app.get("/api/bookings", (req, res) =>
    res.json(store.list(req.session).map(safe)),
  );
  const counts = new Map();
  app.post("/api/recommend", async (req, res) => {
    const check = Enquiry.safeParse(req.body);
    if (!check.success) throw new AppError(check.error.issues[0].message);
    const enquiry = check.data;
    const now = Date.now();
    let count = counts.get(req.session);
    if (!count || count.reset < now) {
      count = { used: 0, reset: now + 60000 };
      counts.set(req.session, count);
    }
    if (++count.used > 6)
      throw new AppError(
        "Please wait a minute before requesting another match.",
        429,
      );
    const eligible = eligibleCourses(enquiry, (id) => store.available(id));
    const match = eligible.length
      ? enquiry.mode === "sample"
        ? sampleMatch(enquiry, eligible)
        : await providers.recommend(enquiry, eligible)
      : {
          courseId: null,
          summary:
            "No course meets the selected budget, format and seat count.",
          reasons: [],
          questions: [
            "Try a smaller group, another format or a different budget.",
          ],
        };
    const quote = match.courseId
      ? store.add(match.courseId, enquiry.seats, req.session)
      : null;
    res.json({
      match,
      quote: safe(quote),
      source: eligible.length ? enquiry.mode : "catalogue",
      sampleCatalogue: true,
    });
  });
  const creating = new Map(),
    capturing = new Map();
  async function single(map, id, fn) {
    if (map.has(id)) return map.get(id);
    const p = fn().finally(() => map.delete(id));
    map.set(id, p);
    return p;
  }
  app.post("/api/quotes/:id/order", async (req, res) => {
    if (!providers.status().paypal.configured)
      throw new AppError(
        "PayPal sandbox is not connected yet. No payment has been started.",
        503,
        "PAYPAL_NOT_CONFIGURED",
      );
    store.requireQuote(req.params.id, req.session);
    const result = await single(creating, req.params.id, async () => {
      const q = store.reserve(req.params.id, req.session);
      if (q.orderId) return { id: q.orderId };
      const order = await providers.createOrder(q);
      if (!order.id)
        throw new AppError("PayPal did not return an order ID.", 502);
      store.order(q.id, order.id);
      return { id: order.id };
    });
    res.json(result);
  });
  app.post("/api/quotes/:id/capture", async (req, res) => {
    const q = store.requireQuote(req.params.id, req.session);
    if (!q.orderId)
      throw new AppError("Start checkout before confirming payment.", 409);
    const result = await single(capturing, q.id, async () => {
      const current = store.requireQuote(q.id, req.session);
      if (current.status === "paid") return safe(current);
      // Reconcile a completed remote payment even if the local quote expired
      // during a timeout. A new capture still requires an unexpired quote.
      let data = await providers.getOrder(current.orderId);
      let locked = current;
      if (data.status !== "COMPLETED") {
        locked = store.capturing(q.id, req.session);
        data = await providers.captureOrder(locked);
      }
      const captureId = verifyCapture(data, locked);
      store.paid(q.id, captureId);
      return safe(store.requireQuote(q.id, req.session));
    });
    res.json(result);
  });
  app.post("/api/quotes/:id/reconcile", async (req, res) => {
    const q = store.requireQuote(req.params.id, req.session);
    if (!q.orderId || q.status === "paid") return res.json(safe(q));
    const result = await single(capturing, q.id, async () => {
      const data = await providers.getOrder(q.orderId);
      if (data.status === "COMPLETED") {
        store.paid(q.id, verifyCapture(data, q));
      }
      return safe(store.requireQuote(q.id, req.session));
    });
    res.json(result);
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "API route not found." }),
  );
  app.use((err, _req, res, _next) => {
    const expected = err instanceof AppError;
    res
      .status(
        expected ? err.status : err.type === "entity.parse.failed" ? 400 : 500,
      )
      .json({
        error: expected
          ? err.message
          : "The request could not be completed. Please try again.",
        code: expected ? err.code : "REQUEST_FAILED",
      });
  });
  return app;
}
