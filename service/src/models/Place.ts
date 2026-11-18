import { Schema, model, type InferSchemaType } from "mongoose";
import { entityBaseFields } from "./common.ts";

export const PLACE_TYPES = ["homeworld", "fortress_monastery", "ship", "other"] as const;

const placeSchema = new Schema(
    {
        ...entityBaseFields,
        type: { type: String, enum: PLACE_TYPES, default: "other" },
        factionId: { type: Schema.Types.ObjectId, ref: "Faction", default: null },
    },
    { timestamps: true },
);

export type PlaceEntity = InferSchemaType<typeof placeSchema>;

export const PlaceModel = model("Place", placeSchema);
