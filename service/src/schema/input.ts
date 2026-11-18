/**
 * Tidies mutation input before it reaches Mongo: trims strings, dedupes
 * aliases, and turns "" ids (what an empty <select> sends) into null so a
 * reference can be cleared.
 */
const ID_FIELDS = new Set(["homeworldId", "parentFactionId", "factionId", "placeId", "pageId"]);

export function cleanEntityInput(input: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
        if (value === undefined) continue;
        if (ID_FIELDS.has(key)) {
            out[key] = value === "" ? null : value;
        } else if (key === "aliases" && Array.isArray(value)) {
            out[key] = dedupeAliases(value as string[]);
        } else if (typeof value === "string") {
            out[key] = value.trim();
        } else {
            out[key] = value;
        }
    }
    return out;
}

export function dedupeAliases(aliases: string[], exclude: string[] = []): string[] {
    const seen = new Set(exclude.map((a) => a.trim().toLowerCase()));
    const out: string[] = [];
    for (const alias of aliases) {
        const trimmed = alias.trim();
        const key = trimmed.toLowerCase();
        if (!trimmed || seen.has(key)) continue;
        seen.add(key);
        out.push(trimmed);
    }
    return out;
}
