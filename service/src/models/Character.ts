import { Schema, model, Types, type InferSchemaType } from "mongoose";

const characterSchema = new Schema(
    {
        name: { type: String, required: true },
        role: { type: String, default: "" },
        summary: { type: String, default: "" },
        sections: [
            {
                heading: { type: String, required: true },
                body: { type: String, default: "" },
            },
        ],
        factionId: { type: Types.ObjectId, ref: "Faction" },
        // True until a document is authored specifically about this character —
        // set when created from a name-mention inside another entity's document.
        stub: { type: Boolean, default: true },
        sourceDocumentIds: [{ type: Types.ObjectId, ref: "Document" }],
    },
    { timestamps: true },
);

export type CharacterEntity = InferSchemaType<typeof characterSchema>;

export const CharacterModel = model("Character", characterSchema);
