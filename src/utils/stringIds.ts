export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniquifyWithNumericSuffix(
  baseValue: string,
  hasCandidate: (candidate: string) => boolean
): string {
  if (!hasCandidate(baseValue)) {
    return baseValue;
  }

  let suffix = 2;
  let candidate = `${baseValue}-${suffix}`;

  while (hasCandidate(candidate)) {
    suffix += 1;
    candidate = `${baseValue}-${suffix}`;
  }

  return candidate;
}
