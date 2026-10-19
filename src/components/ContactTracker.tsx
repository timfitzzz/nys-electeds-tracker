import { MIN_SAMPLE } from "@/lib/data";
import { pct } from "@/lib/format";
import type { Official, ResponseRates } from "@/lib/types";

const channels = [
  {
    key: "call",
    label: "Call",
    rateLabel: "Callback rate",
    how: "We connect your call to the office through a tracked number, log whether anyone answers or there's voicemail, then check whether they call you back.",
  },
  {
    key: "email",
    label: "Email",
    rateLabel: "Email reply rate",
    how: "Your message goes out from a relay address, so a reply from the office is counted when it reaches you.",
  },
  {
    key: "webform",
    label: "Web form",
    rateLabel: "Web form reply rate",
    how: "We submit the office's own contact form for you, then follow up to ask whether you heard back.",
  },
] as const;

/**
 * Contact-through-the-site panel. Not live yet: buttons are disabled and rates
 * stay empty until contact_attempts has MIN_SAMPLE finished contacts per channel.
 */
export function ContactTracker({ official, rates }: { official: Official; rates: ResponseRates | null }) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Contact {official.name} through this site</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Coming soon</span>
      </div>
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Contacting an office through this site lets us measure how often each office actually gets back to people.
        Rates are shown once at least {MIN_SAMPLE} contacts on a channel have a final outcome.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {channels.map((ch) => (
          <div key={ch.key} className="rounded-md border border-slate-200 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-500">{ch.rateLabel}</span>
              <span className="font-mono text-xl tabular-nums">{pct(rates?.[ch.key] ?? null) ?? "—"}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{ch.how}</p>
            <button
              type="button"
              disabled
              className="mt-3 w-full cursor-not-allowed rounded-md bg-slate-200 px-3 py-1.5 text-sm text-slate-500"
            >
              {ch.label} (not live yet)
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
