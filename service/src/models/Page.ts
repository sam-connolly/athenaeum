import { Schema, model, type InferSchemaType } from "mongoose";
import { ENTITY_TYPES } from "./common.ts";

/** A wiki page: what readers see. May exist with or without linked entities. */
const pageSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true },
        content: { type: String, default: "" },
        sourceDocumentIds: [{ type: Schema.Types.ObjectId, ref: "Document" }],
        entityRefs: [
            {
                _id: false,
                type: { type: String, enum: ENTITY_TYPES, required: true },
                id: { type: Schema.Types.ObjectId, required: true },
            },
        ],
    },
    { timestamps: true },
);

pageSchema.index({ title: "text", content: "text" }, { weights: { title: 5, content: 1 } });

export type PageEntity = InferSchemaType<typeof pageSchema>;

export const PageModel = model("Page", pageSchema);
