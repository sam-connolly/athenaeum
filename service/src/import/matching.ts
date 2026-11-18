import type { EntityType } from "../models/common.ts";

export type KnownEntity = {
    id: string;
    type: EntityType;
    name: string;
    aliases: string[];
};

/** Case-, accent- and punctuation-insensitive form of a name, for exact matching. */
export function normalizeName(name: string): string {
    return name
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/['’`]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

export type NameIndex = Map<string, KnownEntity>;

const indexKey = (type: EntityType, name: string) => `${type}:${normalizeName(name)}`;

export function buildNameIndex(known: KnownEntity[]): NameIndex {
    const index: NameIndex = new Map();
    for (const entity of known) {
        for (const name of [entity.name, ...entity.aliases]) {
            const key = indexKey(entity.type, name);
            // First entity to claim a name keeps it, so lookups stay deterministic.
            if (normalizeName(name) && !index.has(key)) index.set(key, entity);
        }
    }
    return index;
}

/** Exact match on any of `names` against known names and aliases of the same type. */
export function findByName(index: NameIndex, type: EntityType, names: string[]): KnownEntity | null {
    for (const name of names) {
        const hit = index.get(indexKey(type, name));
        if (hit) return hit;
    }
    return null;
}

export function addToIndex(index: NameIndex, entity: KnownEntity): void {
    for (const name of [entity.name, ...entity.aliases]) {
        const key = indexKey(entity.type, name);
        if (normalizeName(name) && !index.has(key)) index.set(key, entity);
    }
}
