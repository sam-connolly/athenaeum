import { DocumentModel } from "../../models/Document.ts";
import { PageModel } from "../../models/Page.ts";
import { entityModels } from "../../entities/registry.ts";
import { ENTITY_TYPES } from "../../models/common.ts";
import { uniqueSlug } from "../../pages/slug.ts";
import { toDocument, toPage, type Row } from "../mappers.ts";

type PageInput = {
    title?: string;
    content?: string;
    entityRefs?: { type: string; id: string }[];
};

const slugTaken = async (slug: string) => (await PageModel.exists({ slug })) !== null;

export const pageResolvers = {
    pages: () => PageModel.find().sort({ title: 1 }).lean().then((rows: Row[]) => rows.map(toPage)),

    page: ({ id }: { id: string }) =>
        PageModel.findById(id).lean().then((row: Row | null) => (row ? toPage(row) : null)),

    searchPages: async ({ q }: { q: string }) => {
        const query = q.trim();
        if (!query) return [];
        const rows = await PageModel.find({ $text: { $search: query } }, { score: { $meta: "textScore" } })
            .sort({ score: { $meta: "textScore" } })
            .limit(50)
            .lean();
        return rows.map(toPage);
    },

    documents: () =>
        DocumentModel.find().sort({ createdAt: -1 }).lean().then((rows: Row[]) => rows.map(toDocument)),

    document: ({ id }: { id: string }) =>
        DocumentModel.findById(id).lean().then((row: Row | null) => (row ? toDocument(row) : null)),

    createPage: async ({ input }: { input: PageInput }) => {
        const title = input.title?.trim();
        if (!title) throw new Error("A page needs a title.");
        const page = await PageModel.create({
            title,
            slug: await uniqueSlug(title, slugTaken),
            content: input.content ?? "",
            entityRefs: input.entityRefs ?? [],
        });
        return toPage(page.toObject());
    },

    // The slug is kept when a page is renamed, so links to it don't break.
    updatePage: async ({ id, input }: { id: string; input: PageInput }) => {
        const update: Record<string, unknown> = {};
        if (input.title !== undefined) {
            const title = input.title.trim();
            if (!title) throw new Error("A page needs a title.");
            update.title = title;
        }
        if (input.content !== undefined) update.content = input.content;
        if (input.entityRefs !== undefined) update.entityRefs = input.entityRefs;
        const row = await PageModel.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
        if (!row) throw new Error(`No page with id ${id}`);
        return toPage(row as Row);
    },

    deletePage: async ({ id }: { id: string }) => {
        const deleted = await PageModel.findByIdAndDelete(id);
        if (!deleted) return false;
        await Promise.all([
            ...ENTITY_TYPES.map((type) => entityModels[type].updateMany({ pageId: id }, { pageId: null })),
            DocumentModel.updateMany({ pageId: id }, { pageId: null }),
        ]);
        return true;
    },
};
