# athenaeum-service

The backend for Athenaeum: a GraphQL API over MongoDB. It also runs the document import, including the Claude API call that finds the entities in each document.

## Local dev

```bash
docker compose up -d   # MongoDB 7 on localhost:27018
cp .env.example .env   # set ANTHROPIC_API_KEY (needed for imports only)
npm install
npm run dev            # http://localhost:4000/graphql, restarts on changes
npm test               # node:test unit tests (no API calls)
npm run typecheck
```

| Env var | Default |
|---|---|
| `ANTHROPIC_API_KEY` | none |
| `PORT` | `4000` |
| `MONGO_URL` | `mongodb://localhost:27018/athenaeum` |

## Layout

| Path | What it is |
|---|---|
| `src/models/` | Mongoose models: Document, Page, Faction, Character, Place, Battle |
| `src/schema/` | `typeDefs.ts`, the row-to-GraphQL `mappers.ts`, and resolvers for pages, entities and imports |
| `src/import/` | `previewImport` and `commitImport` (`pipeline.ts`), Google Docs fetch, name matching, merge rules |
| `src/ai/extractEntities.ts` | The Claude call: structured output, streamed, with errors turned into readable messages |
| `src/extraction/` | `preClean` (Google Docs clean-up) and `parseStructure` |

The data model and the delete and merge rules are described in [../DATABASE.md](../DATABASE.md). How an import works is described in the root [README](../README.md#how-an-import-works).
