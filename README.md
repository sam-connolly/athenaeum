# Athenaeum

Athenaeum is a wiki for Warhammer lore. Import your faction and character write-ups from Google Docs and it turns them into a browsable, cross-linked knowledge base, with a structured database of the factions, characters and battles behind the pages.

> **Project status:** Athenaeum is partway through a migration. The working app is a React frontend built on **GitHub Spark**, which stores data and calls the AI model for it. A new standalone backend (`service/`, GraphQL + MongoDB) is being built to replace Spark, but the frontend doesn't use it yet. See [Roadmap and current state](#roadmap-and-current-state).

---

## Using Athenaeum

### What it does

- **Wiki pages:** every imported document becomes a page, with clean typography, headings and a clickable contents list.
- **Sidebar and search:** all pages are listed in the sidebar. Search filters by title and content as you type. Hover over a page to rename or delete it.
- **Smart Import (AI):** paste a Google Docs link to a faction document. Athenaeum reads it, pulls out the faction and every named character, and lets you review and edit them before it creates:
  - a faction page and database entry,
  - a page and database entry for each character you keep.
  If a character already has a page, the new information is **merged into it** and the new document is added as a source. You don't get a duplicate page.
- **Import Document:** import a single Google Doc, or paste text in by hand. Afterwards you can scan the document for characters and create pages for them.
- **Warhammer Database:** the database button in the header opens a manager for **factions, battles and characters**. You can view, add and delete entries, link characters to a faction and to battles, and export everything as JSON.
- **Related pages:** a page linked to a database entry shows the entry's details and links to related pages, such as the characters in a faction.

### Importing from Google Docs

1. In Google Docs, set sharing to **Anyone with the link can view**. Athenaeum fetches the plain-text export without signing in, so private documents will fail with a 401 or 403 error.
2. Copy the document URL (`https://docs.google.com/document/d/<id>/edit`).
3. Click **Smart Import** for a faction document with several characters, or **Import Document** for a single document.
4. Review the extracted characters, untick any you don't want, fix names or roles, then create the pages.

### Tips and limits

- The AI extraction works best on documents with clear headings, for example a section per character.
- Images, Google's auto-generated contents list and unfilled template placeholders don't import.
- Deleting a faction keeps its characters, but unlinks them from it. Deleting a battle removes it from every character that fought in it.
- Your data is stored by the Spark runtime the app is hosted on, not in your browser. Use **Export JSON** in the database manager to make a backup.

---

## Developing Athenaeum

### Repository layout

```
.
├── src/                    Frontend (React 19 + Vite + Tailwind 4, built on GitHub Spark)
│   ├── App.tsx             App shell: header, sidebar, document view; documents held in Spark KV
│   ├── components/
│   │   ├── SmartImportDialog.tsx        Google Doc → AI → faction + characters (+ merge into existing pages)
│   │   ├── ImportDialog.tsx             Single-document import (Google Doc URL or manual paste)
│   │   ├── CharacterExtractionDialog.tsx  AI character scan after a single import
│   │   ├── DatabaseManager.tsx          CRUD UI for factions / battles / characters, JSON export
│   │   ├── DocumentRenderer.tsx         Markdown-ish rendering, contents list, entity metadata
│   │   ├── RelatedDocuments.tsx         Cross-links between entity pages
│   │   ├── Sidebar.tsx                  Page list, search, rename, delete
│   │   └── ui/                          shadcn/ui components (generated; don't hand-edit)
│   ├── hooks/use-warhammer-database.ts  Entity database on Spark KV (`warhammer-database`)
│   ├── lib/character-merger.ts          Merges new character info into an existing page
│   ├── lib/database-utils.ts
│   └── types/                           Document and Warhammer entity types
├── service/                Backend (Node + Express + GraphQL + Mongoose) — work in progress
│   ├── src/index.ts        Server entry, GraphQL at /graphql
│   ├── src/schema/         GraphQL schema + resolvers
│   ├── src/models/         Document, Character, Faction, Place
│   ├── src/extraction/     Deterministic Google-Docs-markdown cleanup + heading parser (+ tests)
│   └── docker-compose.yml  Local MongoDB
├── tmp/                    Sample lore documents used to develop the extraction pipeline
├── PRD.md                  Original product/design brief (from Spark)
└── DATABASE.md             Frontend entity database schema and hook API
```

### Frontend

**Stack:** React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui (Radix), Phosphor icons, Sonner toasts, `@github/spark`.

