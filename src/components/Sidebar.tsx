import { useState } from 'react'
import { FileText, Pencil, Trash, FunnelSimple } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
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
import { EntityIcon } from '@/components/EntityIcon'
import { ENTITY_LABELS, ENTITY_TYPES, type EntityType, type PageSummary } from '@/types/api'
import { cn } from '@/lib/utils'

interface SidebarProps {
  /** Already narrowed by the search query (the server does the searching). */
  pages: PageSummary[]
  isSearching: boolean
  activePageId: string | null
  onSelectPage: (id: string) => void
  onDeletePage: (id: string) => void
  onRenamePage: (id: string, newTitle: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

type FilterKey = EntityType | 'unlinked'

export function Sidebar({
  pages,
  isSearching,
  activePageId,
  onSelectPage,
  onDeletePage,
  onRenamePage,
  searchQuery,
  onSearchChange,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [entityFilters, setEntityFilters] = useState<Record<FilterKey, boolean>>({
    faction: true,
    character: true,
    place: true,
    battle: true,
    unlinked: true,
  })

  // A page is shown if it links at least one entity of a ticked type (or is unlinked and "Unlinked" is ticked).
  const filteredPages = pages.filter((page) =>
    page.entityRefs.length === 0
      ? entityFilters.unlinked
      : page.entityRefs.some((ref) => entityFilters[ref.type]),
  )

  const activeFilterCount = Object.values(entityFilters).filter((v) => !v).length

  const toggleFilter = (key: FilterKey) => {
    setEntityFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleStartEdit = (page: PageSummary) => {
    setEditingId(page.id)
    setEditTitle(page.title)
  }

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenamePage(editingId, editTitle.trim())
    }
    setEditingId(null)
    setEditTitle('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDeletePage(deleteId)
      setDeleteId(null)
    }
  }

  // Icon of the first linked entity type, so faction and character pages stand out.
  const getPageIcon = (page: PageSummary) => {
    const type = ENTITY_TYPES.find((t) => page.entityRefs.some((ref) => ref.type === t))
    return type ? <EntityIcon type={type} size={18} /> : <FileText size={18} className="text-muted-foreground" />
  }

  return (
    <aside className="w-80 h-full border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Pages</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                <FunnelSimple size={18} />
                {activeFilterCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Show pages linking</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ENTITY_TYPES.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={entityFilters[type]}
                  onCheckedChange={() => toggleFilter(type)}
                >
                  <EntityIcon type={type} className="mr-2" />
                  {ENTITY_LABELS[type].many}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuCheckboxItem
                checked={entityFilters.unlinked}
                onCheckedChange={() => toggleFilter('unlinked')}
              >
                <FileText size={16} className="mr-2" />
                No entities
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Input
          type="search"
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="popLayout">
          {filteredPages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 text-center text-muted-foreground text-sm"
            >
              {isSearching ? 'Searching…' : searchQuery ? 'No matching pages' : 'No pages yet'}
            </motion.div>
          ) : (
            filteredPages.map((page) => (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                onMouseEnter={() => setHoveredId(page.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  'group relative mb-1 rounded-lg transition-colors',
                  activePageId === page.id
                    ? 'bg-secondary border-l-4 border-primary'
                    : 'hover:bg-secondary/50'
                )}
              >
                {editingId === page.id ? (
                  <div className="p-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      onBlur={handleSaveEdit}
                      autoFocus
                      className="h-8 text-sm"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectPage(page.id)}
                    className="w-full text-left p-3 flex items-start gap-2"
                  >
                    {getPageIcon(page)}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{page.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(page.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                )}

                {editingId !== page.id && hoveredId === page.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute right-2 top-2 flex gap-1"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartEdit(page)
                      }}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteId(page.id)
                      }}
                    >
                      <Trash size={14} />
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete page</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this page? Entities linked to it stay in the database. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}
