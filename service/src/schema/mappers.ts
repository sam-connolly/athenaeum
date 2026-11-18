/**
 * Convert lean Mongo rows into GraphQL objects. Relations are exposed as
 * functions: graphql-js calls a field that is a function, so related records
 * are only fetched when a query asks for them.
 */
import { BattleModel } from "../models/Battle.ts";
import { CharacterModel } from "../models/Character.ts";
import { DocumentModel } from "../models/Document.ts";
import { FactionModel } from "../models/Faction.ts";
import { PlaceModel } from "../models/Place.ts";
import { entityModels } from "../entities/registry.ts";
import type { EntityType } from "../models/common.ts";

export type Row = Record<string, any>;

const idOf = (value: unknown): string | null => (value == null ? null : String(value));
const idsOf = (values: unknown[] | undefined): string[] => (values ?? []).map(String);
const iso = (value: Date | undefined): string => (value ? value.toISOString() : "");

function timestamps(row: Row) {
    return { createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) };
}

function entityBase(row: Row) {
    return {
        id: String(row._id),
        name: row.name,
        aliases: row.aliases ?? [],
        summary: row.summary ?? "",
        pageId: idOf(row.pageId),
        sourceDocumentIds: idsOf(row.sourceDocumentIds),
        ...timestamps(row),
    };
}

function one<T>(promise: Promise<Row | null>, map: (row: Row) => T): Promise<T | null> {
    return promise.then((row) => (row ? map(row) : null));
}

function many<T>(promise: Promise<Row[]>, map: (row: Row) => T): Promise<T[]> {
    return promise.then((rows) => rows.map(map));
}

export function toDocument(row: Row) {
    return {
        id: String(row._id),
        title: row.title,
        sourceUrl: row.sourceUrl ?? null,
        sourceFormat: row.sourceFormat,
        status: row.status,
        openQuestions: row.openQuestions ?? [],
        pageId: idOf(row.pageId),
        ...timestamps(row),
    };
}

export function toPage(row: Row) {
    const refs: { type: EntityType; id: unknown }[] = row.entityRefs ?? [];
    return {
        id: String(row._id),
        title: row.title,
        slug: row.slug,
        content: row.content ?? "",
        ...timestamps(row),
        sourceDocuments: () =>
            many(DocumentModel.find({ _id: { $in: row.sourceDocumentIds ?? [] } }).lean(), toDocument),
        entityRefs: refs.map((ref) => ({
            type: ref.type,
            id: String(ref.id),
            name: () =>
                entityModels[ref.type]
                    .findById(ref.id, { name: 1 })
                    .lean()
                    .then((entity: Row | null) => entity?.name ?? null),
        })),
    };
}

export function toFaction(row: Row): Row {
    return {
        ...entityBase(row),
        homeworldId: idOf(row.homeworldId),
        parentFactionId: idOf(row.parentFactionId),
        homeworld: () => one(PlaceModel.findById(row.homeworldId).lean(), toPlace),
        parentFaction: () => one(FactionModel.findById(row.parentFactionId).lean(), toFaction),
        members: () =>
            many(CharacterModel.find({ factionId: row._id }).sort({ name: 1 }).lean(), toCharacter),
    };
}

export function toCharacter(row: Row): Row {
    return {
        ...entityBase(row),
        role: row.role ?? "",
        stub: row.stub ?? true,
        factionId: idOf(row.factionId),
        battleIds: idsOf(row.battleIds),
        faction: () => one(FactionModel.findById(row.factionId).lean(), toFaction),
        battles: () => many(BattleModel.find({ _id: { $in: row.battleIds ?? [] } }).lean(), toBattle),
    };
}

export function toPlace(row: Row): Row {
    return {
        ...entityBase(row),
        type: row.type ?? "other",
        factionId: idOf(row.factionId),
        faction: () => one(FactionModel.findById(row.factionId).lean(), toFaction),
    };
}

export function toBattle(row: Row): Row {
    return {
        ...entityBase(row),
        date: row.date ?? "",
        placeId: idOf(row.placeId),
        factionIds: idsOf(row.factionIds),
        place: () => one(PlaceModel.findById(row.placeId).lean(), toPlace),
        factions: () => many(FactionModel.find({ _id: { $in: row.factionIds ?? [] } }).lean(), toFaction),
        participants: () =>
            many(CharacterModel.find({ battleIds: row._id }).sort({ name: 1 }).lean(), toCharacter),
    };
}
