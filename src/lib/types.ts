export type OfficeKind = "district" | "satellite" | "mobile" | "mailing" | "capitol";

export interface Office {
  slug: string;
  name: string;
  kind: OfficeKind;
  address: string | null;
  suite: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  hours: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Jurisdiction {
  key: string;
  name: string;
  type: string;
  geoid: string | null;
  landAreaSqMi: number;
  population: number;
  areaSource: string;
  populationSource: string;
  sources: string[];
}

export interface ContactProfile {
  emailPublic: string | null;
  webformUrl: string | null;
  webformRequiresZip: boolean | null;
  phone: boolean | null;
  meetingRequestUrl: string | null;
  inPerson: boolean | null;
  inPersonNotes: string | null;
  mobileOfficeHours: boolean | null;
  caseworkUrl: string | null;
}

export interface Meeting {
  date: string;
  who: string;
  topic: string | null;
}

export interface Schedule {
  publishesDailySchedule: boolean | null;
  scheduleUrl: string | null;
  notes: string | null;
  recentMeetings: Meeting[];
}

export interface Scorecard {
  org: string;
  title: string;
  url: string;
}

/** Response rates for contacts made through the site. null until there is enough data. */
export interface ResponseRates {
  call: number | null;
  email: number | null;
  webform: number | null;
}

export interface Official {
  slug: string;
  bioguide: string | null;
  name: string;
  fullName: string;
  level: string;
  chamber: string;
  title: string;
  district: number | null;
  party: string | null;
  websiteUrl: string | null;
  photoUrl: string | null;
  statusNote: string | null;
  jurisdiction: Jurisdiction;
  offices: Office[];
  contact: ContactProfile;
  schedule: Schedule;
  scorecards: Scorecard[];
  sources: string[];
  researchNotes: string | null;
  verifiedAt: string | null;
}
