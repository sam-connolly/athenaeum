// Mirrors the GraphQL schema in service/src/schema/typeDefs.ts.

export type EntityType = 'faction' | 'character' | 'place' | 'battle'
export type PlaceType = 'homeworld' | 'fortress_monastery' | 'ship' | 'other'

export const ENTITY_TYPES: EntityType[] = ['faction', 'character', 'place', 'battle']

export const ENTITY_LABELS: Record<EntityType, { one: string; many: string }> = {
  faction: { one: 'Faction', many: 'Factions' },
  character: { one: 'Character', many: 'Characters' },
  place: { one: 'Place', many: 'Places' },
  battle: { one: 'Battle', many: 'Battles' },
}

export const PLACE_TYPE_LABELS: Record<PlaceType, string> = {
  homeworld: 'Homeworld',
  fortress_monastery: 'Fortress-monastery',
  ship: 'Ship',
  other: 'Other',
}

export interface OpenQuestion {
  type: 'TODO' | 'IDEA'
  text: string
}

export interface SourceDocument {
  id: string
  title: string
  sourceUrl: string | null
  createdAt: string
}

export interface EntityRef {
  type: EntityType
  id: string
  name: string | null
}

export interface PageSummary {
  id: string
  title: string
  slug: string
  updatedAt: string
  entityRefs: EntityRef[]
}

export interface Page extends PageSummary {
  content: string
  createdAt: string
  sourceDocuments: SourceDocument[]
}

interface EntityBase {
  id: string
  name: string
  aliases: string[]
  summary: string
  pageId: string | null
  sourceDocumentIds: string[]
  updatedAt: string
}

export interface Faction extends EntityBase {
  homeworldId: string | null
  parentFactionId: string | null
}

export interface Character extends EntityBase {
  role: string
  stub: boolean
  factionId: string | null
  battleIds: string[]
}

export interface Place extends EntityBase {
  type: PlaceType
  factionId: string | null
}

export interface Battle extends EntityBase {
  date: string
  placeId: string | null
  factionIds: string[]
}

export interface EntityLists {
  factions: Faction[]
  characters: Character[]
  places: Place[]
  battles: Battle[]
}

export type AnyEntity = Faction | Character | Place | Battle

export interface ProposedEntity {
  key: string
  type: EntityType
  name: string
  aliases: string[]
  summary: string
  role: string | null
  placeType: PlaceType | null
  date: string | null
  factionName: string | null
  existingId: string | null
  existingName: string | null
  matchedBy: 'name' | 'ai' | null
}

export interface ImportPreview {
  documentId: string
  title: string
  content: string
  openQuestions: OpenQuestion[]
  entities: ProposedEntity[]
}

export interface EntityDecision {
  key: string
  include: boolean
  name?: string
  summary?: string
  role?: string
  useExisting?: boolean
}
