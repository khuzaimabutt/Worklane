export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function uniqueSlug(base: string, exists: (s: string) => Promise<boolean>): Promise<string> {
  return (async () => {
    const baseSlug = slugify(base);
    let slug = baseSlug;
    let n = 1;
    while (await exists(slug)) {
      n += 1;
      slug = `${baseSlug}-${n}`;
    }
    return slug;
  })();
}
