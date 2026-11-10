import { ArrowRight, LoaderCircle } from "lucide-react";
import type { Enquiry, Format } from "../types";
export const examples: { label: string; enquiry: Enquiry }[] = [
  {
    label: "AI for beginners",
    enquiry: {
      text: "Our team of 3 wants to use AI to write better emails and reports. We are beginners and can attend online.",
      seats: 3,
      budget: 200,
      format: "online",
      mode: "live",
    },
  },
  {
    label: "Excel for a team",
    enquiry: {
      text: "We have 4 analysts who already know basic Excel. They want to learn pivot tables, formulas and reporting dashboards online.",
      seats: 4,
      budget: 200,
      format: "online",
      mode: "live",
    },
  },
  {
    label: "No suitable course",
    enquiry: {
      text: "We need an advanced scuba diving certification for two experienced divers, including open-water practice.",
      seats: 2,
      budget: 500,
      format: "any",
      mode: "live",
    },
  },
];
export function EnquiryForm({
  value,
  onChange,
  onSubmit,
  busy,
}: {
  value: Enquiry;
  onChange: (v: Enquiry) => void;
  onSubmit: () => void;
  busy: boolean;
}) {
  const update = (patch: Partial<Enquiry>) => onChange({ ...value, ...patch });
  return (
    <form
      className="enquiry panel"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h2>Tell us what they need</h2>
      <p className="subcopy">
        Start with an enquiry. We’ll help with the rest.
      </p>
      <fieldset disabled={busy}>
        <label htmlFor="enquiry">Training enquiry</label>
        <textarea
          id="enquiry"
          value={value.text}
          onChange={(e) => update({ text: e.target.value })}
          minLength={15}
          maxLength={3000}
          required
          rows={4}
        />
        <div className="field-row">
          <div>
            <label htmlFor="seats">Seats</label>
            <input
              id="seats"
              type="number"
              min="1"
              max="30"
              step="1"
              required
              value={value.seats || ""}
              onChange={(e) => update({ seats: Number(e.target.value) })}
            />
          </div>
          <div>
            <label htmlFor="budget">Budget per person (USD)</label>
            <input
              id="budget"
              type="number"
              min="1"
              max="10000"
              step="0.01"
              required
              value={value.budget || ""}
              onChange={(e) => update({ budget: Number(e.target.value) })}
            />
          </div>
        </div>
        <span id="format-label" className="label">
          Preferred format
        </span>
        <div role="group" aria-labelledby="format-label" className="segments">
          {(["any", "online", "in_person"] as Format[]).map((format) => (
            <button
              key={format}
              type="button"
              aria-pressed={value.format === format}
              onClick={() => update({ format })}
            >
              {format === "any"
                ? "Any"
                : format === "online"
                  ? "Online"
                  : "In person"}
            </button>
          ))}
        </div>
        <button className="primary find" type="submit">
          {busy ? (
            <>
              <LoaderCircle className="spin" size={20} /> Finding a thoughtful
              match…
            </>
          ) : (
            <>
              Find a course <ArrowRight size={22} />
            </>
          )}
        </button>
      </fieldset>
      <p className="fine-print">
        Sample course data. No real bookings or charges.
      </p>
    </form>
  );
}
