export function slugify(title: string): string {
    const slug = title
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug || "page";
}

/** Returns `base`, or `base-2`, `base-3`… — the first one `isTaken` rejects. */
export async function uniqueSlug(title: string, isTaken: (slug: string) => Promise<boolean>): Promise<string> {
    const base = slugify(title);
    let candidate = base;
    for (let n = 2; await isTaken(candidate); n++) {
        candidate = `${base}-${n}`;
    }
    return candidate;
}
