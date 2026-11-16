# athenaeum-service

Backend for Athenaeum: a GraphQL API over MongoDB. It's meant to replace the Spark `useKV` storage and `window.spark.llm` calls that the frontend currently depends on.

It borrows conventions from the `universe` monorepo (GraphQL, Mongoose models, strict TypeScript, no bundler on the backend), but it's a standalone service with no dependency on `universe` itself.

## Local dev

```bash
docker compose up -d   # starts MongoDB 7 on localhost:27018
npm install
npm run dev            # starts the service on http://localhost:4000/graphql
npm test               # extraction pipeline unit tests (node:test)
npm run typecheck
```

| Env var | Default |
|---|---|
| `PORT` | `4000` |
| `MONGO_URL` | `mongodb://localhost:27018/athenaeum` |

## Status

- **Models:** `Document`, `Character`, `Faction` and `Place` (Mongoose, in `src/models/`).
- **API:** list, fetch and create for each model (`src/schema/index.ts`), plus a `health` query. No update or delete mutations yet.
- **Extraction:** `src/extraction/preClean.ts` cleans Google Docs markdown exports. `structure.ts` parses the cleaned text into a heading tree and flattens it to `{ heading, body }` sections. Both are unit-tested but not yet connected to the API.
- **Not started:** an import mutation that runs the pipeline, AI extraction on the backend, and connecting the frontend to the API.

See the root [README](../README.md) for the full picture.
