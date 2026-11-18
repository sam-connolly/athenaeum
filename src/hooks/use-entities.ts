import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gql } from '@/lib/api'
import { ENTITY_LABELS, type EntityLists, type EntityType } from '@/types/api'
import { pageKeys } from '@/hooks/use-pages'

const BASE = 'id name aliases summary pageId sourceDocumentIds updatedAt'

const ENTITIES_QUERY = `{
  factions { ${BASE} homeworldId parentFactionId }
  characters { ${BASE} role stub factionId battleIds }
  places { ${BASE} type factionId }
  battles { ${BASE} date placeId factionIds }
}`

export const entityKeys = { all: ['entities'] as const }

const EMPTY: EntityLists = { factions: [], characters: [], places: [], battles: [] }

/** All four entity lists in one request — the index is small, and every view cross-references it. */
export function useEntities() {
  const query = useQuery({
    queryKey: entityKeys.all,
    queryFn: () => gql<EntityLists>(ENTITIES_QUERY),
  })
  return { ...query, lists: query.data ?? EMPTY }
}

const capitalised = (type: EntityType) => ENTITY_LABELS[type].one

const INPUT_TYPES: Record<EntityType, string> = {
  faction: 'FactionInput',
  character: 'CharacterInput',
  place: 'PlaceInput',
  battle: 'BattleInput',
}

export function useSaveEntity(type: EntityType) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: Record<string, unknown> }) => {
      const name = capitalised(type)
      const inputType = INPUT_TYPES[type]
      return id
        ? gql(`mutation ($id: ID!, $input: ${inputType}!) { update${name}(id: $id, input: $input) { id } }`, { id, input })
        : gql(`mutation ($input: ${inputType}!) { create${name}(input: $input) { id } }`, { input })
    },
    onSuccess: () => client.invalidateQueries({ queryKey: entityKeys.all }),
  })
}

export function useDeleteEntity(type: EntityType) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gql(`mutation ($id: ID!) { delete${capitalised(type)}(id: $id) }`, { id }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: entityKeys.all })
      // Deleting an entity unlinks it from pages.
      client.invalidateQueries({ queryKey: pageKeys.all })
    },
  })
}
