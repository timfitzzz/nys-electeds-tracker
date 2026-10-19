import type { Official, PhoneCheck, PhoneCheckOutcome } from "./types";

type Tone = "good" | "ok" | "bad" | "unknown";

export const phoneOutcomes: Record<PhoneCheckOutcome, { label: string; tone: Tone; rank: number }> = {
  answered_live: { label: "Answered live", tone: "good", rank: 0 },
  voicemail: { label: "Voicemail", tone: "ok", rank: 1 },
  redirected: { label: "Redirected", tone: "ok", rank: 2 },
  recorded_message: { label: "Recording only", tone: "bad", rank: 3 },
  voicemail_full: { label: "Voicemail full", tone: "bad", rank: 4 },
  busy: { label: "Busy", tone: "bad", rank: 5 },
  no_voicemail: { label: "No voicemail", tone: "bad", rank: 6 },
  line_off: { label: "Line off", tone: "bad", rank: 7 },
};

export interface PhoneStatus {
  label: string;
  tone: Tone;
  /** Latest check this status is based on, if any. */
  latest: PhoneCheck | null;
}

/** Latest check per office (official-level reports, with no office, count as their own line). */
export function latestByLine(checks: PhoneCheck[]): PhoneCheck[] {
  const seen = new Map<string, PhoneCheck>();
  for (const c of checks) {
    const key = c.officeSlug ?? "_unspecified";
    const prev = seen.get(key);
    if (!prev || c.checkedAt > prev.checkedAt) seen.set(key, c);
  }
  return [...seen.values()];
}

export function latestForOffice(checks: PhoneCheck[], officeSlug: string): PhoneCheck | null {
  return latestByLine(checks).find((c) => c.officeSlug === officeSlug) ?? null;
}

/**
 * Summary of how responsive an official's phones are: the best latest outcome
 * across the lines that have been called. A listed number nobody has tested
 * yet reads "Untested", not "Yes".
 */
export function phoneStatus(o: Official): PhoneStatus {
  const latest = latestByLine(o.phoneChecks).sort(
    (a, b) => phoneOutcomes[a.outcome].rank - phoneOutcomes[b.outcome].rank,
  )[0];
  if (latest) return { ...phoneOutcomes[latest.outcome], latest };
  if (o.contact.phone === false) return { label: "No number", tone: "bad", latest: null };
  if (o.contact.phone === null) return { label: "Unknown", tone: "unknown", latest: null };
  return { label: "Untested", tone: "unknown", latest: null };
}

export const toneClass: Record<Tone, string> = {
  good: "text-emerald-700 font-medium",
  ok: "text-sky-700",
  bad: "text-red-700",
  unknown: "text-slate-500",
};
