import type { Office, Official } from "./types";

/** Offices that count toward the per-area and per-capita metrics: physical offices in the area represented. */
export function localOffices(offices: Office[]): Office[] {
  return offices.filter((o) => o.kind === "district" || o.kind === "satellite");
}

export interface OfficeMetrics {
  officeCount: number;
  /** Offices per 1,000 square miles of land area. */
  perThousandSqMi: number;
  /** Offices per 100,000 residents. */
  perHundredThousand: number;
  /** Average land area each office covers, in square miles. */
  sqMiPerOffice: number | null;
  /** Average residents each office serves. */
  residentsPerOffice: number | null;
}

export function officeMetrics(o: Official): OfficeMetrics {
  const count = localOffices(o.offices).length;
  const { landAreaSqMi, population } = o.jurisdiction;
  return {
    officeCount: count,
    perThousandSqMi: (count / landAreaSqMi) * 1000,
    perHundredThousand: (count / population) * 100_000,
    sqMiPerOffice: count ? landAreaSqMi / count : null,
    residentsPerOffice: count ? population / count : null,
  };
}
