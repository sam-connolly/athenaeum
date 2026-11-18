import { randomUUID } from "node:crypto";
import { extractEntities, type ExtractedEntity } from "../ai/extractEntities.ts";
import { entityModels } from "../entities/registry.ts";
import { preClean } from "../extraction/preClean.ts";
import { parseStructure } from "../extraction/structure.ts";
import { ENTITY_TYPES, type EntityType } from "../models/common.ts";
import { DocumentModel } from "../models/Document.ts";
import { PageModel } from "../models/Page.ts";
import { uniqueSlug } from "../pages/slug.ts";
import { fetchGoogleDocMarkdown } from "./googleDocs.ts";
import { addToIndex, buildNameIndex, findByName, normalizeName, type KnownEntity, type NameIndex } from "./matching.ts";
import { buildMergeUpdate, type ExistingEntity } from "./merge.ts";
import type { Row } from "../schema/mappers.ts";

export type ProposedEntity = Omit<ExtractedEntity, "matchId"> & {
    key: string;
    existingId: string | null;
    existingName: string | null;
    matchedBy: "name" | "ai" | null;
};

export type PreviewInput = { url?: string | null; title?: string | null; markdown?: string | null };

export type EntityDecision = {
    key: string;
    include: boolean;
    name?: string | null;
    summary?: string | null;
    role?: string | null;
    useExisting?: boolean | null;
};

export type CommitInput = { documentId: string; title?: string | null; decisions: EntityDecision[] };

export type ImportDeps = {
    extract: typeof extractEntities;
    fetchDoc: typeof fetchGoogleDocMarkdown;
};

const defaultDeps: ImportDeps = { extract: extractEntities, fetchDoc: fetchGoogleDocMarkdown };

export async function loadKnownEntities(): Promise<KnownEntity[]> {
    const lists = await Promise.all(
        ENTITY_TYPES.map(async (type) => {
            const rows = await entityModels[type].find({}, { name: 1, aliases: 1 }).lean();
            return rows.map((row: Row) => ({
                id: String(row._id),
                type,
                name: row.name,
                aliases: row.aliases ?? [],
            }));
        }),
    );
    return lists.flat();
}

/** First top-level heading in the cleaned document, used when no title is given. */
function headingTitle(cleaned: string): string | null {
    const first = parseStructure(cleaned).children[0];
    return first?.heading.replace(/:$/, "").trim() || null;
}

/**
 * Resolves each extracted entity against the database: an exact name/alias
 * match wins, then Claude's suggested match (only if that id really exists
 * and has the same type). Duplicate extractions of one entity are merged.
 */
export function resolveProposals(extracted: ExtractedEntity[], known: KnownEntity[]): ProposedEntity[] {
    const index = buildNameIndex(known);
    const byId = new Map(known.map((entity) => [entity.id, entity]));
    const out: ProposedEntity[] = [];
    const seen = new Map<string, ProposedEntity>();

    for (const entity of extracted) {
        const name = entity.name.trim();
        if (!name) continue;

        const dedupeKey = `${entity.type}:${normalizeName(name)}`;
        const duplicate = seen.get(dedupeKey);
        if (duplicate) {
            duplicate.aliases = [...new Set([...duplicate.aliases, ...entity.aliases])];
            continue;
        }

        const byName = findByName(index, entity.type, [name, ...entity.aliases]);
        const aiMatch = entity.matchId ? byId.get(entity.matchId) : undefined;
        const match = byName ?? (aiMatch && aiMatch.type === entity.type ? aiMatch : null);

        const { matchId: _ignored, ...rest } = entity;
        const proposal: ProposedEntity = {
            ...rest,
            name,
            aliases: entity.aliases.filter((alias) => normalizeName(alias) !== normalizeName(name)),
            key: randomUUID(),
            existingId: match?.id ?? null,
            existingName: match?.name ?? null,
            matchedBy: byName ? "name" : match ? "ai" : null,
        };
        seen.set(dedupeKey, proposal);
        out.push(proposal);
    }
    return out;
}

