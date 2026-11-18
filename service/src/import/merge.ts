import type { EntityType } from "../models/common.ts";
import { dedupeAliases } from "../schema/input.ts";

export type Proposal = {
    name: string;
    aliases: string[];
    summary: string;
    role?: string | null;
    placeType?: string | null;
    date?: string | null;
};

export type ExistingEntity = {
    name: string;
    aliases?: string[];
    summary?: string;
    role?: string;
    type?: string;
    date?: string;
    factionId?: unknown;
};

/**
 * Builds the Mongo update that folds a proposal into an existing entity.
 * Anything the database already holds wins: new information only fills
 * empty fields, and other names for the entity are kept as aliases.
 */
export function buildMergeUpdate(
    type: EntityType,
    existing: ExistingEntity,
    proposal: Proposal,
    documentId: string,
    factionId: string | null = null,
) {
    const set: Record<string, unknown> = {};
    const addToSet: Record<string, unknown> = { sourceDocumentIds: documentId };

    const newAliases = dedupeAliases([proposal.name, ...proposal.aliases], [existing.name, ...(existing.aliases ?? [])]);
    if (newAliases.length) set.aliases = [...(existing.aliases ?? []), ...newAliases];

    if (!existing.summary?.trim() && proposal.summary.trim()) set.summary = proposal.summary.trim();

    if (type === "character" && !existing.role?.trim() && proposal.role?.trim()) set.role = proposal.role.trim();
    if (type === "place" && (existing.type ?? "other") === "other" && proposal.placeType && proposal.placeType !== "other") {
        set.type = proposal.placeType;
    }
    if (type === "battle" && !existing.date?.trim() && proposal.date?.trim()) set.date = proposal.date.trim();

    if (factionId) {
        if (type === "battle") addToSet.factionIds = factionId;
        else if ((type === "character" || type === "place") && !existing.factionId) set.factionId = factionId;
    }

    return { ...(Object.keys(set).length ? { $set: set } : {}), $addToSet: addToSet };
}
