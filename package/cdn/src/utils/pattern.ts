export function globToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");

  return new RegExp(`^${escaped}$`);
}

export function matchesPattern(key: string, pattern: string): boolean {
  if (!pattern.includes("*") && !pattern.includes("?")) {
    return key === pattern;
  }

  const regex = globToRegex(pattern);
  return regex.test(key);
}

export function filterByPattern(keys: string[], pattern: string): string[] {
  if (!pattern.includes("*") && !pattern.includes("?")) {
    return keys.filter((k) => k === pattern);
  }

  const regex = globToRegex(pattern);
  return keys.filter((k) => regex.test(k));
}

export function matchesPrefix(path: string, prefix: string): boolean {
  return path.startsWith(prefix);
}

export function normalizeCacheKey(url: string): string {
  return url;
}

export function extractPathSegments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

export function matchesRoutePattern(path: string, pattern: string): boolean {
  const pathSegments = extractPathSegments(path);
  const patternSegments = extractPathSegments(pattern);

  for (let i = 0; i < patternSegments.length; i++) {
    const patternSeg = patternSegments[i];

    if (patternSeg === "*") {
      return i <= pathSegments.length;
    }

    if (i >= pathSegments.length) {
      return false;
    }

    if (patternSeg.startsWith(":")) {
      continue;
    }

    if (patternSeg !== pathSegments[i]) {
      return false;
    }
  }

  return pathSegments.length === patternSegments.length;
}
