/** Replace values of sensitive headers (case-insensitive match) with "***". */
export function redactHeaders(
  headers: Record<string, string>,
  redactedNames: string[]
): Record<string, string> {
  const lower = new Set(redactedNames.map((h) => h.toLowerCase()));
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = lower.has(k.toLowerCase()) ? '***' : v;
  }
  return out;
}
