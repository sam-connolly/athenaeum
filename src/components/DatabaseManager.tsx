import { useState } from 'react'
import { toast } from 'sonner'
import { Database, Download, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EntityForm } from '@/components/EntityForm'
import { EntityIcon } from '@/components/EntityIcon'
import { useDeleteEntity, useEntities } from '@/hooks/use-entities'
import { usePages } from '@/hooks/use-pages'
import { downloadEntitiesAsJson } from '@/lib/database-utils'
import {
  ENTITY_LABELS,
  ENTITY_TYPES,
  PLACE_TYPE_LABELS,
  type AnyEntity,
  type Battle,
  type Character,
  type EntityLists,
  type EntityType,
  type Faction,
  type Place,
} from '@/types/api'

interface DatabaseManagerProps {
  onOpenPage: (pageId: string) => void
}

const listFor = (lists: EntityLists, type: EntityType): AnyEntity[] =>
  ({ faction: lists.factions, character: lists.characters, place: lists.places, battle: lists.battles })[type]

const DELETE_NOTES: Record<EntityType, string> = {
  faction: 'Its characters and places stay, but are no longer linked to it.',
  character: 'Pages that mention it are kept.',
  place: 'Factions and battles that point to it are unlinked.',
  battle: 'Characters that fought in it are kept.',
}

/** Type-specific columns: [header, cell renderer]. */
function columns(type: EntityType, lists: EntityLists): [string, (e: AnyEntity) => React.ReactNode][] {
  const name = (list: { id: string; name: string }[], id: string | null) => list.find((x) => x.id === id)?.name ?? '—'
  switch (type) {
    case 'faction':
      return [
        ['Members', (e) => lists.characters.filter((c) => c.factionId === e.id).length],
        ['Homeworld', (e) => name(lists.places, (e as Faction).homeworldId)],
      ]
    case 'character':
      return [
        ['Role', (e) => (e as Character).role || '—'],
        ['Faction', (e) => name(lists.factions, (e as Character).factionId)],
      ]
    case 'place':
      return [
        ['Kind', (e) => PLACE_TYPE_LABELS[(e as Place).type]],
        ['Faction', (e) => name(lists.factions, (e as Place).factionId)],
      ]
    case 'battle':
      return [
        ['Date', (e) => (e as Battle).date || '—'],
        ['Location', (e) => name(lists.places, (e as Battle).placeId)],
      ]
  }
}

export function DatabaseManager({ onOpenPage }: DatabaseManagerProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<EntityType>('faction')
  const [form, setForm] = useState<{ type: EntityType; entity: AnyEntity | null } | null>(null)
  const [toDelete, setToDelete] = useState<{ type: EntityType; entity: AnyEntity } | null>(null)

  const { lists, isLoading, error } = useEntities()
  const { data: pages = [] } = usePages()
  const deleteEntity = useDeleteEntity(toDelete?.type ?? 'faction')

  const handleDelete = () => {
    if (!toDelete) return
    deleteEntity.mutate(toDelete.entity.id, {
      onSuccess: () => toast.success(`Deleted ${toDelete.entity.name}`),
      onError: (e) => toast.error(e.message),
      onSettled: () => setToDelete(null),
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Entity database">
          <Database size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-8">
            <div>
              <DialogTitle>Entity database</DialogTitle>
              <DialogDescription>
                The index behind the wiki: used for tables, and to recognise known entities in new imports.
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadEntitiesAsJson(lists)}>
              <Download size={16} /> Export JSON
            </Button>
          </div>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error.message}</p>}

        <Tabs value={tab} onValueChange={(v) => setTab(v as EntityType)} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            {ENTITY_TYPES.map((type) => (
              <TabsTrigger key={type} value={type} className="gap-1.5">
                <EntityIcon type={type} /> {ENTITY_LABELS[type].many}
                <Badge variant="secondary" className="ml-1">
                  {listFor(lists, type).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {ENTITY_TYPES.map((type) => {
            const rows = listFor(lists, type)
            const cols = columns(type, lists)
            return (
              <TabsContent key={type} value={type} className="flex-1 min-h-0 overflow-y-auto space-y-3">
                <div className="flex justify-end">
                  <Button size="sm" className="gap-2" onClick={() => setForm({ type, entity: null })}>
                    <Plus size={16} /> Add {ENTITY_LABELS[type].one.toLowerCase()}
                  </Button>
                </div>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No {ENTITY_LABELS[type].many.toLowerCase()} yet. Import a document or add one.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        {cols.map(([header]) => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                        <TableHead>Sources</TableHead>
                        <TableHead className="w-24" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((entity) => (
                        <TableRow key={entity.id}>
                          <TableCell className="max-w-64">
                            {entity.pageId ? (
                              <button
                                className="font-medium hover:text-primary hover:underline underline-offset-2 text-left"
                                onClick={() => {
                                  onOpenPage(entity.pageId!)
                                  setOpen(false)
                                }}
                              >
                                {entity.name}
                              </button>
                            ) : (
                              <span className="font-medium">{entity.name}</span>
                            )}
                            {entity.aliases.length > 0 && (
                              <p className="text-xs text-muted-foreground truncate" title={entity.aliases.join(', ')}>
                                {entity.aliases.join(', ')}
                              </p>
                            )}
                          </TableCell>
                          {cols.map(([header, cell]) => (
                            <TableCell key={header}>{cell(entity)}</TableCell>
                          ))}
                          <TableCell>{entity.sourceDocumentIds.length}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button variant="ghost" size="icon" aria-label={`Edit ${entity.name}`} onClick={() => setForm({ type, entity })}>
                              <PencilSimple size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              aria-label={`Delete ${entity.name}`}
                              onClick={() => setToDelete({ type, entity })}
                            >
                              <Trash size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            )
          })}
        </Tabs>

        {form && (
          <EntityForm
            key={`${form.type}-${form.entity?.id ?? 'new'}`}
            type={form.type}
            entity={form.entity}
            lists={lists}
            pages={pages}
            open
            onOpenChange={(next) => !next && setForm(null)}
          />
        )}

        <AlertDialog open={!!toDelete} onOpenChange={(next) => !next && setToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {toDelete?.entity.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                {toDelete && DELETE_NOTES[toDelete.type]} This can't be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
