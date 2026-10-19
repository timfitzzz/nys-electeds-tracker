import { cacheLife, cacheTag } from "next/cache";
import { count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import * as t from "@/db/schema";
import seed from "@/data/seed.json";
import type { Official, OfficeKind, PhoneCheckOutcome, ResponseRates } from "./types";

/** Minimum completed contacts on a channel before a response rate is shown. */
export const MIN_SAMPLE = 10;

async function loadFromDb(): Promise<Official[]> {
  if (!db) throw new Error("DATABASE_URL is not set");
  const [officials, jurisdictions, offices, contacts, schedules, meetings, scorecards, phoneChecks] = await Promise.all([
    db.select().from(t.officials).where(eq(t.officials.inOffice, true)),
    db.select().from(t.jurisdictions),
    db.select().from(t.offices),
    db.select().from(t.contactProfiles),
    db.select().from(t.schedules),
    db.select().from(t.meetings),
    db.select().from(t.scorecards),
    db.select().from(t.phoneChecks),
  ]);
  const byOfficial = <R extends { officialId: number }>(rows: R[]) => {
    const m = new Map<number, R[]>();
    for (const r of rows) m.set(r.officialId, [...(m.get(r.officialId) ?? []), r]);
    return m;
  };
  const jById = new Map(jurisdictions.map((j) => [j.id, j]));
  const officesBy = byOfficial(offices);
  const meetingsBy = byOfficial(meetings);
  const scorecardsBy = byOfficial(scorecards);
  const phoneChecksBy = byOfficial(phoneChecks);
  const officeSlugById = new Map(offices.map((f) => [f.id, f.slug]));
  const contactBy = new Map(contacts.map((c) => [c.officialId, c]));
  const scheduleBy = new Map(schedules.map((s) => [s.officialId, s]));

  return officials.map((o) => {
    const j = jById.get(o.jurisdictionId)!;
    const c = contactBy.get(o.id);
    const s = scheduleBy.get(o.id);
    return {
      slug: o.slug,
      bioguide: o.bioguide,
      name: o.name,
      fullName: o.fullName,
      level: o.level,
      chamber: o.chamber,
      title: o.title,
      district: o.district,
      party: o.party,
      websiteUrl: o.websiteUrl,
      photoUrl: o.photoUrl,
      statusNote: o.statusNote,
      jurisdiction: {
        key: j.key,
        name: j.name,
        type: j.type,
        geoid: j.geoid,
        landAreaSqMi: j.landAreaSqMi,
        population: j.population,
        areaSource: j.areaSource,
        populationSource: j.populationSource,
        sources: j.sources,
      },
      offices: (officesBy.get(o.id) ?? [])
        .sort((a, b) => a.id - b.id)
        .map((f) => ({
          slug: f.slug,
          name: f.name,
          kind: f.kind,
          address: f.address,
          suite: f.suite,
          city: f.city,
          state: f.state,
          zip: f.zip,
          phone: f.phone,
          hours: f.hours,
          latitude: f.latitude,
          longitude: f.longitude,
        })),
      contact: {
        emailPublic: c?.emailPublic ?? null,
        webformUrl: c?.webformUrl ?? null,
        webformRequiresZip: c?.webformRequiresZip ?? null,
        phone: c?.phone ?? null,
        meetingRequestUrl: c?.meetingRequestUrl ?? null,
        inPerson: c?.inPerson ?? null,
        inPersonNotes: c?.inPersonNotes ?? null,
        mobileOfficeHours: c?.mobileOfficeHours ?? null,
        caseworkUrl: c?.caseworkUrl ?? null,
      },
      phoneChecks: (phoneChecksBy.get(o.id) ?? [])
        .sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime())
        .map((p) => ({
          officeSlug: p.officeId ? (officeSlugById.get(p.officeId) ?? null) : null,
          phoneNumber: p.phoneNumber,
          checkedAt: p.checkedAt.toISOString(),
          outcome: p.outcome,
          inSession: p.inSession,
          notes: p.notes,
        })),
      schedule: {
        publishesDailySchedule: s?.publishesDailySchedule ?? null,
        scheduleUrl: s?.scheduleUrl ?? null,
        notes: s?.notes ?? null,
        recentMeetings: (meetingsBy.get(o.id) ?? [])
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 10)
          .map((m) => ({ date: m.date, who: m.who, topic: m.topic })),
      },
      scorecards: (scorecardsBy.get(o.id) ?? [])
        .sort((a, b) => a.id - b.id)
        .map((sc) => ({ org: sc.org, title: sc.title, url: sc.url })),
      sources: o.sources,
      researchNotes: o.researchNotes,
      verifiedAt: o.verifiedAt,
    };
  });
}

function loadFromSeed(): Official[] {
  return seed.officials.map((o) => ({
    ...o,
    offices: o.offices.map((off) => ({ ...off, kind: off.kind as OfficeKind })),
    phoneChecks: o.phoneChecks.map((p) => ({ ...p, outcome: p.outcome as PhoneCheckOutcome })),
  })) as Official[];
}

const chamberOrder = ["us_senate", "us_house"];

/** All officials, senators first, then House members by district. */
export async function getOfficials(): Promise<Official[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("officials");
  const list = db ? await loadFromDb() : loadFromSeed();
  return list.sort(
    (a, b) =>
      chamberOrder.indexOf(a.chamber) - chamberOrder.indexOf(b.chamber) || (a.district ?? 0) - (b.district ?? 0),
  );
}

export async function getOfficial(slug: string): Promise<Official | undefined> {
  return (await getOfficials()).find((o) => o.slug === slug);
}

/**
 * Response rate per channel for contacts made through this site, keyed by official slug.
 * A rate is null until MIN_SAMPLE contacts on that channel have a final outcome.
 */
export async function getResponseRates(): Promise<Record<string, ResponseRates>> {
  "use cache";
  cacheLife("hours");
  cacheTag("contact-attempts");
  if (!db) return {};
  const rows = await db
    .select({
      slug: t.officials.slug,
      channel: t.contactAttempts.channel,
      total: count(),
      responded: sql<number>`count(*) filter (where ${t.contactAttempts.outcome} = 'responded')`.mapWith(Number),
    })
    .from(t.contactAttempts)
    .innerJoin(t.officials, eq(t.officials.id, t.contactAttempts.officialId))
    .where(inArray(t.contactAttempts.outcome, ["responded", "no_response"]))
    .groupBy(t.officials.slug, t.contactAttempts.channel);

  const out: Record<string, ResponseRates> = {};
  for (const r of rows) {
    out[r.slug] ??= { call: null, email: null, webform: null };
    if (r.total >= MIN_SAMPLE) out[r.slug][r.channel] = r.responded / r.total;
  }
  return out;
}
