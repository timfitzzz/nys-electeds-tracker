"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Availability } from "./Availability";
import { num, partyClass, partyShort, pct } from "@/lib/format";

export interface TableRow {
  slug: string;
  name: string;
  title: string;
  party: string | null;
  chamber: string;
  district: number | null;
  statusNote: string | null;
  officeCount: number;
  perThousandSqMi: number;
  perHundredThousand: number;
  landAreaSqMi: number;
  population: number;
  email: boolean | null;
  phone: boolean | null;
  webform: boolean | null;
  inPerson: boolean | null;
  callbackRate: number | null;
  emailRate: number | null;
  webformRate: number | null;
  publishesSchedule: boolean | null;
  scorecardCount: number;
}

type SortKey = "default" | "officeCount" | "perThousandSqMi" | "perHundredThousand" | "name";

const filters = [
  { key: "all", label: "All" },
  { key: "us_senate", label: "U.S. Senate" },
  { key: "us_house", label: "U.S. House" },
] as const;

export function OfficialsTable({ rows }: { rows: TableRow[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "default", desc: false });

  const visible = useMemo(() => {
    const list = rows.filter((r) => filter === "all" || r.chamber === filter);
    const { key, desc } = sort;
    if (key === "default") return list;
    const dir = desc ? -1 : 1;
    return [...list].sort((a, b) =>
      key === "name" ? dir * a.name.localeCompare(b.name) : dir * (a[key] - b[key]),
    );
  }, [rows, filter, sort]);

  const header = (key: SortKey, label: string, hint?: string) => (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-left font-semibold hover:text-slate-900"
      title={hint}
      onClick={() =>
        setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== "name" }))
      }
    >
      {label}
      <span className="text-slate-400">{sort.key === key ? (sort.desc ? "↓" : "↑") : "↕"}</span>
    </button>
  );

  const notTracked = (
    <span className="text-slate-400" title="Response tracking through this site is not live yet">
      —
    </span>
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter by chamber">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1 text-sm ${
              filter === f.key
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
            }`}
          >
            {f.label}
          </button>
        ))}
        {sort.key !== "default" && (
          <button
            type="button"
            className="ml-auto text-sm text-slate-500 underline"
            onClick={() => setSort({ key: "default", desc: false })}
          >
            Reset sort
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:align-bottom [&>th]:whitespace-nowrap">
              <th className="sticky left-0 z-10 bg-slate-50 text-left">{header("name", "Official")}</th>
              <th className="text-right">{header("officeCount", "Offices", "In-area offices, excluding Washington, DC")}</th>
              <th className="text-right">
                {header("perThousandSqMi", "per 1k sq mi", "In-area offices per 1,000 square miles of land")}
              </th>
              <th className="text-right">
                {header("perHundredThousand", "per 100k people", "In-area offices per 100,000 residents")}
              </th>
              <th className="text-left font-semibold">Email</th>
              <th className="text-left font-semibold">Phone</th>
              <th className="text-left font-semibold">Web form</th>
              <th className="text-left font-semibold">In person</th>
              <th className="text-right font-semibold" title="Share of calls through this site that got a callback">
                Callback
              </th>
              <th className="text-right font-semibold" title="Share of emails through this site that got a reply">
                Email reply
              </th>
              <th className="text-right font-semibold" title="Share of web forms through this site that got a reply">
                Form reply
              </th>
              <th className="text-left font-semibold">Daily schedule</th>
              <th className="text-right font-semibold">Scorecards</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((r) => (
              <tr key={r.slug} className="hover:bg-slate-50 [&>td]:px-3 [&>td]:py-2 [&>td]:whitespace-nowrap">
                <td className="sticky left-0 z-10 bg-white">
                  <Link href={`/officials/${r.slug}`} className="font-medium text-slate-900 hover:underline">
                    {r.name}
                  </Link>{" "}
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${partyClass(r.party)}`}>
                    {partyShort(r.party)}
                  </span>
                  <div className="text-xs text-slate-500">
                    {r.chamber === "us_senate" ? "U.S. Senate · statewide" : `U.S. House · NY-${r.district}`}
                    {r.statusNote && (
                      <span className="ml-1 text-amber-700" title={r.statusNote}>
                        · leaving office
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-right font-mono tabular-nums">{r.officeCount}</td>
                <td className="text-right font-mono tabular-nums" title={`${num(r.landAreaSqMi)} sq mi`}>
                  {num(r.perThousandSqMi, r.perThousandSqMi < 10 ? 2 : 0)}
                </td>
                <td className="text-right font-mono tabular-nums" title={`${num(r.population)} residents`}>
                  {num(r.perHundredThousand, 2)}
                </td>
                <td>
                  <Availability value={r.email} yes="Public address" no="Form only" />
                </td>
                <td>
                  <Availability value={r.phone} />
                </td>
                <td>
                  <Availability value={r.webform} />
                </td>
                <td>
                  <Availability value={r.inPerson} />
                </td>
                <td className="text-right font-mono">{pct(r.callbackRate) ?? notTracked}</td>
                <td className="text-right font-mono">{pct(r.emailRate) ?? notTracked}</td>
                <td className="text-right font-mono">{pct(r.webformRate) ?? notTracked}</td>
                <td>
                  <Availability value={r.publishesSchedule} no="None found" />
                </td>
                <td className="text-right">
                  <Link href={`/officials/${r.slug}#scorecards`} className="text-slate-700 underline">
                    {r.scorecardCount}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
