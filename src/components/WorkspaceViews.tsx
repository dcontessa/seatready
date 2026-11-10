import { useEffect, useState } from "react";
import { ArrowRight, Check, Download } from "lucide-react";
import { api, dateLabel, money } from "../api";
import type { ConnectionStatus, Course, Quote } from "../types";
export function Catalogue({ onSelect }: { onSelect: (c: Course) => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api<Course[]>("/courses")
      .then(setCourses)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <h1>Room to grow.</h1>
      <p className="lead">
        A small, fictional catalogue for testing meaningful course matches.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="catalogue-list">
        {courses.map((c) => (
          <article className="catalogue-course" key={c.id}>
            <div>
              <span className="category">
                {c.category} · {c.level}
              </span>
              <h2>{c.title}</h2>
              <p>{c.description}</p>
              <ul>
                {c.outcomes.map((o) => (
                  <li key={o}>
                    <Check size={16} />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
            <div className="course-meta">
              <strong>{money(c.priceCents)}</strong>
              <span>per person · sample price</span>
              <p>
                {dateLabel(c.date)}
                <br />
                {c.time}
                <br />
                {c.format === "online" ? "Online" : "Kuala Lumpur"} ·{" "}
                {c.duration}
                <br />
                {c.available} sample seats available
              </p>
              <button onClick={() => onSelect(c)} className="secondary">
                Start an enquiry <ArrowRight size={17} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
export function Bookings() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [checking, setChecking] = useState<string | null>(null);
  async function reconcile(id: string) {
    setChecking(id);
    setError("");
    setNotice("");
    try {
      const quote = await api<Quote>(`/quotes/${id}/reconcile`, {});
      setQuotes((items) => items.map((q) => (q.id === id ? quote : q)));
      setNotice(
        quote.status === "paid"
          ? "Sandbox payment verified."
          : "PayPal has not confirmed a completed payment. No new charge was requested.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChecking(null);
    }
  }
  useEffect(() => {
    api<Quote[]>("/bookings")
      .then(setQuotes)
      .catch((e) => setError(e.message));
  }, []);
  function download(q: Quote) {
    const a = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { environment: "sandbox", sampleCatalogue: true, ...q },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    a.href = url;
    a.download = `seatready-${q.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <h1>Every next step, in view.</h1>
      <p className="lead">
        Quotes and sandbox bookings from this browser. A quote is not a paid
        booking.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {!quotes.length ? (
        <div className="simple-empty">
          <h2>Your first booking starts with an enquiry.</h2>
          <p>Find a course in the booking desk to create a quote.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Seats</th>
                <th>Total</th>
                <th>Status</th>
                <th>Record</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td>
                    <strong>{q.course.title}</strong>
                    <small>
                      {dateLabel(q.course.date)} · {q.id.slice(0, 8)}
                    </small>
                  </td>
                  <td>{q.seats}</td>
                  <td>{money(q.totalCents)}</td>
                  <td>
                    {q.status === "paid" ? (
                      <span className="paid">Sandbox paid</span>
                    ) : q.status === "capturing" ? (
                      "Payment needs checking"
                    ) : q.expiresAt < Date.now() ? (
                      "Expired"
                    ) : q.status === "quoted" ? (
                      "Quote only"
                    ) : (
                      "Checkout started"
                    )}
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`Download quote ${q.id.slice(0, 8)}`}
                      onClick={() => download(q)}
                    >
                      <Download size={18} />
                    </button>
                    {q.orderId && q.status !== "paid" && (
                      <button
                        className="text-button"
                        disabled={checking !== null}
                        onClick={() => void reconcile(q.id)}
                      >
                        {checking === q.id ? "Checking…" : "Check payment"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {notice && (
        <p role="status" className="fine-print">
          {notice}
        </p>
      )}
    </>
  );
}
export function Connections({
  status,
  onRefresh,
}: {
  status: ConnectionStatus | null;
  onRefresh: () => void;
}) {
  return (
    <>
      <h1>Connected with care.</h1>
      <p className="lead">
        Clear boundaries between AI assistance, sample data and sandbox
        payments.
      </p>
      <div className="connections">
        <section>
          <h2>OpenAI</h2>
          <strong>
            {!status
              ? "Checking…"
              : !status.ai.configured
                ? "Not connected"
                : status.ai.lastStatus === "connected"
                  ? "Live response verified"
                  : status.ai.lastStatus === "untested"
                    ? "Key saved · awaiting first request"
                    : status.ai.lastStatus === "quota_or_rate_limit"
                      ? "API quota or rate limit"
                      : "Connection needs attention"}
          </strong>
          <p>
            Enquiry text and the sample catalogue are sent to OpenAI to
            recommend a course. The API key stays on the local server.
          </p>
          <p className="fine-print">
            Model: {status?.ai.model || "—"}. Seat counts and prices are checked
            separately by SeatReady.
          </p>
        </section>
        <section>
          <h2>PayPal</h2>
          <strong>
            {status?.paypal.configured
              ? "Sandbox credentials configured · payment not yet verified"
              : "Sandbox not connected"}
          </strong>
          <p>
            Checkout uses PayPal’s sandbox. SeatReady creates the order on the
            server and only confirms a booking after it verifies the capture.
          </p>
          <p className="fine-print">
            Live payments are disabled in this prototype.
          </p>
        </section>
        <section>
          <h2>Course catalogue</h2>
          <strong>Sample data only</strong>
          <p>
            All course dates, capacities and prices are fictional. They do not
            represent a real training provider’s offer.
          </p>
        </section>
        <section>
          <h2>Your workspace</h2>
          <strong>Local prototype</strong>
          <p>
            Booking records stay on this Mac. This version is designed for a
            single operator and is not publicly deployed.
          </p>
        </section>
      </div>
      <button className="secondary" onClick={onRefresh}>
        Refresh connection status
      </button>
    </>
  );
}
