import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { EntityIcon } from '@/components/EntityIcon'
import { useEntities } from '@/hooks/use-entities'
import {
  ENTITY_LABELS,
  ENTITY_TYPES,
  PLACE_TYPE_LABELS,
  type AnyEntity,
  type Battle,
  type Character,
  type EntityLists,
  type EntityRef,
  type EntityType,
  type PageSummary,
  type Place,
} from '@/types/api'

interface LinkedEntitiesProps {
  refs: EntityRef[]
  currentPageId: string
  pages: PageSummary[]
  onSelectPage: (id: string) => void
}

function findEntity(lists: EntityLists, type: EntityType, id: string): AnyEntity | undefined {
  const list: AnyEntity[] = { faction: lists.factions, character: lists.characters, place: lists.places, battle: lists.battles }[type]
  return list.find((entity) => entity.id === id)
}

/** Short facts shown as badges under an entity's name. */
function facts(type: EntityType, entity: AnyEntity, lists: EntityLists): string[] {
  const factionName = (id: string | null) => lists.factions.find((f) => f.id === id)?.name
  const out: (string | undefined)[] = []
  if (type === 'character') {
    const c = entity as Character
    out.push(c.role || undefined, factionName(c.factionId))
    out.push(...c.battleIds.map((id) => lists.battles.find((b) => b.id === id)?.name))
  } else if (type === 'place') {
    const p = entity as Place
    out.push(p.type !== 'other' ? PLACE_TYPE_LABELS[p.type] : undefined, factionName(p.factionId))
  } else if (type === 'battle') {
    const b = entity as Battle
    out.push(b.date || undefined, lists.places.find((p) => p.id === b.placeId)?.name)
  } else {
    const members = lists.characters.filter((c) => c.factionId === entity.id).length
    out.push(members ? `${members} member${members === 1 ? '' : 's'}` : undefined)
  }
  return out.filter((fact): fact is string => !!fact)
}

/** The index entities found in a page, with a link to each one's own page and other pages that mention it. */
export function LinkedEntities({ refs, currentPageId, pages, onSelectPage }: LinkedEntitiesProps) {
  const { lists } = useEntities()
  if (!refs.length) return null

  const otherPagesFor = (ref: EntityRef) =>
    pages.filter((p) => p.id !== currentPageId && p.entityRefs.some((r) => r.type === ref.type && r.id === ref.id))

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        {ENTITY_TYPES.map((type) => {
          const ofType = refs.filter((ref) => ref.type === type)
          if (!ofType.length) return null
          return (
            <section key={type}>
              <h2 className="text-sm text-muted-foreground mb-2">{ENTITY_LABELS[type].many}</h2>
              <ul className="space-y-3">
                {ofType.map((ref) => {
                  const entity = findEntity(lists, type, ref.id)
                  const others = otherPagesFor(ref)
                  const ownPageId = entity?.pageId && entity.pageId !== currentPageId ? entity.pageId : null
                  return (
                    <li key={ref.id} className="flex gap-2">
                      <EntityIcon type={type} className="mt-1 shrink-0" />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {ownPageId ? (
                            <button className="font-medium hover:text-primary underline-offset-2 hover:underline" onClick={() => onSelectPage(ownPageId)}>
                              {entity?.name ?? ref.name}
                            </button>
                          ) : (
                            <span className="font-medium">{entity?.name ?? ref.name}</span>
                          )}
                          {entity && facts(type, entity, lists).map((fact) => (
                            <Badge key={fact} variant="secondary" className="text-xs">
                              {fact}
                            </Badge>
                          ))}
                        </div>
                        {entity?.summary && <p className="text-sm text-muted-foreground">{entity.summary}</p>}
                        {others.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Also in:{' '}
                            {others.map((p, i) => (
                              <span key={p.id}>
                                {i > 0 && ', '}
                                <button className="hover:text-primary underline underline-offset-2" onClick={() => onSelectPage(p.id)}>
                                  {p.title}
                                </button>
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </CardContent>
    </Card>
  )
}
