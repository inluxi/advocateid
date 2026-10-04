import { z } from "zod";
import { ABOUT_MAX, BIO_MAX, INTRO_MAX, MAX_POST_CATEGORIES, NOTE_MAX, OFFICE_ABOUT_MAX, POST_BODY_MAX, UPDATE_BODY_MAX } from "./entitlements";
import { HIGHLIGHT_LABELS, OUTCOMES } from "./outcomes";
import { isHttpUrl } from "./text";

const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));
const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine(isHttpUrl, "Enter a full web address starting with http:// or https://");
const optUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || isHttpUrl(v), "Enter a full web address starting with http:// or https://");
const year = z.number().int().min(1900).max(new Date().getUTCFullYear() + 1);

export const sendOtpSchema = z.object({
  mobile: z.string().trim().min(10).max(20),
  consent: z.literal(true, { error: "Consent is required to continue" }),
});
export const verifyOtpSchema = z.object({
  mobile: z.string().trim().min(10).max(20),
  otp: z.string().trim().regex(/^\d{6}$/),
});

export const createPageSchema = z.object({
  type: z.enum(["advocate", "firm"]),
  name: text(120).min(2),
  slug: z.string().trim().toLowerCase(),
  districtId: z.number().int().positive(),
  enrolmentNo: z.string().trim().max(40).optional(),
  yearEnrolled: year.optional(),
  establishedYear: year.optional(),
});

export const updatePageSchema = z
  .object({
    name: text(120).min(2),
    bio: optText(BIO_MAX),
    about: optText(ABOUT_MAX),
    districtId: z.number().int().positive(),
    language: z.enum(["en", "ml"]),
    yearEnrolled: year.nullable(),
    establishedYear: year.nullable(),
    enrolmentNo: z.string().trim().min(3).max(40),
    contactMobile: z.string().trim().max(20),
    lat: z.number().min(6).max(38).nullable(),
    lng: z.number().min(67).max(98).nullable(),
    brandColour: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
    showMemberOf: z.boolean(),
    allowMembers: z.boolean(),
    seoTitle: optText(70),
    seoDescription: optText(160),
    photoAlt: optText(120),
    bannerAlt: optText(120),
    photoKey: z.string().max(300).nullable(),
    bannerKey: z.string().max(300).nullable(),
    acknowledgeWording: z.boolean().optional(),
  })
  .partial();

export const slugSchema = z.object({ slug: z.string().trim().toLowerCase() });

export const listItemSchemas = {
  courts: z.object({ courtId: z.number().int().positive() }),
  categories: z.object({ categoryId: z.number().int().positive() }),
  languages: z.object({ languageCode: z.string().regex(/^[a-z]{2,3}$/) }),
  career: z.object({
    yearFrom: year,
    yearTo: year.nullable().optional().transform((v) => v ?? null),
    title: text(120).min(2),
    institution: optText(120),
    description: optText(200),
  }),
  // Locked format: a number up to 3 digits and a label from the fixed list (no free text)
  highlights: z.object({
    number: z.number().int().min(0).max(999),
    label: z.enum(HIGHLIGHT_LABELS),
  }),
  links: z.object({ url: httpUrl, label: optText(60) }),
  cases: z.object({
    courtId: z.number().int().positive(),
    role: text(80).min(2),
    year,
    outcome: z.enum(OUTCOMES),
    note: optText(NOTE_MAX),
    link: optUrl,
    postId: z.number().int().positive().nullable().optional().transform((v) => v ?? null),
  }),
  offices: z.object({
    name: text(100).min(2),
    address: optText(300),
    localityId: z.number().int().positive().nullable().optional().transform((v) => v ?? null),
    pincode: z.string().trim().regex(/^\d{6}$/).optional().nullable().transform((v) => v ?? null),
    phone: z.string().trim().max(20).optional().nullable().transform((v) => v || null),
    hours: optText(120),
    about: optText(OFFICE_ABOUT_MAX),
    lat: z.number().min(6).max(38).nullable().optional().transform((v) => v ?? null),
    lng: z.number().min(67).max(98).nullable().optional().transform((v) => v ?? null),
    courtIds: z.array(z.number().int().positive()).max(10).optional(),
  }),
} as const;

export type ListName = keyof typeof listItemSchemas;
export const LIST_NAMES = Object.keys(listItemSchemas) as ListName[];

export const postSchema = z.object({
  title: text(160).min(3),
  body: z.string().trim().min(10).max(POST_BODY_MAX),
  language: z.enum(["en", "ml"]).default("en"),
  categoryIds: z.array(z.number().int().positive()).max(MAX_POST_CATEGORIES).default([]),
  courtId: z.number().int().positive().nullable().optional().transform((v) => v ?? null),
  sourceUrl: optUrl,
  coverImageKey: z.string().max(300).nullable().optional().transform((v) => v ?? null),
  acknowledgeWording: z.boolean().optional(),
});

export const courtUpdateSchema = z.object({
  title: text(160).min(3),
  body: z.string().trim().min(10).max(UPDATE_BODY_MAX),
  courtId: z.number().int().positive(),
  sourceUrl: httpUrl,
  language: z.enum(["en", "ml"]).default("en"),
  acknowledgeWording: z.boolean().optional(),
});

export const membershipRequestSchema = z.object({
  firmPageId: z.number().int().positive(),
  title: text(80).min(2),
  officeId: z.number().int().positive().nullable().optional().transform((v) => v ?? null),
});

export const membershipUpdateSchema = z.object({
  title: text(80).optional(),
  officeId: z.number().int().positive().nullable().optional(),
  intro: optText(INTRO_MAX).optional(),
  acknowledgeWording: z.boolean().optional(),
});

export const reportSchema = z.object({
  targetType: z.enum(["page", "post", "update"]),
  targetId: z.number().int().positive(),
  reason: z.enum(["promotional", "false_information", "unlawful", "privacy", "impersonation", "other"]),
  details: optText(1000),
  captchaToken: z.string(),
  captchaAnswer: z.string().max(10),
});

export const grievanceSchema = z.object({
  name: text(120).min(2),
  contact: text(120).min(5),
  subject: text(160).min(3),
  message: text(3000).min(10),
  captchaToken: z.string(),
  captchaAnswer: z.string().max(10),
});

export const contactSchema = z.object({
  kind: z.enum(["general", "court_request"]).default("general"),
  name: text(120).min(2),
  contact: text(120).min(5),
  message: text(2000).min(5),
  captchaToken: z.string(),
  captchaAnswer: z.string().max(10),
});

export const domainSchema = z.object({ hostname: z.string().trim().min(4).max(253) });
