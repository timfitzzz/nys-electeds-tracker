import type { Official } from "@/lib/types";

/** Constituent comments. Not live yet: needs residency verification before anyone can post. */
export function CommentsPlaceholder({ official }: { official: Official }) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Constituent comments</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Coming soon</span>
      </div>
      <p className="max-w-3xl text-sm text-slate-600">
        Only people who live in {official.jurisdiction.name} will be able to comment here. You&apos;ll verify your
        address once (for example with a code mailed to it); we keep which districts you live in, not the address
        itself.
      </p>
      <textarea
        disabled
        rows={3}
        placeholder="Comments open once residency verification is live."
        className="mt-3 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 p-2 text-sm"
      />
    </section>
  );
}
