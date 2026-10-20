import { Schema, model, type InferSchemaType } from "mongoose";

const documentSchema = new Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        sourceFormat: {
            type: String,
            enum: ["manual", "google-docs-export"],
            default: "manual",
        },
    },
    { timestamps: true },
);

export type DocumentEntity = InferSchemaType<typeof documentSchema>;

export const DocumentModel = model("Document", documentSchema);
