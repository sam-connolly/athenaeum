import { buildSchema } from "graphql";
import { DocumentModel } from "../models/Document.ts";
import { CharacterModel } from "../models/Character.ts";
import { FactionModel } from "../models/Faction.ts";
import { PlaceModel } from "../models/Place.ts";

export const schema = buildSchema(`
    type Section {
        heading: String!
        body: String!
    }

    input SectionInput {
        heading: String!
        body: String!
    }

    type Document {
        id: ID!
        title: String!
        content: String!
        sourceFormat: String!
        createdAt: String!
        updatedAt: String!
    }

    type Character {
        id: ID!
        name: String!
        role: String!
        summary: String!
        sections: [Section!]!
        factionId: ID
        stub: Boolean!
        sourceDocumentIds: [ID!]!
        createdAt: String!
        updatedAt: String!
    }

    type Faction {
        id: ID!
        name: String!
        summary: String!
        sections: [Section!]!
        homeworldId: ID
        parentFactionId: ID
        memberIds: [ID!]!
        sourceDocumentIds: [ID!]!
        createdAt: String!
        updatedAt: String!
    }

    type Place {
        id: ID!
        name: String!
        type: String!
        summary: String!
        sections: [Section!]!
        factionId: ID
        sourceDocumentIds: [ID!]!
        createdAt: String!
        updatedAt: String!
    }

    type Query {
        health: String!
        documents: [Document!]!
        document(id: ID!): Document
        characters: [Character!]!
        character(id: ID!): Character
        factions: [Faction!]!
        faction(id: ID!): Faction
        places: [Place!]!
        place(id: ID!): Place
    }

    input CreateDocumentInput {
        title: String!
        content: String!
    }

    input CreateCharacterInput {
        name: String!
        role: String
        summary: String
        sections: [SectionInput!]
        factionId: ID
        stub: Boolean
        sourceDocumentIds: [ID!]
    }

    input CreateFactionInput {
        name: String!
        summary: String
        sections: [SectionInput!]
        homeworldId: ID
        parentFactionId: ID
        memberIds: [ID!]
        sourceDocumentIds: [ID!]
    }

    input CreatePlaceInput {
        name: String!
        type: String
        summary: String
        sections: [SectionInput!]
        factionId: ID
        sourceDocumentIds: [ID!]
    }

    type Mutation {
        createDocument(input: CreateDocumentInput!): Document!
        createCharacter(input: CreateCharacterInput!): Character!
        createFaction(input: CreateFactionInput!): Faction!
        createPlace(input: CreatePlaceInput!): Place!
    }
`);

export const rootValue = {
    health: () => "ok",

    documents: () => DocumentModel.find().sort({ createdAt: -1 }),
    document: ({ id }: { id: string }) => DocumentModel.findById(id),
    createDocument: ({ input }: { input: { title: string; content: string } }) =>
        DocumentModel.create(input),

    characters: () => CharacterModel.find().sort({ name: 1 }),
    character: ({ id }: { id: string }) => CharacterModel.findById(id),
    createCharacter: ({ input }: { input: Record<string, unknown> }) =>
        CharacterModel.create(input),

    factions: () => FactionModel.find().sort({ name: 1 }),
    faction: ({ id }: { id: string }) => FactionModel.findById(id),
    createFaction: ({ input }: { input: Record<string, unknown> }) => FactionModel.create(input),

    places: () => PlaceModel.find().sort({ name: 1 }),
    place: ({ id }: { id: string }) => PlaceModel.findById(id),
    createPlace: ({ input }: { input: Record<string, unknown> }) => PlaceModel.create(input),
};
