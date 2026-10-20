import { Schema, model, Types, type InferSchemaType } from "mongoose";

const factionSchema = new Schema(
    {
        name: { type: String, required: true },
        summary: { type: String, default: "" },
        sections: [
            {
                heading: { type: String, required: true },
                body: { type: String, default: "" },
            },
        ],
        homeworldId: { type: Types.ObjectId, ref: "Place" },
        parentFactionId: { type: Types.ObjectId, ref: "Faction" },
        memberIds: [{ type: Types.ObjectId, ref: "Character" }],
        sourceDocumentIds: [{ type: Types.ObjectId, ref: "Document" }],
    },
    { timestamps: true },
);

export type FactionEntity = InferSchemaType<typeof factionSchema>;

export const FactionModel = model("Faction", factionSchema);
