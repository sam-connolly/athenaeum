import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSaveEntity } from '@/hooks/use-entities'
import {
  ENTITY_LABELS,
  PLACE_TYPE_LABELS,
  type AnyEntity,
  type Battle,
  type Character,
  type EntityLists,
  type EntityType,
  type Faction,
  type PageSummary,
  type Place,
  type PlaceType,
} from '@/types/api'

const NONE = '__none__'

interface EntityFormProps {
  type: EntityType
  /** The entity to edit, or null to create one. */
  entity: AnyEntity | null
  lists: EntityLists
  pages: PageSummary[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Values = Record<string, string | string[]>

function initialValues(type: EntityType, entity: AnyEntity | null): Values {
  const base = {
    name: entity?.name ?? '',
    aliases: entity?.aliases.join(', ') ?? '',
    summary: entity?.summary ?? '',
    pageId: entity?.pageId ?? '',
  }
  switch (type) {
    case 'faction': {
      const f = entity as Faction | null
      return { ...base, homeworldId: f?.homeworldId ?? '', parentFactionId: f?.parentFactionId ?? '' }
    }
    case 'character': {
      const c = entity as Character | null
      return { ...base, role: c?.role ?? '', factionId: c?.factionId ?? '', battleIds: c?.battleIds ?? [] }
    }
    case 'place': {
      const p = entity as Place | null
      return { ...base, type: p?.type ?? 'other', factionId: p?.factionId ?? '' }
    }
    case 'battle': {
      const b = entity as Battle | null
      return { ...base, date: b?.date ?? '', placeId: b?.placeId ?? '', factionIds: b?.factionIds ?? [] }
    }
  }
}

function toInput(values: Values): Record<string, unknown> {
  const { aliases, ...rest } = values
  return {
    ...rest,
    aliases: String(aliases)
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean),
  }
}

export function EntityForm({ type, entity, lists, pages, open, onOpenChange }: EntityFormProps) {
  const [values, setValues] = useState<Values>(() => initialValues(type, entity))
  const save = useSaveEntity(type)
  const set = (key: string, value: string | string[]) => setValues((v) => ({ ...v, [key]: value }))

  const label = ENTITY_LABELS[type].one
  const others = (list: { id: string; name: string }[]) => list.filter((item) => item.id !== entity?.id)

  const handleSave = () => {
    save.mutate(
      { id: entity?.id, input: toInput(values) },
      {
        onSuccess: () => {
          toast.success(`${label} ${entity ? 'updated' : 'added'}`)
          onOpenChange(false)
        },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  const select = (key: string, title: string, options: { id: string; name: string }[]) => (
    <div className="space-y-1.5">
      <Label>{title}</Label>
      <Select value={(values[key] as string) || NONE} onValueChange={(v) => set(key, v === NONE ? '' : v)}>
        <SelectTrigger className="w-full" aria-label={title}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>None</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const multi = (key: string, title: string, options: { id: string; name: string }[]) => {
    const selected = values[key] as string[]
    return (
      <div className="space-y-1.5">
        <Label>{title}</Label>
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">None in the database yet.</p>
        ) : (
          <div className="max-h-36 overflow-y-auto rounded-md border p-2 space-y-1.5">
            {options.map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selected.includes(o.id)}
                  onCheckedChange={(checked) =>
                    set(key, checked ? [...selected, o.id] : selected.filter((id) => id !== o.id))
                  }
                />
                {o.name}
              </label>
            ))}
          </div>
        )}
      </div>
    )
  }

  const pageOptions = pages.map((p) => ({ id: p.id, name: p.title }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entity ? `Edit ${entity.name}` : `Add ${label.toLowerCase()}`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="entity-name">Name</Label>
            <Input id="entity-name" value={values.name as string} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="entity-aliases">Other names</Label>
            <Input
              id="entity-aliases"
              placeholder="Comma-separated, used to recognise it in imports"
              value={values.aliases as string}
              onChange={(e) => set('aliases', e.target.value)}
            />
          </div>

          {type === 'character' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="entity-role">Role</Label>
                <Input id="entity-role" value={values.role as string} onChange={(e) => set('role', e.target.value)} />
              </div>
              {select('factionId', 'Faction', lists.factions)}
              {multi('battleIds', 'Battles', lists.battles)}
            </>
          )}
          {type === 'faction' && (
            <>
              {select('parentFactionId', 'Parent faction', others(lists.factions))}
              {select('homeworldId', 'Homeworld', lists.places)}
            </>
          )}
          {type === 'place' && (
            <>
              <div className="space-y-1.5">
                <Label>Kind of place</Label>
                <Select value={values.type as string} onValueChange={(v) => set('type', v as PlaceType)}>
                  <SelectTrigger className="w-full" aria-label="Kind of place">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLACE_TYPE_LABELS).map(([value, text]) => (
                      <SelectItem key={value} value={value}>
                        {text}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {select('factionId', 'Faction', lists.factions)}
            </>
          )}
          {type === 'battle' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="entity-date">Date</Label>
                <Input id="entity-date" placeholder="e.g. 745.M41" value={values.date as string} onChange={(e) => set('date', e.target.value)} />
              </div>
              {select('placeId', 'Location', lists.places)}
              {multi('factionIds', 'Factions involved', lists.factions)}
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="entity-summary">Summary</Label>
            <Textarea id="entity-summary" value={values.summary as string} onChange={(e) => set('summary', e.target.value)} />
          </div>
          {select('pageId', 'Own page', pageOptions)}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!(values.name as string).trim() || save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
