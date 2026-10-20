# athenaeum-service

Backend for Athenaeum: GraphQL API over MongoDB, replacing the Spark `useKV`/`window.spark.llm` runtime the frontend currently depends on.

Conventions borrowed from the `universe` monorepo (GraphQL via `express-graphql`, Mongoose models, strict TypeScript, no bundler on the backend) but this is a standalone service — no dependency on `universe` itself.

## Local dev

```bash
docker compose up -d   # starts MongoDB on localhost:27017
npm install
npm run dev             # starts the service on http://localhost:4000/graphql
```

## Status

Walking skeleton only: one `Document` model with basic CRUD, proving the Mongoose → GraphQL → client chain works. No extraction pipeline, no Character/Faction/Place models yet.
