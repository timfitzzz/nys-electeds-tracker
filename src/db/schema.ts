import {
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Reference data: who represents whom, and how to reach them.
// ---------------------------------------------------------------------------

export const governmentLevel = pgEnum("government_level", ["federal", "state", "county", "municipal"]);

export const jurisdictionType = pgEnum("jurisdiction_type", [
  "state",
  "congressional_district",
  "state_senate_district",
  "assembly_district",
  "county",
  "county_district",
  "municipality",
  "council_district",
]);

/** An area an official represents. Land area and population drive the per-area and per-capita metrics. */
export const jurisdictions = pgTable("jurisdictions", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // e.g. "NY", "NY-12"
  name: text("name").notNull(),
  type: jurisdictionType("type").notNull(),
  geoid: text("geoid"), // Census GEOID
  landAreaSqMi: doublePrecision("land_area_sq_mi").notNull(),
  population: integer("population").notNull(),
  areaSource: text("area_source").notNull(),
  populationSource: text("population_source").notNull(),
  sources: jsonb("sources").$type<string[]>().notNull().default([]),
});

export const officials = pgTable("officials", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  bioguide: text("bioguide").unique(), // federal only
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  level: governmentLevel("level").notNull(),
  chamber: text("chamber").notNull(), // us_senate, us_house, ny_senate, ny_assembly, ...
  title: text("title").notNull(),
  district: integer("district"),
  party: text("party"),
  jurisdictionId: integer("jurisdiction_id")
    .notNull()
    .references(() => jurisdictions.id),
  websiteUrl: text("website_url"),
  photoUrl: text("photo_url"),
  statusNote: text("status_note"),
  inOffice: boolean("in_office").notNull().default(true),
  sources: jsonb("sources").$type<string[]>().notNull().default([]),
  researchNotes: text("research_notes"),
  verifiedAt: date("verified_at"),
});

/**
 * district: full-time office in the area represented
 * satellite: part-time or limited-hours office in the area
 * mobile: recurring mobile office hours at a fixed spot
 * mailing: mailing address only (PO box), not a walk-in office
 * capitol: Washington DC (or Albany for state legislators) office, excluded from per-area metrics
 */
export const officeKind = pgEnum("office_kind", ["district", "satellite", "mobile", "mailing", "capitol"]);

