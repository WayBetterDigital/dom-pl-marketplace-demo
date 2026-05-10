export function toNum(val: unknown): number {
  if (val === null || val === undefined) return 0
  if (typeof val === "number") return isNaN(val) ? 0 : val
  if (typeof val === "string") {
    const n = parseFloat(val)
    return isNaN(n) ? 0 : n
  }
  if (typeof val === "object") {
    const o = val as Record<string, unknown>
    if ("numeric_value" in o) return toNum(o.numeric_value)
    if ("numeric" in o) return toNum(o.numeric)
    if ("value" in o) return toNum(o.value)
  }
  return 0
}
