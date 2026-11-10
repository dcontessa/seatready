// Fictional demonstration data. Never represented as a real provider's schedule or prices.
export const courses = [
  {
    id: "ai-workday",
    title: "AI for the Everyday Workday",
    category: "AI & productivity",
    level: "Beginner",
    format: "online",
    date: "2026-12-04",
    time: "09:00–13:00 MYT",
    duration: "Half day",
    priceCents: 14900,
    currency: "USD",
    capacity: 12,
    topics: ["AI", "emails", "reports", "writing", "productivity", "prompts"],
    description:
      "Use AI to draft clearer emails, summarise documents and improve everyday work. No technical background needed.",
    outcomes: [
      "Write and refine useful prompts",
      "Draft emails and reports with review",
      "Recognise errors and protect private information",
    ],
  },
  {
    id: "excel-decisions",
    title: "Excel for Better Decisions",
    category: "Data & reporting",
    level: "Intermediate",
    format: "online",
    date: "2026-12-08",
    time: "09:00–17:00 MYT",
    duration: "1 day",
    priceCents: 18900,
    currency: "USD",
    capacity: 8,
    topics: ["excel", "spreadsheet", "data", "dashboard", "pivot", "reporting"],
    description:
      "Turn messy spreadsheets into useful reports with formulas, pivot tables and clear dashboards.",
    outcomes: [
      "Clean and structure a workbook",
      "Build pivot tables and formulas",
      "Present a useful reporting dashboard",
    ],
  },
  {
    id: "confident-presentations",
    title: "Present with Confidence",
    category: "Communication",
    level: "Beginner",
    format: "in_person",
    date: "2026-12-11",
    time: "09:00–17:00 MYT",
    duration: "1 day",
    priceCents: 22900,
    currency: "USD",
    capacity: 10,
    topics: [
      "presentation",
      "speaking",
      "storytelling",
      "communication",
      "slides",
    ],
    description:
      "Plan a focused message, design clear slides and practise delivering a confident presentation.",
    outcomes: [
      "Structure a convincing story",
      "Create concise visual slides",
      "Practise delivery and handle questions",
    ],
  },
];
export const courseById = (id) => courses.find((c) => c.id === id);
export const amount = (cents) => (cents / 100).toFixed(2);
