export function parseCacheControl(input?: string | string[] | null) {
  if (!input) return { maxAge: undefined };
  const v = Array.isArray(input) ? input.join(",") : input;
  const m = v.match(/max-age=(\d+)/);
  if (!m) return { maxAge: undefined };
  
  return { maxAge: Number(m[1]) };
}
