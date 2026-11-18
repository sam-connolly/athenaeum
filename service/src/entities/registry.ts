import type { Model } from "mongoose";
import type { EntityType } from "../models/common.ts";
import { FactionModel } from "../models/Faction.ts";
import { CharacterModel } from "../models/Character.ts";
import { PlaceModel } from "../models/Place.ts";
import { BattleModel } from "../models/Battle.ts";

// The four entity models have different schemas but share the base fields in
// models/common.ts, which is all the generic code (matching, refs) touches.
export const entityModels: Record<EntityType, Model<any>> = {
    faction: FactionModel,
    character: CharacterModel,
    place: PlaceModel,
    battle: BattleModel,
};
