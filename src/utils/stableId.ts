export function stableFallbackId(prefix: string, ...values: unknown[]): string {
  const key = values
    .map((value) => (value === null || value === undefined ? "" : String(value).trim()))
    .filter(Boolean)
    .join("-")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${prefix}-${key || "empty"}`;
}
