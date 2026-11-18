# Athenaeum

Athenaeum is a wiki for Warhammer lore. Import your faction and character write-ups from Google Docs and it turns them into readable, cross-linked pages. Behind the pages is a database of the factions, characters, places and battles they mention.

It has two parts: a React frontend (`src/`) and a GraphQL + MongoDB service (`service/`). The service also makes the AI calls, using the Claude API, to pick out the entities in each document you import.

---

## Using Athenaeum

### Pages and entities

- **Pages** are what you read: one per imported document, or any page you write yourself. A page can exist without any database entries.
- **Entities** (factions, characters, places and battles) are a structured index. They fill the tables in the entity database, and they let Athenaeum recognise something it already knows when it turns up in a new document. An entity can have its own page, or appear in several pages, or have no page at all.

### What it does

- **Import:** click **Import**, then paste a Google Docs link or some text. Claude reads the document and lists every named faction, character, place and battle it finds. You review the list before anything is saved:
  - untick anything you don't want;
  - fix names, roles or summaries;
  - for each entity that **matches one already in the database**, choose to merge into it (the default) or to create a new entity. Matches are made on exact names and aliases. Claude may also suggest a match under a different name, such as "Sorcerer Lord Orasmyn" for "Orasmyn"; these are labelled for you to check.

  The import then creates **one page for the document** and links the selected entities to it. Merging never overwrites what's already there: it adds the new names as aliases, records the new document as a source, and only fills fields that were empty.
- **Write page:** the third tab in the Import dialog creates a page by hand, with no AI and no database entries.
- **Reading a page:** pages render markdown (headings, lists, bold, links and tables), with a contents list. The entities linked to a page are listed at the top with their key facts, and with links to the other pages that mention them. Sources are listed at the bottom.
- **Sidebar:** lists every page. Search looks through titles and page text on the server. The filter menu shows only pages that link factions, characters, places or battles, or pages with no entities. Hover over a page to rename or delete it.
- **Entity database** (the database button in the header): a tab of tables for each entity type, where you can add, edit and delete entries, link entities to each other and to a page, and export everything as JSON.

### Importing from Google Docs

1. In Google Docs, set sharing to **Anyone with the link can view**. The service downloads the document's markdown export without signing in to Google, so private documents fail with a message telling you to change the sharing.
2. Copy the document link (`https://docs.google.com/document/d/<id>/edit`).
3. Click **Import**, paste the link and click **Find entities**. Reading a long document can take up to a minute.
4. Review the entities, then click **Create page**.

### Tips and limits

- Images, Google's auto-generated contents list and unfilled template placeholders are dropped on import.
- `<TODO: …>` and `<IDEA: …>` notes in a document are taken out of the page text and shown during the review as open questions.
- Deleting an entity never deletes other entities: deleting a faction keeps its characters but unlinks them, and deleting a battle removes it from the characters who fought in it. Deleting a page keeps its entities.
- Everything is stored in MongoDB. Use **Export JSON** in the entity database for a quick backup of the entities.

---

## Developing Athenaeum

### Running it locally

You need Node 24 or newer, Docker, and an Anthropic API key for imports.

```bash
cd service
```
```bash
docker compose up -d     # MongoDB 7 on localhost:27018
```
```bash
cp .env.example .env     # then set ANTHROPIC_API_KEY in service/.env
```
```bash
npm install && npm run dev   # GraphQL API on http://localhost:4000/graphql
```

In a second terminal, from the repository root:

```bash
npm install && npm run dev   # app on http://localhost:5173
```

Vite forwards `/graphql` to the service. Without an API key, everything works except **Find entities**, which shows an error explaining how to set the key.

### Repository layout

