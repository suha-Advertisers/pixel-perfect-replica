const numberFormatter = new Intl.NumberFormat("en-US");

/** Formats a count with Western digits and thousands separators; null shows a dash (no data yet). */
export function formatCount(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return numberFormatter.format(value);
}
