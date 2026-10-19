import type { Metadata } from "next";

export const metadata: Metadata = { title: "Methodology" };

const items: { term: string; body: React.ReactNode }[] = [
  {
    term: "Offices",
    body: (
      <>
        Physical offices in the area the official represents: full-time district offices and part-time satellite
        offices. Washington, DC offices, mailing-only PO boxes and recurring mobile office hours are listed on each
        official&apos;s page but not counted. Office lists start from the{" "}
        <a href="https://github.com/unitedstates/congress-legislators" className="underline">
          unitedstates/congress-legislators
        </a>{" "}
        dataset and are checked against each member&apos;s official website.
      </>
    ),
  },
  {
    term: "Offices per 1,000 sq mi",
    body: (
      <>
        Counted offices divided by the land area of the district (or the state, for senators), times 1,000. Land area is
        the Census Bureau&apos;s AREALAND for the 119th Congress districts from{" "}
        <a
          href="https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/4"
          className="underline"
        >
          TIGERweb
        </a>
        ; water is excluded. Statewide land area is the sum of the 26 districts.
      </>
    ),
  },
  {
    term: "Offices per 100,000 people",
    body: (
      <>
        Counted offices divided by population, times 100,000. Population is from the 2020 Census redistricting data:
        20,201,249 for the state, and 776,971 for each House district, since New York&apos;s 2024 congressional map
        draws every district to within one person of that figure.
      </>
    ),
  },
  {
    term: "Contact channels",
    body: (
      <>
        Email means a publicly listed email address; nearly every office instead uses a web form, which is listed
        separately. Phone is covered below. In person means the office takes walk-ins or appointments, or holds town halls or mobile office
        hours. A question mark means we haven&apos;t verified it yet.
      </>
    ),
  },
  {
    term: "Phone",
    body: (
      <>
        A listed number isn&apos;t the same as a phone someone answers. For each office line we log what happened when
        someone called: answered live, voicemail, voicemail full, a recording only, redirected to another office, no
        voicemail, line off, or busy, with the date and whether the legislature was in session (some offices turn
        their lines off during recess). The table shows the best recent result across an official&apos;s lines, and
        &quot;Untested&quot; when nobody has logged a call yet. Calls placed through this site will add to the log
        once that feature is live.
      </>
    ),
  },
  {
    term: "Callback, email and web form reply rates",
    body: (
      <>
        Not live yet. The plan: you contact an office through this site (a bridged call, an email from a relay
        address, or the office&apos;s own form submitted for you), and we record whether the office responds, either
        automatically or by asking you afterwards. A rate is shown once 10 contacts on that channel have an outcome.
      </>
    ),
  },
  {
    term: "Daily schedule",
    body: (
      <>
        Whether the official posts a daily public schedule of meetings. An events page or newsletter announcing town
        halls doesn&apos;t count. When a schedule exists, the last ten meetings with constituents, organizations or
        lobbyists are listed. As of October 2026 we found no New York member of Congress publishing one.
      </>
    ),
  },
  {
    term: "Reviews",
    body: <>Links to each office on Google Maps and Yelp. Ratings aren&apos;t pulled in yet.</>,
  },
  {
    term: "Comments",
    body: (
      <>
        Not live yet. Only verified residents of an official&apos;s district or state will be able to comment. We plan
        to keep only the districts a verified address falls in, not the address itself.
      </>
    ),
  },
  {
    term: "Scorecards",
    body: (
      <>
        Links to independent ratings and records for each official: GovTrack report cards, Vote Smart&apos;s collection
        of interest-group ratings, OpenSecrets, Ballotpedia and the Biographical Directory of Congress.
      </>
    ),
  },
];

export default function Methodology() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Methodology</h1>
      <p className="text-slate-600">
        This first version covers New York&apos;s 2 U.S. senators and 26 U.S. representatives. State, county and
        municipal officials come next. Every official&apos;s page lists the sources behind it and the date it was
        last checked. If something is wrong or out of date, it most likely changed on the official&apos;s website
        after we checked.
      </p>
      <dl className="space-y-5">
        {items.map((i) => (
          <div key={i.term}>
            <dt className="font-semibold">{i.term}</dt>
            <dd className="mt-1 text-sm text-slate-700">{i.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
