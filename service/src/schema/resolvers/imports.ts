import { commitImport, previewImport, type CommitInput, type PreviewInput } from "../../import/pipeline.ts";
import { toPage, type Row } from "../mappers.ts";

export const importResolvers = {
    previewImport: ({ input }: { input: PreviewInput }) => previewImport(input),
    commitImport: async ({ input }: { input: CommitInput }) => toPage((await commitImport(input)) as Row),
};
