// Small helpers shared by the profile and listing pages

export function initials(name) {
  if (!name) return "";
  return name.slice(0, 2).toUpperCase();
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatPrice(value) {
  const n = Number(value);
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}
