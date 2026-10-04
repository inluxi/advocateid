export const OUTCOMES = ["petition_allowed", "petition_dismissed", "partly_allowed", "settled", "pending", "other"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const OUTCOME_LABELS: Record<Outcome, string> = {
  petition_allowed: "Petition allowed",
  petition_dismissed: "Petition dismissed",
  partly_allowed: "Partly allowed",
  settled: "Settled",
  pending: "Pending",
  other: "Other",
};

export const LANGUAGE_OPTIONS: { code: string; name: string }[] = [
  { code: "en", name: "English" },
  { code: "ml", name: "Malayalam" },
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "kn", name: "Kannada" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "bn", name: "Bengali" },
  { code: "gu", name: "Gujarati" },
  { code: "pa", name: "Punjabi" },
  { code: "ur", name: "Urdu" },
];

/** Safe highlight labels (the editor offers these; format is number + label only). */
export const HIGHLIGHT_LABELS = [
  "Years in practice",
  "Court appearances",
  "Offices",
  "Lawyers",
  "Languages",
  "Courts",
  "Practice areas",
  "Publications",
  "Years established",
] as const;
