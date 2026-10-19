import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Availability } from "@/components/Availability";
import { CommentsPlaceholder } from "@/components/CommentsPlaceholder";
import { ContactTracker } from "@/components/ContactTracker";
import { getOfficial, getOfficials, getResponseRates } from "@/lib/data";
import { mapsUrl, num, officeAddressLine, officeKindLabel, partyClass, yelpUrl } from "@/lib/format";
import { officeMetrics } from "@/lib/metrics";

export async function generateStaticParams() {
  return (await getOfficials()).map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: PageProps<"/officials/[slug]">): Promise<Metadata> {
  const official = await getOfficial((await params).slug);
  return official ? { title: `${official.name}, ${official.title}` } : {};
}

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 font-mono text-2xl tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export default async function OfficialPage({ params }: PageProps<"/officials/[slug]">) {
  const { slug } = await params;
  const [official, rates] = await Promise.all([getOfficial(slug), getResponseRates()]);
  if (!official) notFound();

  const o = official;
  const m = officeMetrics(o);
  const c = o.contact;
  const inArea = o.offices.filter((f) => f.kind !== "capitol");
  const capitol = o.offices.filter((f) => f.kind === "capitol");

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
        ← All officials
      </Link>

      <header className="flex flex-wrap items-center gap-5">
        {o.photoUrl && (
          <Image
            src={o.photoUrl}
            alt={`Official portrait of ${o.name}`}
            width={96}
            height={117}
            className="rounded-md border border-slate-200 bg-slate-100 object-cover"
          />
        )}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{o.name}</h1>
          <p className="text-slate-600">
            {o.title} ·{" "}
            <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${partyClass(o.party)}`}>{o.party}</span>
          </p>
          <p className="text-sm text-slate-500">
            Represents {o.jurisdiction.name}
            {o.websiteUrl && (
              <>
                {" · "}
                <a href={o.websiteUrl} className="underline" target="_blank" rel="noreferrer">
                  Official website
                </a>
              </>
            )}
          </p>
        </div>
      </header>

      {o.statusNote && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          {o.statusNote}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="In-area offices" value={String(m.officeCount)} hint="Excludes DC and mailing-only addresses" />
        <Stat
          label="Offices per 1,000 sq mi"
          value={num(m.perThousandSqMi, m.perThousandSqMi < 10 ? 2 : 0)}
          hint={`${num(o.jurisdiction.landAreaSqMi, 1)} sq mi of land`}
        />
        <Stat
          label="Offices per 100,000 people"
          value={num(m.perHundredThousand, 2)}
          hint={`${num(o.jurisdiction.population)} residents`}
        />
        <Stat
          label="People per office"
          value={m.residentsPerOffice ? num(m.residentsPerOffice) : "—"}
          hint={m.sqMiPerOffice ? `${num(m.sqMiPerOffice)} sq mi per office` : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Offices">
          <ul className="space-y-3">
            {[...inArea, ...capitol].map((f) => (
              <li key={f.slug} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{f.name}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] ${
                      f.kind === "capitol" || f.kind === "mailing"
                        ? "bg-slate-100 text-slate-500"
                        : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {officeKindLabel[f.kind]}
                    {f.kind === "capitol" || f.kind === "mailing" ? " · not counted" : ""}
                  </span>
                </div>
                <div className="text-sm text-slate-600">{officeAddressLine(f)}</div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {f.phone && (
                    <a href={`tel:${f.phone.replace(/[^0-9+]/g, "")}`} className="underline">
                      {f.phone}
                    </a>
                  )}
                  {f.hours && <span className="text-slate-500">{f.hours}</span>}
                  {f.kind !== "mailing" && (
                    <a href={mapsUrl(f)} target="_blank" rel="noreferrer" className="text-slate-500 underline">
                      Map
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="How to reach them">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-slate-500">Email</dt>
            <dd>
              {c.emailPublic ? (
                <a href={`mailto:${c.emailPublic}`} className="underline">
                  {c.emailPublic}
                </a>
              ) : (
                <span className="text-slate-600">No public address; web form only</span>
              )}
            </dd>
            <dt className="text-slate-500">Web form</dt>
            <dd>
              {c.webformUrl ? (
                <a href={c.webformUrl} target="_blank" rel="noreferrer" className="underline">
                  Contact form
                </a>
              ) : (
                <Availability value={null} />
              )}
              {c.webformRequiresZip && (
                <span className="ml-2 text-xs text-slate-500">requires an in-district address or ZIP</span>
              )}
            </dd>
            <dt className="text-slate-500">Phone</dt>
            <dd>
              <Availability value={c.phone} yes="Yes, numbers under Offices" />
            </dd>
            <dt className="text-slate-500">In person</dt>
            <dd>
              <Availability value={c.inPerson} />
              {c.inPersonNotes && <div className="text-xs text-slate-500">{c.inPersonNotes}</div>}
            </dd>
            <dt className="text-slate-500">Mobile office hours</dt>
            <dd>
              <Availability value={c.mobileOfficeHours} no="None found" />
            </dd>
            <dt className="text-slate-500">Meeting request</dt>
            <dd>
              {c.meetingRequestUrl ? (
                <a href={c.meetingRequestUrl} target="_blank" rel="noreferrer" className="underline">
                  Request form
                </a>
              ) : (
                <span className="text-slate-500">None found</span>
              )}
            </dd>
            <dt className="text-slate-500">Casework</dt>
            <dd>
              {c.caseworkUrl ? (
                <a href={c.caseworkUrl} target="_blank" rel="noreferrer" className="underline">
                  Help with a federal agency
                </a>
              ) : (
                <span className="text-slate-500">None found</span>
              )}
            </dd>
          </dl>
        </Section>
      </div>

      <ContactTracker official={o} rates={rates[o.slug] ?? null} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Public schedule">
          <p className="text-sm">
            Publishes a daily schedule:{" "}
            <Availability value={o.schedule.publishesDailySchedule} no="None found" />
          </p>
          {o.schedule.scheduleUrl && (
            <p className="mt-1 text-sm">
              <a href={o.schedule.scheduleUrl} className="underline" target="_blank" rel="noreferrer">
                Calendar page
              </a>
            </p>
          )}
          {o.schedule.notes && <p className="mt-2 text-xs text-slate-500">{o.schedule.notes}</p>}
          <h3 className="mt-4 text-sm font-semibold">Last 10 constituent or lobbyist meetings</h3>
          {o.schedule.recentMeetings.length ? (
            <ul className="mt-2 space-y-1 text-sm">
              {o.schedule.recentMeetings.map((mt, i) => (
                <li key={i}>
                  <span className="font-mono text-xs text-slate-500">{mt.date}</span> {mt.who}
                  {mt.topic && <span className="text-slate-500"> · {mt.topic}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-slate-500">No published schedule to draw meetings from.</p>
          )}
        </Section>

        <Section title="Reviews">
          <p className="mb-3 text-sm text-slate-600">
            Ratings aren&apos;t pulled in yet. Search the review sites for each office:
          </p>
          <ul className="space-y-1 text-sm">
            {inArea
              .filter((f) => f.kind === "district" || f.kind === "satellite")
              .map((f) => (
                <li key={f.slug} className="flex flex-wrap gap-x-3">
                  <span className="min-w-28 text-slate-700">{f.name}</span>
                  <a href={mapsUrl(f)} target="_blank" rel="noreferrer" className="underline">
                    Google Maps
                  </a>
                  <a href={yelpUrl(o.name, f)} target="_blank" rel="noreferrer" className="underline">
                    Yelp
                  </a>
                </li>
              ))}
          </ul>
        </Section>
      </div>

      <Section id="scorecards" title="Good-government scorecards and ratings">
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {o.scorecards.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer" className="font-medium underline">
                {s.org}
              </a>
              <span className="text-slate-500"> · {s.title}</span>
            </li>
          ))}
        </ul>
      </Section>

      <CommentsPlaceholder official={o} />

      <Section title="Sources">
        <p className="mb-2 text-xs text-slate-500">
          Last verified {o.verifiedAt}. Area: {o.jurisdiction.areaSource}. Population: {o.jurisdiction.populationSource}.
        </p>
        {o.researchNotes && <p className="mb-2 text-xs text-slate-500">Research notes: {o.researchNotes}</p>}
        <ul className="space-y-0.5 text-xs">
          {[...new Set(o.sources)].map((s) => (
            <li key={s} className="truncate">
              <a href={s} target="_blank" rel="noreferrer" className="text-slate-600 underline">
                {s}
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