```
.
├── src/                          Frontend: React 19, Vite 7, Tailwind 4, shadcn/ui, TanStack Query
│   ├── App.tsx                   Shell: header, sidebar, page view
│   ├── lib/api.ts                Minimal GraphQL client (fetch)
│   ├── lib/markdown.ts           Safe markdown rendering (no raw HTML, images or unsafe links)
│   ├── hooks/                    use-pages, use-entities, use-import (react-query)
│   ├── types/api.ts              Types mirroring the GraphQL schema
│   └── components/
│       ├── ImportDialog.tsx      Import → review → commit, and "write page"
│       ├── PageView.tsx          A rendered page, contents list, sources
│       ├── LinkedEntities.tsx    Entities linked to a page, with cross-links
│       ├── DatabaseManager.tsx   Entity tables, delete, JSON export
│       ├── EntityForm.tsx        Add/edit form for any entity type
│       ├── Sidebar.tsx           Page list, search, filters, rename, delete
│       └── ui/                   shadcn/ui components (generated; don't hand-edit)
├── service/                      Backend: Node 24, Express, graphql-http, Mongoose 8
│   ├── src/index.ts              Server entry: GraphQL at /graphql
│   ├── src/models/               Document, Page, Faction, Character, Place, Battle
│   ├── src/schema/               typeDefs.ts, mappers.ts, resolvers/ (pages, entities, imports)
│   ├── src/import/               Import pipeline: Google Docs fetch, matching, merge rules
│   ├── src/ai/extractEntities.ts The Claude call
│   ├── src/extraction/           preClean (Google Docs clean-up) and parseStructure
│   └── docker-compose.yml        Local MongoDB
├── tmp/                          Sample lore documents, useful as import fixtures
├── DATABASE.md                   Data model reference
└── PRD.md                        The original (Spark-era) product brief
```

### Checks

```bash
npm run lint && npx tsc -b && npm run build
```
```bash
cd service && npm test && npm run typecheck
```

The root `build` script skips type checking (`tsc -b --noCheck`), so run `npx tsc -b` as well. The service's tests use a fake Claude client and make no API calls. ESLint skips `service/` and `src/components/ui/`.

### Data model

See [DATABASE.md](DATABASE.md). In short:
- a **Document** is a raw import;
- a **Page** is wiki content;
- **Faction**, **Character**, **Place** and **Battle** are index entries with `aliases`, linked to pages through `Page.entityRefs` (and their own page through `pageId`).

### How an import works

Imports run in two steps, so nothing is saved until you've reviewed the result.

**`previewImport`** (`service/src/import/pipeline.ts`):
1. Fetches the Google Doc as markdown (`/export?format=md`), or takes the pasted text.
2. Runs `preClean`, which removes images, the generated contents list, heading anchors and template placeholders, and collects TODO/IDEA notes. The title comes from the first heading if none is given.
3. Calls `extractEntities` (`service/src/ai/extractEntities.ts`): one streamed Claude request (`claude-opus-5-5`, structured JSON output, server-side refusal fallback) with the cleaned text and a list of every known entity's id, name and aliases.
4. Resolves each entity Claude returns. An exact name or alias match wins; otherwise Claude's suggested id is used, but only if it exists and is of the same type. Duplicates are merged.
5. Saves a draft `Document` holding the proposals, and returns them.

**`commitImport`** applies your decisions:
1. Creates the page.
2. Processes factions first, so characters, places and battles can link to factions named in the same document.
3. Creates new entities, and merges matched ones using `buildMergeUpdate` (`service/src/import/merge.ts`).
4. Links everything to the page.

Running a commit again is safe: a committed document returns its page, and an interrupted run finds the entities it already created by name.

The Claude call is the only place the service talks to an AI provider. To change the model or the prompt, edit `extractEntities.ts`.

### Configuration

| Where | Variable | Default |
|---|---|---|
| `service/.env` | `ANTHROPIC_API_KEY` | none (needed for imports) |
| `service/.env` | `PORT` | `4000` |
| `service/.env` | `MONGO_URL` | `mongodb://localhost:27018/athenaeum` |
| Root (Vite dev) | `ATHENAEUM_API_TARGET` | `http://localhost:4000` (where `/graphql` is forwarded) |
| Root (build) | `VITE_API_URL` | `/graphql` (the API URL the built app calls) |

---

## Roadmap

**Done**
- GitHub Spark removed. Storage is MongoDB through the GraphQL service, and AI extraction uses the Claude API from the service.
- Pages and an entity index (factions, characters, places, battles) with full create, edit and delete.
- Two-step Google Docs import with entity matching and safe merging.

**Next**
- Editing page content in the app (pages can only be renamed today).
- Editing which entities a page links to, from the page itself.
- A production setup: build and serve the frontend and service together, and add authentication if it will be shared.
- `parseStructure` is only used for the page title, and `flattenSections` isn't used at all. Either use them to build per-entity pages from document sections, or remove them.

### Known issues

- The production bundle is over 500 kB, and Vite warns about chunk size.
- The Claude extraction hasn't yet been run against a real document in this setup. The import flow has been tested end to end with a stand-in for the Claude response.

## License

MIT. Files from the original Spark template are © GitHub, Inc. See [LICENSE](LICENSE).
