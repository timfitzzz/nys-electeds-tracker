import type { Office } from "./types";

export const partyShort = (party: string | null) =>
  party === "Democrat" ? "D" : party === "Republican" ? "R" : party ? party[0] : "";

export const partyClass = (party: string | null) =>
  party === "Democrat"
    ? "bg-blue-100 text-blue-800"
    : party === "Republican"
      ? "bg-red-100 text-red-800"
      : "bg-slate-100 text-slate-700";

export const num = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const pct = (n: number | null) => (n === null ? null : `${Math.round(n * 100)}%`);

export function officeAddressLine(o: Office) {
  return [o.address, o.suite, [o.city, o.state].filter(Boolean).join(", "), o.zip].filter(Boolean).join(", ");
}

export function mapsUrl(o: Office) {
  const q = o.latitude && o.longitude ? `${o.latitude},${o.longitude}` : officeAddressLine(o);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function yelpUrl(officialName: string, o: Office) {
  const loc = [o.city, o.state].filter(Boolean).join(", ");
  return `https://www.yelp.com/search?find_desc=${encodeURIComponent(officialName)}&find_loc=${encodeURIComponent(loc)}`;
}

export const officeKindLabel: Record<Office["kind"], string> = {
  district: "District office",
  satellite: "Satellite office",
  mobile: "Mobile office hours",
  mailing: "Mailing address only",
  capitol: "Washington, DC",
};
