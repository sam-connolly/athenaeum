import { Schema, model, type InferSchemaType } from "mongoose";
import { entityBaseFields } from "./common.ts";

const factionSchema = new Schema(
    {
        ...entityBaseFields,
        homeworldId: { type: Schema.Types.ObjectId, ref: "Place", default: null },
        parentFactionId: { type: Schema.Types.ObjectId, ref: "Faction", default: null },
    },
    { timestamps: true },
);

export type FactionEntity = InferSchemaType<typeof factionSchema>;

export const FactionModel = model("Faction", factionSchema);
