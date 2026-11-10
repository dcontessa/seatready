import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { EnquiryForm, examples } from "./components/EnquiryForm";
import { RecommendationPanel } from "./components/RecommendationPanel";
import { Bookings, Catalogue, Connections } from "./components/WorkspaceViews";
import type {
  ConnectionStatus,
  Course,
  Enquiry,
  Recommendation,
} from "./types";
const pages = [
  "Booking desk",
  "Course catalogue",
  "Bookings",
  "Connections",
] as const;
type Page = (typeof pages)[number];
export default function App() {
  const [page, setPage] = useState<Page>("Booking desk");
  const [enquiry, setEnquiry] = useState<Enquiry>({ ...examples[0].enquiry });
  const [result, setResult] = useState<Recommendation | null>(null);
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const refresh = useCallback(() => {
    api<ConnectionStatus>("/status")
      .then(setStatus)
      .catch(() =>
        setError(
          "SeatReady’s local server is not responding. Please restart the app.",
        ),
      );
  }, []);
  useEffect(refresh, [refresh]);
  function change(v: Enquiry) {
    setEnquiry(v);
    setResult(null);
    setReview(false);
    setError("");
  }
  function reset() {
    change({ text: "", seats: 1, budget: 200, format: "any", mode: "live" });
    setPage("Booking desk");
  }
  async function match(mode: "live" | "sample" = "live") {
    setBusy(true);
    setError("");
    setResult(null);
    setReview(false);
    try {
      setResult(await api<Recommendation>("/recommend", { ...enquiry, mode }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      refresh();
    }
  }
  function select(c: Course) {
    change({
      text: `Our team wants to learn ${c.outcomes.join(", ").toLowerCase()}. Our current experience level is ${c.level.toLowerCase()}.`,
      seats: 1,
      budget: c.priceCents / 100,
      format: c.format,
      mode: "live",
    });
    setPage("Booking desk");
  }
  const step = review ? 2 : result?.quote ? 1 : 0;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("Booking desk");
          }}
          aria-label="SeatReady booking desk"
        >
          <span className="brand-mark">S</span>
          <span>
            <strong>SeatReady</strong>
            <small>Training, thoughtfully booked.</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          {pages.map((p) => (
            <button
              key={p}
              className={p === page ? "selected" : ""}
              aria-current={p === page ? "page" : undefined}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </nav>
        <p className="sidebar-footer">Sample catalogue • Sandbox only</p>
      </aside>
      <div className="workspace">
        <header>
          <span>{page}</span>
          <button className="secondary" disabled={busy} onClick={reset}>
            New enquiry
          </button>
        </header>
        <main>
          {page === "Booking desk" ? (
            <>
              <h1>Find their next step.</h1>
              <p className="lead">
                Turn a training enquiry into a clear course recommendation and a
                booking.
              </p>
              <ol className="steps" aria-label="Booking progress">
                {["Understand", "Recommend", "Book"].map((s, i) => (
                  <li
                    className={i === step ? "active" : i < step ? "done" : ""}
                    key={s}
                    aria-current={i === step ? "step" : undefined}
                  >
                    <span className="number">0{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <div className="desk-grid">
                <div>
                  <EnquiryForm
                    value={enquiry}
                    onChange={change}
                    onSubmit={() => void match()}
                    busy={busy}
                  />
                  {error && (
                    <div className="error-block" role="alert">
                      <strong>We couldn’t complete that match.</strong>
                      <p>{error}</p>
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => void match("sample")}
                      >
                        Use sample matching · no AI call
                      </button>
                    </div>
                  )}
                  <p className="data-note">
                    Enquiry text is sent to OpenAI for matching. Use sample
                    enquiries while testing.
                  </p>
                </div>
                <RecommendationPanel
                  result={result}
                  review={review}
                  onReview={() => setReview(true)}
                  status={status}
                  onPaid={(q) => setResult((r) => (r ? { ...r, quote: q } : r))}
                  onConnections={() => setPage("Connections")}
                  onBookings={() => setPage("Bookings")}
                />
              </div>
              <div className="examples">
                <strong>Try an example</strong>
                {examples.map((e) => (
                  <button
                    className="secondary"
                    key={e.label}
                    disabled={busy}
                    onClick={() => change({ ...e.enquiry })}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </>
          ) : page === "Course catalogue" ? (
            <Catalogue onSelect={select} />
          ) : page === "Bookings" ? (
            <Bookings />
          ) : (
            <Connections status={status} onRefresh={refresh} />
          )}
        </main>
      </div>
    </div>
  );
}
