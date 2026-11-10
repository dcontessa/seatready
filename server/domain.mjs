import { z } from "zod";
import { courses, courseById } from "./catalogue.mjs";
export const Enquiry = z
  .object({
    text: z
      .string()
      .trim()
      .min(15, "Add at least 15 characters about the training need.")
      .max(3000),
    seats: z.number().int().min(1).max(30),
    budget: z.number().min(1).max(10000),
    format: z.enum(["any", "online", "in_person"]),
    mode: z.enum(["live", "sample"]).default("live"),
  })
  .strict();
export class AppError extends Error {
  constructor(message, status = 400, code = "INVALID_REQUEST") {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function eligibleCourses(enquiry, availability) {
  return courses.filter(
    (c) =>
      c.priceCents <= Math.round(enquiry.budget * 100) &&
      (enquiry.format === "any" || c.format === enquiry.format) &&
      enquiry.seats <= (availability?.(c.id) ?? c.capacity),
  );
}
export function validateMatch(match, eligible) {
  if (
    !match ||
    !Array.isArray(match.reasons) ||
    !Array.isArray(match.questions) ||
    typeof match.summary !== "string"
  )
    throw new AppError(
      "The AI response could not be verified. Please try again.",
      502,
      "AI_RESPONSE_INVALID",
    );
  if (match.courseId !== null && !eligible.some((c) => c.id === match.courseId))
    throw new AppError(
      "The AI selected an unavailable course. Please try again.",
      502,
      "AI_RESPONSE_INVALID",
    );
  return match;
}
export function sampleMatch(enquiry, eligible) {
  const terms = enquiry.text.toLowerCase();
  const ranked = eligible
    .map((c) => ({
      c,
      score: c.topics.filter((t) => new RegExp(`\\b${t}\\b`, "i").test(terms))
        .length,
    }))
    .sort((a, b) => b.score - a.score);
  const c = ranked[0]?.score > 0 ? ranked[0].c : null;
  return {
    courseId: c?.id ?? null,
    summary: c
      ? "This sample match uses a simple keyword check."
      : "No suitable sample course was found for this enquiry.",
    reasons: c
      ? [
          "The enquiry mentions topics covered by this course.",
          "The course fits the selected format, budget and seat count.",
        ]
      : [],
    questions: c
      ? []
      : ["Could you tell us more about the skills you want to learn?"],
  };
}
export function quoteSnapshot(courseId, seats) {
  const c = courseById(courseId);
  if (!c || !Number.isInteger(seats) || seats < 1 || seats > c.capacity)
    throw new AppError("Invalid course or seat count.");
  return {
    courseId: c.id,
    courseTitle: c.title,
    seats,
    unitCents: c.priceCents,
    totalCents: c.priceCents * seats,
    currency: c.currency,
  };
}
export function verifyCapture(data, quote) {
  const units = data?.purchase_units;
  const captures = units?.flatMap((u) => u.payments?.captures ?? []) ?? [];
  const capture = captures[0];
  if (
    data?.id !== quote.orderId ||
    data?.status !== "COMPLETED" ||
    units?.length !== 1 ||
    units[0].custom_id !== quote.id ||
    captures.length !== 1 ||
    typeof capture?.id !== "string" ||
    !capture.id ||
    capture?.status !== "COMPLETED" ||
    capture.amount?.currency_code !== quote.currency ||
    capture.amount?.value !== (quote.totalCents / 100).toFixed(2)
  )
    throw new AppError(
      "PayPal has not confirmed the expected payment. The booking is not marked paid.",
      409,
      "CAPTURE_UNVERIFIED",
    );
  return capture.id;
}
