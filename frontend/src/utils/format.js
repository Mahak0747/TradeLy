export const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** 1234.5 -> "1,234.50". Safe for undefined/null/NaN (shows "--"). */
export const money = (v, digits = 2) => {
  const n = Number(v);
  if (v === null || v === undefined || !Number.isFinite(n)) return "--";
  return n.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

/** "+1.25%" / "-0.40%" strings -> number (for colouring) */
export const pctValue = (s) => toNum(String(s ?? "").replace(/[+%]/g, ""));

export const safeJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};
