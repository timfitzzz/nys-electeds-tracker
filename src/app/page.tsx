import Link from "next/link";
import { OfficialsTable, type TableRow } from "@/components/OfficialsTable";
import { getOfficials, getResponseRates } from "@/lib/data";
import { officeMetrics } from "@/lib/metrics";

export default async function Home() {
  const [officials, rates] = await Promise.all([getOfficials(), getResponseRates()]);

  const rows: TableRow[] = officials.map((o) => {
    const m = officeMetrics(o);
    const r = rates[o.slug];
    return {
      slug: o.slug,
      name: o.name,
      title: o.title,
      party: o.party,
      chamber: o.chamber,
      district: o.district,
      statusNote: o.statusNote,
      officeCount: m.officeCount,
      perThousandSqMi: m.perThousandSqMi,
      perHundredThousand: m.perHundredThousand,
      landAreaSqMi: o.jurisdiction.landAreaSqMi,
      population: o.jurisdiction.population,
      email: o.contact.emailPublic ? true : false,
      phone: o.contact.phone,
      webform: o.contact.webformUrl ? true : null,
      inPerson: o.contact.inPerson,
      callbackRate: r?.call ?? null,
      emailRate: r?.email ?? null,
      webformRate: r?.webform ?? null,
      publishesSchedule: o.schedule.publishesDailySchedule,
      scorecardCount: o.scorecards.length,
    };
  });

  const verified = officials.map((o) => o.verifiedAt).filter(Boolean).sort().at(-1);

  return (
    <div className="space-y-6">
      <section className="max-w-3xl space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          How well do New York&apos;s elected officials serve their constituents?
        </h1>
        <p className="text-slate-600">
          Starting with New York&apos;s 2 U.S. senators and 26 House members: how many local offices they keep for the
          area they represent, how you can reach them, whether they publish their schedules, and (soon) how often they
          actually respond when you contact them through this site.
        </p>
        <p className="text-xs text-slate-500">
          Office counts exclude Washington, DC offices and mailing-only addresses. Response rates appear once enough
          tracked contacts have come in. Facts last verified {verified}. <Link href="/methodology" className="underline">How this is measured</Link>.
        </p>
      </section>
      <OfficialsTable rows={rows} />
    </div>
  );
}
