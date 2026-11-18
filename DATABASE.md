# Data model

Athenaeum stores everything in MongoDB through `athenaeum-service`. Models live in `service/src/models/`, and the GraphQL schema that exposes them is `service/src/schema/typeDefs.ts`.

## Collections

### Document: a raw import

One record per import, so every page can be traced back to what was imported.

| Field | Notes |
|---|---|
| `title` | From the import, or the first heading |
| `sourceUrl` | The Google Docs link, or `null` for pasted text |
| `sourceFormat` | `google-docs-export` or `manual` |
| `raw`, `cleaned` | The text as imported, and after `preClean` |
| `openQuestions` | `{ type: "TODO" \| "IDEA", text }[]`, taken out of the text |
| `proposedEntities` | What the preview step found (used by commit) |
| `status` | `draft` until the import is committed, then `committed` |
| `pageId` | The page the import created |

### Page: wiki content

| Field | Notes |
|---|---|
| `title`, `slug` | The slug is unique and stays the same when the page is renamed |
| `content` | Markdown |
| `sourceDocumentIds` | The documents this page came from |
| `entityRefs` | `{ type, id }[]`, the entities this page mentions |

Pages have a text index on `title` and `content`, used by `searchPages`.

### Entities: the index

All four types share these fields:

| Field | Notes |
|---|---|
| `name` | Required |
| `aliases` | Other names, used to recognise the entity in later imports |
| `summary` | Short, factual |
| `pageId` | The entity's own page, if it has one |
| `sourceDocumentIds` | Every import that mentioned it |

The type-specific fields:

| Type | Fields |
|---|---|
| **Faction** | `homeworldId` → Place, `parentFactionId` → Faction. Members are the characters whose `factionId` points to it. |
| **Character** | `role`, `factionId` → Faction, `battleIds` → Battle[], `stub` (true until a page is written about the character) |
| **Place** | `type`: `homeworld`, `fortress_monastery`, `ship` or `other`; `factionId` → Faction |
| **Battle** | `date` (free text, e.g. `745.M41`), `placeId` → Place, `factionIds` → Faction[]. Participants are the characters whose `battleIds` include it. |

## Deleting

Deletes never cascade to other records. References are cleared instead:

| Deleting | Also does |
|---|---|
| Faction | Clears `factionId` on its characters and places, and `parentFactionId` on child factions; removes it from battles' `factionIds` |
| Place | Clears `homeworldId` on factions and `placeId` on battles |
| Battle | Removes it from characters' `battleIds` |
| Any entity | Removes it from pages' `entityRefs` |
| Page | Clears `pageId` on entities and documents |

## Merging on import

When an import matches an existing entity (`service/src/import/merge.ts`):
- the new name and aliases are added as aliases;
- the document is added to `sourceDocumentIds`;
- `summary`, `role` and `date` are filled only if empty, and a place's `type` only if it's `other`;
- a faction link is set only if none exists (battles add to `factionIds`).

Existing values are never overwritten.

## GraphQL at a glance

- **Queries:** `pages`, `page(id)`, `searchPages(q)`, `documents`, `document(id)`, plus a list and a single-record query for each entity type (`factions`, `faction(id)`, and so on).
- **Mutations:** `create…`, `update…` and `delete…` for pages and every entity type, plus `previewImport` and `commitImport`.
- **Relations** resolve when they're asked for: `Character.faction`, `Character.battles`, `Faction.members`, `Battle.participants`, `Page.sourceDocuments`, and `Page.entityRefs { name }`.
