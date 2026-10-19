// Builds src/data/seed.json from the raw inputs in data/.
//
// Inputs:
//   data/congress-legislators-ny.json  NY members, IDs and district offices extracted from
//                                      github.com/unitedstates/congress-legislators
//   data/research/<BIOGUIDE>.json      per-member facts verified against official websites
//   data/districts.json                land area and population per area represented
//   data/status-notes.json             retirements, primary losses and other status changes
//   data/display-names.json            common names where they differ from legal first names
//
// Usage: node scripts/build-seed.mjs
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));

const base = read("data/congress-legislators-ny.json");
const districts = read("data/districts.json");
const statusNotes = read("data/status-notes.json");
const displayNames = read("data/display-names.json");
const research = Object.fromEntries(
  readdirSync(join(root, "data/research"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const r = read(`data/research/${f}`);
      return [r.bioguide, r];
    }),
);

const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function officeKind(o) {
  // A PO box is a mailing address, not a place a constituent can walk into.
  if (/^p\.?\s*o\.?\s*box/i.test(o.address ?? "")) return "mailing";
  return o.kind ?? "district";
}

function scorecards(m) {
  const out = [];
  if (m.ids.govtrack)
    out.push({
      org: "GovTrack",
      title: "Report cards, ideology and leadership scores",
      url: `https://www.govtrack.us/congress/members/${m.ids.govtrack}`,
    });
  if (m.ids.votesmart)
    out.push({
      org: "Vote Smart",
      title: "Interest group ratings (aggregated)",
      url: `https://justfacts.votesmart.org/candidate/evaluations/${m.ids.votesmart}`,
    });
  if (m.ids.opensecrets)
    out.push({
      org: "OpenSecrets",
      title: "Campaign finance and lobbying",
      url: `https://www.opensecrets.org/members-of-congress/summary?cid=${m.ids.opensecrets}`,
    });
  if (m.ids.ballotpedia)
    out.push({
      org: "Ballotpedia",
      title: "Profile, elections and key votes",
      url: `https://ballotpedia.org/${m.ids.ballotpedia.replace(/ /g, "_")}`,
    });
  out.push({
    org: "Biographical Directory of Congress",
    title: "Official biography",
    url: `https://bioguide.congress.gov/search/bio/${m.bioguide}`,
  });
  return out;
}

const officials = base
  .map((m) => {
    const r = research[m.bioguide];
    if (!r) throw new Error(`No research file for ${m.bioguide}`);
    const isSenate = m.chamber === "senate";
    const jurisdictionKey = isSenate ? "NY" : `NY-${m.district}`;
    const jurisdiction = districts[jurisdictionKey];
    if (!jurisdiction) throw new Error(`No district data for ${jurisdictionKey}`);
    const name = displayNames[m.bioguide] ?? `${m.nickname ?? m.first} ${m.last}`;

    const offices = r.offices.map((o) => ({
      slug: slugify(o.name),
      name: o.name,
      kind: officeKind(o),
      address: o.address,
      suite: o.suite ?? null,
      city: o.city ?? null,
      state: "NY",
      zip: o.zip ?? null,
      phone: o.phone ?? null,
      hours: o.hours ?? null,
      latitude: o.latitude ?? null,
      longitude: o.longitude ?? null,
    }));
    offices.push({
      slug: "washington-dc",
      name: "Washington, DC",
      kind: "capitol",
      address: m.dc_address, // already includes city, state and ZIP
      suite: null,
      city: null,
      state: null,
      zip: null,
      phone: m.dc_phone ?? null,
      hours: null,
      latitude: null,
      longitude: null,
    });

    return {
      slug: slugify(name),
      bioguide: m.bioguide,
      name,
      fullName: m.name,
      level: "federal",
      chamber: isSenate ? "us_senate" : "us_house",
      title: isSenate ? "U.S. Senator" : `U.S. Representative, NY-${m.district}`,
      district: m.district ?? null,
      party: m.party,
      websiteUrl: m.url,
      photoUrl: `https://unitedstates.github.io/images/congress/225x275/${m.bioguide}.jpg`,
      statusNote: statusNotes[m.bioguide] ?? null,
      jurisdiction: { key: jurisdictionKey, ...jurisdiction },
      offices,
      contact: {
        emailPublic: r.contact.email_public,
        webformUrl: r.contact.webform_url ?? m.contact_form ?? null,
        webformRequiresZip: r.contact.webform_requires_zip_verification,
        phone: r.contact.phone,
        meetingRequestUrl: r.contact.meeting_request_url,
        inPerson: r.contact.in_person,
        inPersonNotes: r.contact.in_person_notes,
        mobileOfficeHours: r.contact.mobile_office_hours,
        caseworkUrl: r.contact.casework_url,
      },
      schedule: {
        // No member was found to publish a daily schedule; "not found" is recorded as false.
        publishesDailySchedule: r.schedule.publishes_daily_schedule ?? false,
        scheduleUrl: r.schedule.schedule_url,
        notes: r.schedule.notes,
        recentMeetings: r.schedule.recent_meetings ?? [],
      },
      scorecards: [
        ...scorecards(m),
        ...(r.scorecards_extra ?? []).map((s) => ({ org: s.org ?? s.title, title: s.title, url: s.url })),
      ],
      sources: [
        ...r.sources,
        "https://github.com/unitedstates/congress-legislators",
        ...jurisdiction.sources,
      ],
      researchNotes: r.notes,
      verifiedAt: r.verified_at,
    };
  })
  .sort((a, b) =>
    a.chamber === b.chamber ? (a.district ?? 0) - (b.district ?? 0) : a.chamber === "us_senate" ? -1 : 1,
  );

writeFileSync(join(root, "src/data/seed.json"), JSON.stringify({ officials }, null, 2) + "\n");
console.log(`Wrote ${officials.length} officials to src/data/seed.json`);
