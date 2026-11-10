import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { courses, courseById } from "./catalogue.mjs";
import { AppError, quoteSnapshot } from "./domain.mjs";
export function createStore(file) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(
    "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS quotes (id TEXT PRIMARY KEY, session TEXT NOT NULL, courseId TEXT NOT NULL, seats INTEGER NOT NULL, totalCents INTEGER NOT NULL, currency TEXT NOT NULL, createdAt INTEGER NOT NULL, expiresAt INTEGER NOT NULL, status TEXT NOT NULL, orderId TEXT UNIQUE, captureId TEXT UNIQUE);",
  );
  const get = (id, session) =>
    db
      .prepare("SELECT * FROM quotes WHERE id=? AND session=?")
      .get(id, session);
  function available(courseId, exclude = "") {
    const used = db
      .prepare(
        "SELECT COALESCE(SUM(seats),0) AS n FROM quotes WHERE courseId=? AND id<>? AND (status='paid' OR status='capturing' OR (status IN ('creating','ordered') AND expiresAt>?))",
      )
      .get(courseId, exclude, Date.now()).n;
    return Math.max(0, (courseById(courseId)?.capacity ?? 0) - Number(used));
  }
  function requireQuote(id, session) {
    const q = get(id, session);
    if (!q) throw new AppError("Booking quote not found.", 404);
    return q;
  }
  function add(courseId, seats, session) {
    const q = {
      id: randomUUID(),
      session,
      ...quoteSnapshot(courseId, seats),
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000,
      status: "quoted",
    };
    if (available(courseId) < seats)
      throw new AppError(
        "There are no longer enough seats. Please find a course again.",
        409,
      );
    db.prepare(
      "INSERT INTO quotes (id,session,courseId,seats,totalCents,currency,createdAt,expiresAt,status) VALUES (?,?,?,?,?,?,?,?,?)",
    ).run(
      q.id,
      q.session,
      q.courseId,
      q.seats,
      q.totalCents,
      q.currency,
      q.createdAt,
      q.expiresAt,
      q.status,
    );
    return get(q.id, session);
  }
  function reserve(id, session) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const q = requireQuote(id, session);
      if (q.status === "paid") {
        db.exec("COMMIT");
        return q;
      }
      if (q.expiresAt < Date.now())
        throw new AppError(
          "This quote expired. Please find a course again.",
          409,
        );
      if (available(q.courseId, id) < q.seats)
        throw new AppError(
          "There are no longer enough seats. Please find a course again.",
          409,
        );
      if (q.status === "quoted")
        db.prepare("UPDATE quotes SET status='creating' WHERE id=?").run(id);
      db.exec("COMMIT");
      return requireQuote(id, session);
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  function order(id, orderId) {
    db.prepare(
      "UPDATE quotes SET orderId=?,status='ordered' WHERE id=? AND status='creating'",
    ).run(orderId, id);
  }
  function capturing(id, session) {
    const q = reserve(id, session);
    if (q.status === "paid") return q;
    if (q.status !== "ordered" && q.status !== "capturing")
      throw new AppError("The PayPal order is not ready.", 409);
    db.prepare("UPDATE quotes SET status='capturing' WHERE id=?").run(id);
    return requireQuote(id, session);
  }
  function paid(id, captureId) {
    db.prepare("UPDATE quotes SET status='paid',captureId=? WHERE id=?").run(
      captureId,
      id,
    );
  }
  function list(session) {
    return db
      .prepare("SELECT * FROM quotes WHERE session=? ORDER BY createdAt DESC")
      .all(session);
  }
  return {
    db,
    get,
    requireQuote,
    available,
    add,
    reserve,
    order,
    capturing,
    paid,
    list,
    catalogue: () => courses.map((c) => ({ ...c, available: available(c.id) })),
  };
}
