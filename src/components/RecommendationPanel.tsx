import { useEffect, useState } from "react";
import { ArrowRight, Check, Download } from "lucide-react";
import { dateLabel, money } from "../api";
import type { ConnectionStatus, Quote, Recommendation } from "../types";
import { PayPalCheckout } from "./PayPalCheckout";
export function RecommendationPanel({
  result,
  review,
  onReview,
  status,
  onPaid,
  onConnections,
  onBookings,
}: {
  result: Recommendation | null;
  review: boolean;
  onReview: () => void;
  status: ConnectionStatus | null;
  onPaid: (q: Quote) => void;
  onConnections: () => void;
  onBookings: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setAgreed(false);
  }, [result?.quote?.id]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!result)
    return (
      <aside
        className="match-panel empty-panel"
        aria-label="How SeatReady helps"
      >
        <h2>A good fit starts here.</h2>
        <p>
          Your course match, transparent pricing and next steps will appear
          here.
        </p>
        <div className="principles">
          {[
            ["The right level", "A course that fits their experience."],
            ["A clear price", "A quote from the course catalogue."],
            ["A considered booking", "Review every detail before checkout."],
          ].map(([title, body], i) => (
            <div className="principle" key={title}>
              <span className="number">0{i + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="control-note">You stay in control.</p>
      </aside>
    );
  const q = result.quote,
    c = q?.course;
  const paid = q?.status === "paid";
  const expired = !!q && q.expiresAt < now && !paid;
  function download() {
    if (!q) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            project: "SeatReady",
            environment: "sandbox",
            sampleCatalogue: true,
            booking: q,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seatready-${q.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <aside className="match-panel result" aria-live="polite">
      <div className="result-origin">
        {result.source === "live"
          ? "AI recommendation"
          : result.source === "sample"
            ? "Sample matching · no AI call"
            : "Catalogue check"}
      </div>
      <h2>
        {paid
          ? "A seat at the table."
          : q
            ? review
              ? "Review your booking."
              : "A thoughtful match."
            : "Let’s refine the enquiry."}
      </h2>
      <p>{result.match.summary}</p>
      {result.match.reasons.length > 0 && (
        <ul className="reasons">
          {result.match.reasons.map((r, i) => (
            <li key={i}>
              <Check size={17} />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
      {c && q && (
        <>
          <div className="course-recommendation">
            <span className="category">
              {c.category} · {c.level}
            </span>
            <h3>{c.title}</h3>
            <p>
              {dateLabel(c.date)} ·{" "}
              {c.format === "online" ? "Online" : "Kuala Lumpur"}
            </p>
            <p>
              {c.time} · {c.duration}
            </p>
            <div className="quote-line">
              <span>
                {q.seats} seats × {money(c.priceCents)}
              </span>
              <strong>{money(q.totalCents)}</strong>
            </div>
            <p className="fine-print">
              Fictional course and price. No extra fees in this sandbox quote.
            </p>
          </div>
          {paid ? (
            <div className="confirmation">
              <Check size={26} />
              <h3>Sandbox payment confirmed</h3>
              <p>
                This is a test booking. No real training seat has been
                purchased.
              </p>
              <p className="reference">Capture: {q.captureId}</p>
              <button onClick={download} className="secondary">
                <Download size={17} /> Download booking record
              </button>
            </div>
          ) : expired ? (
            <div className="error" role="alert">
              This quote has expired. If you opened PayPal checkout, check the
              booking record before creating another quote.
              <button className="text-button" onClick={onBookings}>
                View booking records
              </button>
            </div>
          ) : review ? (
            <div className="checkout">
              <p className="fine-print">
                Quote expires at{" "}
                {new Date(q.expiresAt).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                . Availability is rechecked at checkout.
              </p>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>
                  I’ve reviewed the course, date, seats and total. This is a
                  sandbox test.
                </span>
              </label>
              {status?.paypal.configured ? (
                agreed ? (
                  <PayPalCheckout
                    quote={q}
                    clientId={status.paypal.clientId!}
                    onPaid={onPaid}
                  />
                ) : (
                  <p className="fine-print">
                    Review the details above to enable PayPal sandbox checkout.
                  </p>
                )
              ) : (
                <div className="connection-note">
                  <strong>PayPal sandbox needs connecting</strong>
                  <p>
                    Your quote is ready. Checkout will become available after
                    the sandbox account is connected.
                  </p>
                  <button className="text-button" onClick={onConnections}>
                    View connections <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onReview} className="primary">
              Review booking <ArrowRight size={20} />
            </button>
          )}
        </>
      )}
      {result.match.questions.length > 0 && (
        <div className="questions">
          {result.match.questions.map((q, i) => (
            <p key={i}>{q}</p>
          ))}
        </div>
      )}
    </aside>
  );
}
