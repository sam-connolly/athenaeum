export const typeDefs = /* GraphQL */ `
    enum EntityType {
        faction
        character
        place
        battle
    }

    enum PlaceType {
        homeworld
        fortress_monastery
        ship
        other
    }

    type OpenQuestion {
        type: String!
        text: String!
    }

    type Document {
        id: ID!
        title: String!
        sourceUrl: String
        sourceFormat: String!
        status: String!
        openQuestions: [OpenQuestion!]!
        pageId: ID
        createdAt: String!
        updatedAt: String!
    }

    type EntityRef {
        type: EntityType!
        id: ID!
        name: String
    }

    type Page {
        id: ID!
        title: String!
        slug: String!
        content: String!
        sourceDocuments: [Document!]!
        entityRefs: [EntityRef!]!
        createdAt: String!
        updatedAt: String!
    }

    type Faction {
        id: ID!
        name: String!
        aliases: [String!]!
        summary: String!
        homeworldId: ID
        homeworld: Place
        parentFactionId: ID
        parentFaction: Faction
        members: [Character!]!
        pageId: ID
        sourceDocumentIds: [ID!]!
        createdAt: String!
        updatedAt: String!
    }

    type Character {
        id: ID!
        name: String!
        aliases: [String!]!
        summary: String!
        role: String!
        stub: Boolean!
        factionId: ID
        faction: Faction
        battleIds: [ID!]!
        battles: [Battle!]!
        pageId: ID
        sourceDocumentIds: [ID!]!
        createdAt: String!
        updatedAt: String!
    }

    type Place {
        id: ID!
        name: String!
        aliases: [String!]!
        summary: String!
        type: PlaceType!
        factionId: ID
        faction: Faction
        pageId: ID
        sourceDocumentIds: [ID!]!
        createdAt: String!
        updatedAt: String!
    }

    type Battle {
        id: ID!
        name: String!
        aliases: [String!]!
        summary: String!
        date: String!
        placeId: ID
        place: Place
        factionIds: [ID!]!
        factions: [Faction!]!
        participants: [Character!]!
        pageId: ID
        sourceDocumentIds: [ID!]!
        createdAt: String!
        updatedAt: String!
    }

    """
    One entity found by previewImport. existingId is set when it matches an entity
    already in the database; matchedBy says how ("name" = exact name/alias match,
    "ai" = Claude judged it the same entity under a different name).
    """
    type ProposedEntity {
        key: ID!
        type: EntityType!
        name: String!
        aliases: [String!]!
        summary: String!
        role: String
        placeType: PlaceType
        date: String
        factionName: String
        existingId: ID
        existingName: String
        matchedBy: String
    }

    type ImportPreview {
        documentId: ID!
        title: String!
        content: String!
        openQuestions: [OpenQuestion!]!
        entities: [ProposedEntity!]!
    }

    type Query {
        health: String!

        pages: [Page!]!
        page(id: ID!): Page
        searchPages(q: String!): [Page!]!

        documents: [Document!]!
        document(id: ID!): Document

        factions: [Faction!]!
        faction(id: ID!): Faction
        characters: [Character!]!
        character(id: ID!): Character
        places: [Place!]!
        place(id: ID!): Place
        battles: [Battle!]!
        battle(id: ID!): Battle
    }

    input EntityRefInput {
        type: EntityType!
        id: ID!
    }

    input PageInput {
        title: String
        content: String
        entityRefs: [EntityRefInput!]
    }

    input FactionInput {
        name: String
        aliases: [String!]
        summary: String
        homeworldId: ID
        parentFactionId: ID
        pageId: ID
    }

    input CharacterInput {
        name: String
        aliases: [String!]
        summary: String
        role: String
        stub: Boolean
        factionId: ID
        battleIds: [ID!]
        pageId: ID
    }

    input PlaceInput {
        name: String
        aliases: [String!]
        summary: String
        type: PlaceType
        factionId: ID
        pageId: ID
    }

    input BattleInput {
        name: String
        aliases: [String!]
        summary: String
        date: String
        placeId: ID
        factionIds: [ID!]
        pageId: ID
    }

    input PreviewImportInput {
        "A Google Docs URL. The document must be shared as 'Anyone with the link can view'."
        url: String
        "Used with markdown for a manual paste."
        title: String
        markdown: String
    }

    """
    The user's decision on one proposed entity. Omit an entity (or set include:false)
    to skip it. Edited fields override what was proposed. Set existingId to null to
    force a new entity instead of the suggested match.
    """
    input EntityDecisionInput {
        key: ID!
        include: Boolean!
        name: String
        summary: String
        role: String
        existingId: ID
        useExisting: Boolean
    }

    input CommitImportInput {
        documentId: ID!
        title: String
        decisions: [EntityDecisionInput!]!
    }

    type Mutation {
        createPage(input: PageInput!): Page!
        updatePage(id: ID!, input: PageInput!): Page!
        deletePage(id: ID!): Boolean!

        createFaction(input: FactionInput!): Faction!
        updateFaction(id: ID!, input: FactionInput!): Faction!
        deleteFaction(id: ID!): Boolean!

        createCharacter(input: CharacterInput!): Character!
        updateCharacter(id: ID!, input: CharacterInput!): Character!
        deleteCharacter(id: ID!): Boolean!

        createPlace(input: PlaceInput!): Place!
        updatePlace(id: ID!, input: PlaceInput!): Place!
        deletePlace(id: ID!): Boolean!

        createBattle(input: BattleInput!): Battle!
        updateBattle(id: ID!, input: BattleInput!): Battle!
        deleteBattle(id: ID!): Boolean!

        previewImport(input: PreviewImportInput!): ImportPreview!
        commitImport(input: CommitImportInput!): Page!
    }
`;
