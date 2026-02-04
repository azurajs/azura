export function parseCacheControl(input?: string | string[] | null): {
  maxAge: number | undefined;
} {
  if (!input) return { maxAge: undefined };

  const value = Array.isArray(input) ? input.join(",") : input;
  const match = value.match(/max-age=(\d+)/);

  if (!match) return { maxAge: undefined };

  return { maxAge: Number(match[1]) };
}
