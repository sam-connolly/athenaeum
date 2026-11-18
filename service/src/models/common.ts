import { Schema } from "mongoose";

export const ENTITY_TYPES = ["faction", "character", "place", "battle"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

/**
 * Fields every index entity shares. Long-form lore lives on Pages; entities
 * hold just enough structure to fill tables and to recognise the same entity
 * when it turns up in a later import (hence `aliases`).
 */
export const entityBaseFields = {
    name: { type: String, required: true, trim: true },
    aliases: { type: [String], default: [] },
    summary: { type: String, default: "" },
    pageId: { type: Schema.Types.ObjectId, ref: "Page", default: null },
    sourceDocumentIds: [{ type: Schema.Types.ObjectId, ref: "Document" }],
};
