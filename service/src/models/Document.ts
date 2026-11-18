import { Schema, model, type InferSchemaType } from "mongoose";

/** One raw import source, kept so a page can always be traced back to what was imported. */
const documentSchema = new Schema(
    {
        title: { type: String, required: true },
        sourceUrl: { type: String, default: null },
        sourceFormat: {
            type: String,
            enum: ["manual", "google-docs-export"],
            default: "manual",
        },
        raw: { type: String, required: true },
        cleaned: { type: String, default: "" },
        openQuestions: [
            {
                _id: false,
                type: { type: String, enum: ["TODO", "IDEA"], required: true },
                text: { type: String, required: true },
            },
        ],
        // The entities proposed by the preview step, stored so commit can apply
        // the user's decisions without re-running extraction.
        proposedEntities: { type: Schema.Types.Mixed, default: [] },
        status: { type: String, enum: ["draft", "committed"], default: "draft" },
        pageId: { type: Schema.Types.ObjectId, ref: "Page", default: null },
    },
    { timestamps: true },
);

export type DocumentEntity = InferSchemaType<typeof documentSchema>;

export const DocumentModel = model("Document", documentSchema);
