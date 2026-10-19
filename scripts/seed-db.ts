// Loads src/data/seed.json into Postgres. Safe to re-run: reference data is
// replaced, user-generated tables (constituents, contact attempts, comments) are untouched.
//
// Usage: DATABASE_URL=... npm run db:seed
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as t from "../src/db/schema";
import seed from "../src/data/seed.json";

type OfficeKind = (typeof t.officeKind.enumValues)[number];
type JurisdictionType = (typeof t.jurisdictionType.enumValues)[number];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client);

  await db.transaction(async (tx) => {
    const jurisdictionIds = new Map<string, number>();
    for (const o of seed.officials) {
      const j = o.jurisdiction;
      if (jurisdictionIds.has(j.key)) continue;
      const values = {
        key: j.key,
        name: j.name,
        type: j.type as JurisdictionType,
        geoid: j.geoid,
        landAreaSqMi: j.landAreaSqMi,
        population: j.population,
        areaSource: j.areaSource,
        populationSource: j.populationSource,
        sources: j.sources,
      };
      const [row] = await tx
        .insert(t.jurisdictions)
        .values(values)
        .onConflictDoUpdate({ target: t.jurisdictions.key, set: values })
        .returning({ id: t.jurisdictions.id });
      jurisdictionIds.set(j.key, row.id);
    }

    // Anyone no longer in the seed is marked out of office rather than deleted,
    // so their contact history and comments survive.
    await tx.update(t.officials).set({ inOffice: false });

    for (const o of seed.officials) {
      const values = {
        slug: o.slug,
        bioguide: o.bioguide,
        name: o.name,
        fullName: o.fullName,
        level: o.level as "federal",
        chamber: o.chamber,
        title: o.title,
        district: o.district,
        party: o.party,
        jurisdictionId: jurisdictionIds.get(o.jurisdiction.key)!,
        websiteUrl: o.websiteUrl,
        photoUrl: o.photoUrl,
        statusNote: o.statusNote,
        inOffice: true,
        sources: o.sources,
        researchNotes: o.researchNotes,
        verifiedAt: o.verifiedAt,
      };
      const [{ id }] = await tx
        .insert(t.officials)
        .values(values)
        .onConflictDoUpdate({ target: t.officials.slug, set: values })
        .returning({ id: t.officials.id });

      // Offices are upserted by slug so contact attempts keep their office reference.
      const keep = new Set(o.offices.map((off) => off.slug));
      for (const off of o.offices) {
        const ov = { ...off, kind: off.kind as OfficeKind, officialId: id };
        await tx
          .insert(t.offices)
          .values(ov)
          .onConflictDoUpdate({ target: [t.offices.officialId, t.offices.slug], set: ov });
      }
      for (const existing of await tx.select().from(t.offices).where(eq(t.offices.officialId, id))) {
        if (!keep.has(existing.slug)) await tx.delete(t.offices).where(eq(t.offices.id, existing.id));
      }

      const contact = { officialId: id, ...o.contact };
      await tx.insert(t.contactProfiles).values(contact).onConflictDoUpdate({ target: t.contactProfiles.officialId, set: contact });

      const schedule = {
        officialId: id,
        publishesDailySchedule: o.schedule.publishesDailySchedule,
        scheduleUrl: o.schedule.scheduleUrl,
        notes: o.schedule.notes,
      };
      await tx.insert(t.schedules).values(schedule).onConflictDoUpdate({ target: t.schedules.officialId, set: schedule });

      await tx.delete(t.meetings).where(eq(t.meetings.officialId, id));
      const meetings = o.schedule.recentMeetings as { date: string; who: string; topic: string | null }[];
      if (meetings.length) await tx.insert(t.meetings).values(meetings.map((m) => ({ ...m, officialId: id })));

      await tx.delete(t.scorecards).where(eq(t.scorecards.officialId, id));
      if (o.scorecards.length) await tx.insert(t.scorecards).values(o.scorecards.map((s) => ({ ...s, officialId: id })));
    }
  });

  console.log(`Seeded ${seed.officials.length} officials.`);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