The frontend was generated and iterated on in **GitHub Spark**, and it depends on the Spark runtime for two things:

| Spark API | Used for | Where |
|---|---|---|
| `useKV(key, default)` | Persistent storage. Keys: `wiki-documents` (pages) and `warhammer-database` (entities) | `App.tsx`, `hooks/use-warhammer-database.ts` |
| `window.spark.llm(prompt, 'gpt-4o', true)` | AI extraction of factions and characters as JSON | `SmartImportDialog.tsx`, `CharacterExtractionDialog.tsx` |

Running it locally:

```bash
npm install
npm run dev        # Vite dev server
npm run build      # tsc -b --noCheck && vite build
npm run lint       # ESLint 9 (eslint.config.js); skips service/ and src/components/ui
npx tsc -b         # full type check (the build script skips it with --noCheck)
```

The UI builds and runs under Vite, but storage and AI need the Spark runtime. Outside Spark, expect those features to fail until the frontend moves to `service/`.

**Data model (frontend):** see [DATABASE.md](DATABASE.md). A wiki `Document` can point at a database entry through `entityType` (`character` | `faction` | `battle`) and `entityId`. That link is what drives the metadata panel and related pages.

### Backend service (`service/`)

A standalone GraphQL API over MongoDB, meant to replace Spark's KV store and LLM calls.

**Stack:** Node 24 (runs TypeScript directly through `--experimental-strip-types`), Express, `graphql-http`, Mongoose 8, strict TypeScript, no bundler.

```bash
cd service
docker compose up -d   # MongoDB 7 on localhost:27018
npm install
npm run dev            # http://localhost:4000/graphql (restarts on file changes)
npm test               # node:test unit tests for the extraction pipeline
npm run typecheck
```

Environment variables:

| Variable | Default |
|---|---|
| `PORT` | `4000` |
| `MONGO_URL` | `mongodb://localhost:27018/athenaeum` |

**API:** queries `health`, `documents` / `document(id)`, `characters` / `character(id)`, `factions` / `faction(id)`, `places` / `place(id)`. Mutations `createDocument`, `createCharacter`, `createFaction`, `createPlace`. There are no update or delete mutations yet.

**Models:** `Document` (raw source text), and `Character`, `Faction` and `Place`. All three entity models share a `summary`, a list of `{ heading, body }` sections and `sourceDocumentIds`. Characters have a `stub` flag: it's true when the character was created from a mention rather than from its own document. Factions link to a homeworld, a parent faction and their members.

The backend's entity model is not the same as the frontend's. It has `Place` but no `Battle`, it uses sections instead of a free-text description, and it uses Mongo ObjectIds.

**Extraction pipeline** (`src/extraction/`), deterministic and with no AI:

1. `preClean(raw)` takes a Google Docs markdown export and strips embedded images, the auto-generated contents list, heading anchors (`{#id}`) and unfilled template placeholders. It pulls `<TODO: …>` and `<IDEA: …>` markers out into a separate `openQuestions` list.
2. `parseStructure(cleaned)` builds a heading tree from the cleaned text. It tolerates empty headings (page-break artifacts) and sections with no body.
3. `flattenSections(tree)` turns the tree into the `{ heading, body }[]` shape the models store.

The pipeline isn't connected to the API yet.

### Sample data

`tmp/` holds real lore documents (a faction, a warband and a character profile) in the two formats the pipeline has to handle: Google Docs markdown export and plain-text export. Use them as fixtures when you work on extraction.

---

## Roadmap and current state

**Done**
- Spark frontend: import, Smart Import with AI and character merging, wiki rendering, entity database, search.
- Backend skeleton: models, read and create GraphQL API, a tested cleanup and structure parser.

**Next**
- Connect `preClean` → `parseStructure` to an import mutation that creates `Document` and entity records.
- Add the AI extraction step on the backend, to replace `window.spark.llm`.
- Add update and delete mutations.
- Settle on one entity model for frontend and backend (Battle vs Place, description vs sections).
- Point the frontend at the GraphQL API instead of `useKV`, then remove the `@github/spark` dependency.

### Known issues

- `npm run lint` reports one warning, in `DocumentRenderer.tsx`: a `useMemo` dependency changes on every render. It's harmless but worth tidying.
- The production bundle is over 500 kB, and Vite warns about chunk size.

## License

MIT. The Spark template files are © GitHub, Inc. See [LICENSE](LICENSE).
