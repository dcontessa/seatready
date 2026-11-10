export type Format = "any" | "online" | "in_person";
export type Enquiry = {
  text: string;
  seats: number;
  budget: number;
  format: Format;
  mode: "live" | "sample";
};
export type Course = {
  id: string;
  title: string;
  category: string;
  level: string;
  format: Exclude<Format, "any">;
  date: string;
  time: string;
  duration: string;
  priceCents: number;
  currency: string;
  capacity: number;
  available: number;
  description: string;
  outcomes: string[];
};
export type Quote = {
  id: string;
  courseId: string;
  course: Course;
  seats: number;
  totalCents: number;
  currency: string;
  createdAt: number;
  expiresAt: number;
  status: "quoted" | "creating" | "ordered" | "capturing" | "paid";
  orderId: string | null;
  captureId: string | null;
};
export type Recommendation = {
  match: {
    courseId: string | null;
    summary: string;
    reasons: string[];
    questions: string[];
  };
  quote: Quote | null;
  source: "live" | "sample" | "catalogue";
};
export type ConnectionStatus = {
  ai: { configured: boolean; lastStatus: string; model: string };
  paypal: {
    configured: boolean;
    environment: "sandbox";
    clientId: string | null;
  };
  catalogue: "sample";
  localOnly: boolean;
};
