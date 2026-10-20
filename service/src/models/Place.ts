import { Schema, model, Types, type InferSchemaType } from "mongoose";

const placeSchema = new Schema(
    {
        name: { type: String, required: true },
        type: {
            type: String,
            enum: ["homeworld", "fortress-monastery", "ship", "other"],
            default: "other",
        },
        summary: { type: String, default: "" },
        sections: [
            {
                heading: { type: String, required: true },
                body: { type: String, default: "" },
            },
        ],
        factionId: { type: Types.ObjectId, ref: "Faction" },
        sourceDocumentIds: [{ type: Types.ObjectId, ref: "Document" }],
    },
    { timestamps: true },
);

export type PlaceEntity = InferSchemaType<typeof placeSchema>;

export const PlaceModel = model("Place", placeSchema);
