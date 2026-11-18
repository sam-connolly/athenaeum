import { useState } from 'react'
import { toast } from 'sonner'
import { Info, PencilSimple, Sparkle, Upload } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { EntityIcon } from '@/components/EntityIcon'
import { useCommitImport, usePreviewImport } from '@/hooks/use-import'
import { useCreatePage } from '@/hooks/use-pages'
import {
  ENTITY_LABELS,
  ENTITY_TYPES,
  PLACE_TYPE_LABELS,
  type EntityDecision,
  type ImportPreview,
  type ProposedEntity,
} from '@/types/api'

interface ImportDialogProps {
  onImported: (pageId: string) => void
  trigger?: React.ReactNode
}

type Mode = 'google' | 'paste' | 'write'

interface Edit {
  include: boolean
  useExisting: boolean
  name: string
  role: string
  summary: string
}

const initialEdits = (preview: ImportPreview): Record<string, Edit> =>
  Object.fromEntries(
    preview.entities.map((e) => [
      e.key,
      { include: true, useExisting: !!e.existingId, name: e.name, role: e.role ?? '', summary: e.summary },
    ]),
  )

export function ImportDialog({ onImported, trigger }: ImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('google')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')

  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [pageTitle, setPageTitle] = useState('')
  const [edits, setEdits] = useState<Record<string, Edit>>({})
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const previewImport = usePreviewImport()
  const commitImport = useCommitImport()
  const createPage = useCreatePage()

  const reset = () => {
    setUrl('')
    setTitle('')
    setText('')
    setPreview(null)
    setEdits({})
    setEditingKey(null)
    previewImport.reset()
    commitImport.reset()
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && (previewImport.isPending || commitImport.isPending)) return
    setOpen(next)
    if (!next) reset()
  }

  const finish = (pageId: string, message: string) => {
    toast.success(message)
    onImported(pageId)
    setOpen(false)
    reset()
  }

  const handleAnalyse = () => {
    const input = mode === 'google' ? { url: url.trim() } : { title: title.trim() || undefined, markdown: text }
    previewImport.mutate(input, {
      onSuccess: (result) => {
        setPreview(result)
        setPageTitle(result.title)
        setEdits(initialEdits(result))
      },
    })
  }

  const handleWrite = () => {
    createPage.mutate(
      { title: title.trim(), content: text },
      { onSuccess: (page) => finish(page.id, `Created "${page.title}"`), onError: (e) => toast.error(e.message) },
    )
  }

  const handleCommit = () => {
    if (!preview) return
    const decisions: EntityDecision[] = preview.entities.map((entity) => {
      const edit = edits[entity.key]!
      return {
        key: entity.key,
        include: edit.include,
        name: edit.name,
        summary: edit.summary,
        role: entity.type === 'character' ? edit.role : undefined,
        useExisting: edit.useExisting,
      }
    })
    commitImport.mutate(
      { documentId: preview.documentId, title: pageTitle.trim() || undefined, decisions },
      { onSuccess: (page) => finish(page.id, `Imported "${page.title}"`) },
    )
  }

  const update = (key: string, patch: Partial<Edit>) => setEdits((all) => ({ ...all, [key]: { ...all[key]!, ...patch } }))

  const included = preview ? preview.entities.filter((e) => edits[e.key]?.include) : []
  const merging = included.filter((e) => e.existingId && edits[e.key]?.useExisting).length
  const allIncluded = preview ? included.length === preview.entities.length : false

  const canAnalyse = mode === 'google' ? url.trim().length > 0 : text.trim().length > 0
  const canWrite = title.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Upload size={18} />
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{preview ? 'Review import' : 'Add a page'}</DialogTitle>
          <DialogDescription>
            {preview
              ? 'Choose which entities to add to the database. Matches with known entities are merged rather than duplicated.'
              : 'Import a Google Doc or pasted text (Claude finds the factions, characters, places and battles), or write a page by hand.'}
          </DialogDescription>
        </DialogHeader>

        {!preview ? (
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="google">Google Doc</TabsTrigger>
              <TabsTrigger value="paste">Paste text</TabsTrigger>
              <TabsTrigger value="write">Write page</TabsTrigger>
            </TabsList>

            <TabsContent value="google" className="space-y-2">
              <Label htmlFor="import-url">Google Docs link</Label>
              <Input
                id="import-url"
                placeholder="https://docs.google.com/document/d/…/edit"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={previewImport.isPending}
              />
              <p className="text-xs text-muted-foreground">
                The document must be shared as "Anyone with the link can view".
              </p>
            </TabsContent>

            <TabsContent value="paste" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="import-title">Title (optional)</Label>
                <Input
                  id="import-title"
                  placeholder="Taken from the first heading if left blank"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={previewImport.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-text">Text (markdown)</Label>
                <Textarea
                  id="import-text"
                  className="min-h-56 font-mono text-sm"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={previewImport.isPending}
                />
              </div>
            </TabsContent>

            <TabsContent value="write" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="write-title">Title</Label>
                <Input id="write-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="write-text">Content (markdown)</Label>
                <Textarea
                  id="write-text"
                  className="min-h-56 font-mono text-sm"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">No AI and no database entries: just a page.</p>
            </TabsContent>

            {previewImport.error && (
              <Alert variant="destructive">
                <AlertTitle>Couldn't read that document</AlertTitle>
                <AlertDescription>{previewImport.error.message}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              {mode === 'write' ? (
                <Button onClick={handleWrite} disabled={!canWrite || createPage.isPending}>
                  {createPage.isPending ? 'Creating…' : 'Create page'}
                </Button>
              ) : (
                <Button onClick={handleAnalyse} disabled={!canAnalyse || previewImport.isPending} className="gap-2">
                  <Sparkle size={16} weight="fill" />
                  {previewImport.isPending ? 'Reading with Claude… (up to a minute)' : 'Find entities'}
                </Button>
              )}
            </DialogFooter>
          </Tabs>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
              <div className="space-y-4 pb-2">
                <div className="space-y-2">
                  <Label htmlFor="page-title">Page title</Label>
                  <Input id="page-title" value={pageTitle} onChange={(e) => setPageTitle(e.target.value)} />
                </div>

                {preview.openQuestions.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>
                      {preview.openQuestions.length} open question{preview.openQuestions.length === 1 ? '' : 's'} in this
                      document
                    </AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        {preview.openQuestions.map((q, i) => (
                          <li key={i}>
                            <span className="font-medium">{q.type}:</span> {q.text}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {included.length} of {preview.entities.length} entities selected
                  </p>
                  {preview.entities.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEdits((all) =>
                          Object.fromEntries(Object.entries(all).map(([k, v]) => [k, { ...v, include: !allIncluded }])),
                        )
                      }
                    >
                      {allIncluded ? 'Deselect all' : 'Select all'}
                    </Button>
                  )}
                </div>

                {preview.entities.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No named entities found. The page will still be created.
                  </p>
                )}

                {ENTITY_TYPES.map((type) => {
                  const ofType = preview.entities.filter((e) => e.type === type)
                  if (!ofType.length) return null
                  return (
                    <section key={type} className="space-y-2">
                      <h3 className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <EntityIcon type={type} /> {ENTITY_LABELS[type].many}
                      </h3>
                      {ofType.map((entity) => (
                        <ProposalRow
                          key={entity.key}
                          entity={entity}
                          edit={edits[entity.key]!}
                          editing={editingKey === entity.key}
                          onEdit={(patch) => update(entity.key, patch)}
                          onToggleEditing={() => setEditingKey(editingKey === entity.key ? null : entity.key)}
                        />
                      ))}
                    </section>
                  )
                })}

                {commitImport.error && (
                  <Alert variant="destructive">
                    <AlertTitle>Import failed</AlertTitle>
                    <AlertDescription>{commitImport.error.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setPreview(null)} disabled={commitImport.isPending}>
                Back
              </Button>
              <Button onClick={handleCommit} disabled={commitImport.isPending || !pageTitle.trim()}>
                {commitImport.isPending
                  ? 'Importing…'
                  : `Create page, add ${included.length - merging} new${merging ? `, merge ${merging}` : ''}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ProposalRowProps {
  entity: ProposedEntity
  edit: Edit
  editing: boolean
  onEdit: (patch: Partial<Edit>) => void
  onToggleEditing: () => void
}

function ProposalRow({ entity, edit, editing, onEdit, onToggleEditing }: ProposalRowProps) {
  const details = [
    entity.type === 'character' ? edit.role : null,
    entity.placeType && entity.placeType !== 'other' ? PLACE_TYPE_LABELS[entity.placeType] : null,
    entity.date,
    entity.factionName,
  ].filter(Boolean) as string[]

  return (
    <div className={`border rounded-lg p-3 transition-colors ${edit.include ? 'bg-secondary/40' : 'opacity-60'}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={edit.include}
          onCheckedChange={(checked) => onEdit({ include: checked === true })}
          aria-label={`Include ${edit.name}`}
          className="mt-1"
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          {editing ? (
            <div className="space-y-2">
              <Input value={edit.name} onChange={(e) => onEdit({ name: e.target.value })} aria-label="Name" />
              {entity.type === 'character' && (
                <Input value={edit.role} onChange={(e) => onEdit({ role: e.target.value })} placeholder="Role" aria-label="Role" />
              )}
              <Textarea value={edit.summary} onChange={(e) => onEdit({ summary: e.target.value })} aria-label="Summary" />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium">{edit.name}</span>
                {details.map((d) => (
                  <Badge key={d} variant="secondary" className="text-xs">
                    {d}
                  </Badge>
                ))}
              </div>
              {entity.aliases.length > 0 && (
                <p className="text-xs text-muted-foreground">Also called: {entity.aliases.join(', ')}</p>
              )}
              {edit.summary && <p className="text-sm text-muted-foreground line-clamp-2">{edit.summary}</p>}
            </>
          )}

          {entity.existingId && (
            <label className="flex items-center gap-2 text-xs">
              <Switch
                checked={edit.useExisting}
                onCheckedChange={(checked) => onEdit({ useExisting: checked })}
                disabled={!edit.include}
              />
              {edit.useExisting ? (
                <span>
                  Merge into existing <strong>{entity.existingName}</strong>
                  {entity.matchedBy === 'ai' && <span className="text-muted-foreground"> (Claude's match: check it)</span>}
                </span>
              ) : (
                <span>Create as a new {ENTITY_LABELS[entity.type].one.toLowerCase()}</span>
              )}
            </label>
          )}
        </div>
        <Button variant="ghost" size="icon" className="shrink-0" onClick={onToggleEditing} aria-label={editing ? 'Done editing' : 'Edit'}>
          <PencilSimple size={16} />
        </Button>
      </div>
    </div>
  )
}
