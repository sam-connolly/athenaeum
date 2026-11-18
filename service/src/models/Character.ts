import { Schema, model, type InferSchemaType } from "mongoose";
import { entityBaseFields } from "./common.ts";

const characterSchema = new Schema(
    {
        ...entityBaseFields,
        role: { type: String, default: "" },
        factionId: { type: Schema.Types.ObjectId, ref: "Faction", default: null },
        battleIds: [{ type: Schema.Types.ObjectId, ref: "Battle" }],
        // True until a page is written specifically about this character —
        // set when created from a mention inside another document.
        stub: { type: Boolean, default: true },
    },
    { timestamps: true },
);

export type CharacterEntity = InferSchemaType<typeof characterSchema>;

export const CharacterModel = model("Character", characterSchema);
