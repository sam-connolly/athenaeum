import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gql } from '@/lib/api'
import type { EntityRef, Page, PageSummary } from '@/types/api'

const SUMMARY_FIELDS = 'id title slug updatedAt entityRefs { type id name }'
const PAGE_FIELDS = `${SUMMARY_FIELDS} content createdAt sourceDocuments { id title sourceUrl createdAt }`

export const pageKeys = {
  all: ['pages'] as const,
  list: () => [...pageKeys.all, 'list'] as const,
  detail: (id: string) => [...pageKeys.all, 'detail', id] as const,
  search: (q: string) => [...pageKeys.all, 'search', q] as const,
}

export function usePages() {
  return useQuery({
    queryKey: pageKeys.list(),
    queryFn: () => gql<{ pages: PageSummary[] }>(`{ pages { ${SUMMARY_FIELDS} } }`).then((d) => d.pages),
  })
}

export function usePage(id: string | null) {
  return useQuery({
    queryKey: pageKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: () =>
      gql<{ page: Page | null }>(`query ($id: ID!) { page(id: $id) { ${PAGE_FIELDS} } }`, { id }).then((d) => d.page),
  })
}

export function useSearchPages(q: string) {
  const query = q.trim()
  return useQuery({
    queryKey: pageKeys.search(query),
    enabled: query.length > 0,
    queryFn: () =>
      gql<{ searchPages: PageSummary[] }>(`query ($q: String!) { searchPages(q: $q) { ${SUMMARY_FIELDS} } }`, {
        q: query,
      }).then((d) => d.searchPages),
  })
}

type PageInput = { title?: string; content?: string; entityRefs?: Pick<EntityRef, 'type' | 'id'>[] }

export function useCreatePage() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: PageInput) =>
      gql<{ createPage: Page }>(`mutation ($input: PageInput!) { createPage(input: $input) { ${PAGE_FIELDS} } }`, {
        input,
      }).then((d) => d.createPage),
    onSuccess: () => client.invalidateQueries({ queryKey: pageKeys.all }),
  })
}

export function useUpdatePage() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PageInput }) =>
      gql<{ updatePage: Page }>(
        `mutation ($id: ID!, $input: PageInput!) { updatePage(id: $id, input: $input) { ${PAGE_FIELDS} } }`,
        { id, input },
      ).then((d) => d.updatePage),
    onSuccess: () => client.invalidateQueries({ queryKey: pageKeys.all }),
  })
}

export function useDeletePage() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gql<{ deletePage: boolean }>(`mutation ($id: ID!) { deletePage(id: $id) }`, { id }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: pageKeys.all })
      client.invalidateQueries({ queryKey: ['entities'] })
    },
  })
}
