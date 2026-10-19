/** Renders a yes / no / unknown fact consistently across the site. */
export function Availability({ value, yes = "Yes", no = "No" }: { value: boolean | null; yes?: string; no?: string }) {
  if (value === null)
    return (
      <span className="text-slate-400" title="Not verified yet">
        ?
      </span>
    );
  return value ? (
    <span className="font-medium text-emerald-700">✓ {yes}</span>
  ) : (
    <span className="text-slate-500">✗ {no}</span>
  );
}
