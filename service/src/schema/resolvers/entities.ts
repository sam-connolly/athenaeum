import type { Model } from "mongoose";
import { BattleModel } from "../../models/Battle.ts";
import { CharacterModel } from "../../models/Character.ts";
import { FactionModel } from "../../models/Faction.ts";
import { PageModel } from "../../models/Page.ts";
import { PlaceModel } from "../../models/Place.ts";
import type { EntityType } from "../../models/common.ts";
import { cleanEntityInput } from "../input.ts";
import { toBattle, toCharacter, toFaction, toPlace, type Row } from "../mappers.ts";

type Args = { id: string };
type InputArgs = { input: Record<string, unknown> };
type UpdateArgs = Args & InputArgs;

/** Removes references to a deleted entity from every page that links to it. */
async function unlinkFromPages(type: EntityType, id: string) {
    await PageModel.updateMany({}, { $pull: { entityRefs: { type, id } } });
}

function crud(
    type: EntityType,
    model: Model<any>,
    map: (row: Row) => Row,
    onDelete: (id: string) => Promise<unknown>,
) {
    return {
        list: () => model.find().sort({ name: 1 }).lean().then((rows: Row[]) => rows.map(map)),
        get: ({ id }: Args) => model.findById(id).lean().then((row: Row | null) => (row ? map(row) : null)),
        create: async ({ input }: InputArgs) => {
            const created = await model.create(cleanEntityInput(input));
            return map(created.toObject());
        },
        update: async ({ id, input }: UpdateArgs) => {
            const row = await model
                .findByIdAndUpdate(id, { $set: cleanEntityInput(input) }, { new: true, runValidators: true })
                .lean();
            if (!row) throw new Error(`No ${type} with id ${id}`);
            return map(row as Row);
        },
        remove: async ({ id }: Args) => {
            const deleted = await model.findByIdAndDelete(id);
            if (!deleted) return false;
            await onDelete(id);
            await unlinkFromPages(type, id);
            return true;
        },
    };
}

// Deleting an entity never deletes others: references to it are cleared instead.
const factions = crud("faction", FactionModel, toFaction, (id) =>
    Promise.all([
        CharacterModel.updateMany({ factionId: id }, { factionId: null }),
        PlaceModel.updateMany({ factionId: id }, { factionId: null }),
        FactionModel.updateMany({ parentFactionId: id }, { parentFactionId: null }),
        BattleModel.updateMany({}, { $pull: { factionIds: id } }),
    ]),
);

const characters = crud("character", CharacterModel, toCharacter, async () => {});

const places = crud("place", PlaceModel, toPlace, (id) =>
    Promise.all([
        FactionModel.updateMany({ homeworldId: id }, { homeworldId: null }),
        BattleModel.updateMany({ placeId: id }, { placeId: null }),
    ]),
);

const battles = crud("battle", BattleModel, toBattle, (id) =>
    CharacterModel.updateMany({}, { $pull: { battleIds: id } }),
);

export const entityResolvers = {
    factions: factions.list,
    faction: factions.get,
    createFaction: factions.create,
    updateFaction: factions.update,
    deleteFaction: factions.remove,

    characters: characters.list,
    character: characters.get,
    createCharacter: characters.create,
    updateCharacter: characters.update,
    deleteCharacter: characters.remove,

    places: places.list,
    place: places.get,
    createPlace: places.create,
    updatePlace: places.update,
    deletePlace: places.remove,

    battles: battles.list,
    battle: battles.get,
    createBattle: battles.create,
    updateBattle: battles.update,
    deleteBattle: battles.remove,
};