export async function previewImport(input: PreviewInput, deps: ImportDeps = defaultDeps) {
    let raw: string;
    let sourceUrl: string | null = null;
    if (input.url?.trim()) {
        sourceUrl = input.url.trim();
        raw = await deps.fetchDoc(sourceUrl);
    } else if (input.markdown?.trim()) {
        raw = input.markdown;
    } else {
        throw new Error("Give either a Google Docs link or some text to import.");
    }

    const { cleaned, openQuestions } = preClean(raw);
    if (!cleaned) throw new Error("Nothing left to import once images and contents lists were removed.");
    const title = input.title?.trim() || headingTitle(cleaned) || "Untitled import";

    const known = await loadKnownEntities();
    const extracted = await deps.extract(cleaned, known);
    const entities = resolveProposals(extracted, known);

    const document = await DocumentModel.create({
        title,
        sourceUrl,
        sourceFormat: sourceUrl ? "google-docs-export" : "manual",
        raw,
        cleaned,
        openQuestions,
        proposedEntities: entities,
        status: "draft",
    });

    return { documentId: String(document._id), title, content: cleaned, openQuestions, entities };
}

// Factions first so characters, places and battles can link to factions
// created or matched in the same import.
const COMMIT_ORDER: EntityType[] = ["faction", "place", "battle", "character"];

const slugTaken = async (slug: string) => (await PageModel.exists({ slug })) !== null;

/**
 * Applies the user's review decisions. Safe to re-run: a committed document
 * returns its page, and a partly-applied run finds its own entities by name
 * instead of creating duplicates.
 */
export async function commitImport(input: CommitInput) {
    const document = await DocumentModel.findById(input.documentId);
    if (!document) throw new Error("That import no longer exists. Start the import again.");

    const documentId = String(document._id);
    let page = document.pageId ? await PageModel.findById(document.pageId) : null;
    if (document.status === "committed" && page) return page.toObject();

    if (!page) {
        const title = input.title?.trim() || document.title;
        page = await PageModel.create({
            title,
            slug: await uniqueSlug(title, slugTaken),
            content: document.cleaned,
            sourceDocumentIds: [document._id],
        });
        document.pageId = page._id;
        await document.save();
    }

    const decisions = new Map(input.decisions.map((decision) => [decision.key, decision]));
    const proposals = (document.proposedEntities as ProposedEntity[])
        .filter((proposal) => decisions.get(proposal.key)?.include)
        .sort((a, b) => COMMIT_ORDER.indexOf(a.type) - COMMIT_ORDER.indexOf(b.type));

    const index: NameIndex = buildNameIndex(await loadKnownEntities());
    const factionIdByName = (name: string | null | undefined) =>
        name ? (findByName(index, "faction", [name])?.id ?? null) : null;

    const refs: { type: EntityType; id: string }[] = [];

    for (const proposal of proposals) {
        const decision = decisions.get(proposal.key)!;
        const edited = {
            ...proposal,
            name: decision.name?.trim() || proposal.name,
            summary: decision.summary?.trim() ?? proposal.summary,
            role: decision.role?.trim() ?? proposal.role,
        };
        const model = entityModels[proposal.type];
        const factionId = factionIdByName(proposal.factionName);

        // Re-check by name at commit time: catches entities created earlier in
        // this import (or by an interrupted earlier attempt).
        const existingId =
            decision.useExisting === false
                ? null
                : (proposal.existingId ?? findByName(index, proposal.type, [edited.name, ...edited.aliases])?.id ?? null);
        const existing = existingId
            ? ((await model.findById(existingId).lean()) as unknown as ExistingEntity | null)
            : null;

        let id: string;
        if (existing) {
            await model.updateOne(
                { _id: existingId },
                buildMergeUpdate(proposal.type, existing, edited, documentId, factionId),
            );
            id = existingId!;
        } else {
            const created = await model.create({
                name: edited.name,
                aliases: edited.aliases,
                summary: edited.summary,
                sourceDocumentIds: [documentId],
                ...(proposal.type === "character" ? { role: edited.role ?? "", factionId } : {}),
                ...(proposal.type === "place" ? { type: proposal.placeType ?? "other", factionId } : {}),
                ...(proposal.type === "battle" ? { date: proposal.date ?? "", factionIds: factionId ? [factionId] : [] } : {}),
            });
            id = String(created._id);
        }

        addToIndex(index, { id, type: proposal.type, name: edited.name, aliases: edited.aliases });
        refs.push({ type: proposal.type, id });
    }

    page.entityRefs = refs as never;
    await page.save();
    document.status = "committed";
    await document.save();
    return page.toObject();
}
