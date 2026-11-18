import { useMutation, useQueryClient } from '@tanstack/react-query'
import { gql } from '@/lib/api'
import type { EntityDecision, ImportPreview, Page } from '@/types/api'
import { pageKeys } from '@/hooks/use-pages'
import { entityKeys } from '@/hooks/use-entities'

const PREVIEW = `mutation ($input: PreviewImportInput!) {
  previewImport(input: $input) {
    documentId title content
    openQuestions { type text }
    entities { key type name aliases summary role placeType date factionName existingId existingName matchedBy }
  }
}`

const COMMIT = `mutation ($input: CommitImportInput!) { commitImport(input: $input) { id title } }`

export function usePreviewImport() {
  return useMutation({
    mutationFn: (input: { url?: string; title?: string; markdown?: string }) =>
      gql<{ previewImport: ImportPreview }>(PREVIEW, { input }).then((d) => d.previewImport),
  })
}

export function useCommitImport() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: { documentId: string; title?: string; decisions: EntityDecision[] }) =>
      gql<{ commitImport: Pick<Page, 'id' | 'title'> }>(COMMIT, { input }).then((d) => d.commitImport),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: pageKeys.all })
      client.invalidateQueries({ queryKey: entityKeys.all })
    },
  })
}
