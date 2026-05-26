export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isIsoDate(value) {
  if (!isNonEmptyString(value)) return false;
  // Basic YYYY-MM-DD check; keeps current frontend semantics.
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

export function isMonthIso(value) {
  if (!isNonEmptyString(value)) return false;
  return /^\d{4}-\d{2}$/.test(value.trim());
}

export function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