export const offices = pgTable(
  "offices",
  {
    id: serial("id").primaryKey(),
    officialId: integer("official_id")
      .notNull()
      .references(() => officials.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    kind: officeKind("kind").notNull(),
    address: text("address"),
    suite: text("suite"),
    city: text("city"),
    state: text("state"),
    zip: text("zip"),
    phone: text("phone"),
    hours: text("hours"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
  },
  (t) => [uniqueIndex("offices_official_slug").on(t.officialId, t.slug)],
);

/** One row per official. Nullable booleans mean "not verified yet". */
export const contactProfiles = pgTable("contact_profiles", {
  officialId: integer("official_id")
    .primaryKey()
    .references(() => officials.id, { onDelete: "cascade" }),
  emailPublic: text("email_public"),
  webformUrl: text("webform_url"),
  webformRequiresZip: boolean("webform_requires_zip"),
  phone: boolean("phone"),
  meetingRequestUrl: text("meeting_request_url"),
  inPerson: boolean("in_person"),
  inPersonNotes: text("in_person_notes"),
  mobileOfficeHours: boolean("mobile_office_hours"),
  caseworkUrl: text("casework_url"),
});

export const schedules = pgTable("schedules", {
  officialId: integer("official_id")
    .primaryKey()
    .references(() => officials.id, { onDelete: "cascade" }),
  publishesDailySchedule: boolean("publishes_daily_schedule"),
  scheduleUrl: text("schedule_url"),
  notes: text("notes"),
});

export const meetingKind = pgEnum("meeting_kind", ["constituent", "lobbyist", "organization", "government", "other"]);

/** Meetings taken from a published schedule. */
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  officialId: integer("official_id")
    .notNull()
    .references(() => officials.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  who: text("who").notNull(),
  topic: text("topic"),
  kind: meetingKind("kind").notNull().default("other"),
  sourceUrl: text("source_url"),
});

export const scorecards = pgTable("scorecards", {
  id: serial("id").primaryKey(),
  officialId: integer("official_id")
    .notNull()
    .references(() => officials.id, { onDelete: "cascade" }),
  org: text("org").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  score: text("score"), // e.g. "87%", "A-"; null when we only link out
  period: text("period"), // e.g. "2025"
});

/**
 * What happened when someone called an office line. Having a number listed says
 * little; this records whether calling it reaches anyone.
 *
 * answered_live: a person picked up
 * voicemail: no answer, but you can leave a message
 * voicemail_full: voicemail box exists but is full or not accepting messages
 * recorded_message: a recording only (e.g. "office closed for recess"), no way to leave a message
 * redirected: forwarded or told to call another office (often DC)
 * no_voicemail: rings out, no voicemail
 * line_off: line disconnected, turned off or not ringing
 * busy: busy signal
 */
export const phoneCheckOutcome = pgEnum("phone_check_outcome", [
  "answered_live",
  "voicemail",
  "voicemail_full",
  "recorded_message",
  "redirected",
  "no_voicemail",
  "line_off",
  "busy",
]);

/**
 * One call to an office line and its outcome. Rows come from curated checks in
 * data/phone-checks.json (source "curated"), user reports, and later from calls
 * placed through the site (source "call_through").
 */
export const phoneChecks = pgTable("phone_checks", {
  id: serial("id").primaryKey(),
  officialId: integer("official_id")
    .notNull()
    .references(() => officials.id, { onDelete: "cascade" }),
  // Null when the report didn't say which office was called.
  officeId: integer("office_id").references(() => offices.id, { onDelete: "set null" }),
  phoneNumber: text("phone_number"),
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull(),
  outcome: phoneCheckOutcome("outcome").notNull(),
  // Whether the legislature was in session when the call was made, since some offices shut lines during recess.
  inSession: boolean("in_session"),
  source: text("source").notNull(), // curated, user_report, call_through
  notes: text("notes"),
});

/** Third-party reviews of an office (Yelp, Google). Placeholder until a review source is chosen. */
export const reviewSources = pgTable("review_sources", {
  id: serial("id").primaryKey(),
  officeId: integer("office_id")
    .notNull()
    .references(() => offices.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // yelp, google
  url: text("url").notNull(),
  rating: doublePrecision("rating"),
  reviewCount: integer("review_count"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// User-generated data (stubbed: schema only, nothing writes these yet).
// ---------------------------------------------------------------------------

export const verificationStatus = pgEnum("verification_status", ["unverified", "pending", "verified", "rejected"]);

/**
 * A site user. Residency is verified before they can comment; only the matched
 * jurisdictions are stored, never the raw address.
 */
export const constituents = pgTable("constituents", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  displayName: text("display_name"),
  verificationStatus: verificationStatus("verification_status").notNull().default("unverified"),
  verificationMethod: text("verification_method"), // e.g. "mailed_code", "voter_file_match"
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Which jurisdictions a verified constituent lives in (derived from their verified address). */
export const constituentJurisdictions = pgTable(
  "constituent_jurisdictions",
  {
    constituentId: uuid("constituent_id")
      .notNull()
      .references(() => constituents.id, { onDelete: "cascade" }),
    jurisdictionId: integer("jurisdiction_id")
      .notNull()
      .references(() => jurisdictions.id),
  },
  (t) => [uniqueIndex("constituent_jurisdictions_pk").on(t.constituentId, t.jurisdictionId)],
);

export const contactChannel = pgEnum("contact_channel", ["call", "email", "webform"]);
export const contactOutcome = pgEnum("contact_outcome", [
  "pending", // sent, waiting on the office
  "responded", // office replied
  "no_response", // follow-up window passed without a reply
  "withdrawn", // user cancelled
]);

/**
 * A contact made through this site. Calls are bridged through a tracked number,
 * emails are sent from a relay address, and web forms are submitted on the user's
 * behalf; replies (or the user's follow-up report) set the outcome. Response rates
 * per channel are computed from these rows.
 */
export const contactAttempts = pgTable("contact_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  officialId: integer("official_id")
    .notNull()
    .references(() => officials.id, { onDelete: "cascade" }),
  officeId: integer("office_id").references(() => offices.id),
  constituentId: uuid("constituent_id").references(() => constituents.id),
  channel: contactChannel("channel").notNull(),
  outcome: contactOutcome("outcome").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  followUpDueAt: timestamp("follow_up_due_at", { withTimezone: true }),
  // How the outcome was learned: "relay_reply", "callback_detected", "user_report"
  outcomeSource: text("outcome_source"),
  // Opaque token emailed to the user so they can report a reply without logging in.
  followUpToken: text("follow_up_token").unique(),
});

export const commentStatus = pgEnum("comment_status", ["pending", "published", "hidden"]);

/** Comments on an official. Only constituents verified in the official's jurisdiction may post. */
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  officialId: integer("official_id")
    .notNull()
    .references(() => officials.id, { onDelete: "cascade" }),
  constituentId: uuid("constituent_id")
    .notNull()
    .references(() => constituents.id),
  body: text("body").notNull(),
  status: commentStatus("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
