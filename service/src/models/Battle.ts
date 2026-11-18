import { Schema, model, type InferSchemaType } from "mongoose";
import { entityBaseFields } from "./common.ts";

const battleSchema = new Schema(
    {
        ...entityBaseFields,
        // Free text: lore dates look like "745.M41" rather than calendar dates.
        date: { type: String, default: "" },
        placeId: { type: Schema.Types.ObjectId, ref: "Place", default: null },
        factionIds: [{ type: Schema.Types.ObjectId, ref: "Faction" }],
    },
    { timestamps: true },
);

export type BattleEntity = InferSchemaType<typeof battleSchema>;

export const BattleModel = model("Battle", battleSchema);
