import { useState } from 'react'
import { FileText, Pencil, Trash, User, Shield, Sword, FunnelSimple } from '@phosphor-icons/react'
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
import type { Document } from '@/types/document'
import { cn } from '@/lib/utils'

interface SidebarProps {
  documents: Document[]
  activeDocumentId: string | null
  onSelectDocument: (id: string) => void
  onDeleteDocument: (id: string) => void
  onRenameDocument: (id: string, newTitle: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function Sidebar({
  documents,
  activeDocumentId,
  onSelectDocument,
  onDeleteDocument,
  onRenameDocument,
  searchQuery,
  onSearchChange,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [entityFilters, setEntityFilters] = useState<{
    character: boolean
    faction: boolean
    battle: boolean
    unlinked: boolean
  }>({
    character: true,
    faction: true,
    battle: true,
    unlinked: true,
  })

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (doc.entityType === 'character') return entityFilters.character
    if (doc.entityType === 'faction') return entityFilters.faction
    if (doc.entityType === 'battle') return entityFilters.battle
    if (!doc.entityType) return entityFilters.unlinked

    return true
  })

  const activeFilterCount = Object.values(entityFilters).filter((v) => !v).length

  const toggleFilter = (key: keyof typeof entityFilters) => {
    setEntityFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleStartEdit = (doc: Document) => {
    setEditingId(doc.id)
    setEditTitle(doc.title)
  }

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameDocument(editingId, editTitle.trim())
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
      onDeleteDocument(deleteId)
      setDeleteId(null)
    }
  }

  const getDocumentIcon = (doc: Document) => {
    switch (doc.entityType) {
      case 'character':
        return <User size={18} className="text-accent" />
      case 'faction':
        return <Shield size={18} className="text-primary" />
      case 'battle':
        return <Sword size={18} className="text-destructive" />
      default:
        return <FileText size={18} className="text-muted-foreground" />
    }
  }

  return (
    <aside className="w-80 h-full border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Documents</h2>
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
              <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={entityFilters.character}
                onCheckedChange={() => toggleFilter('character')}
              >
                <User size={16} className="mr-2" />
                Characters
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={entityFilters.faction}
                onCheckedChange={() => toggleFilter('faction')}
              >
                <Shield size={16} className="mr-2" />
                Factions
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={entityFilters.battle}
                onCheckedChange={() => toggleFilter('battle')}
              >
                <Sword size={16} className="mr-2" />
                Battles
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={entityFilters.unlinked}
                onCheckedChange={() => toggleFilter('unlinked')}
              >
                <FileText size={16} className="mr-2" />
                Unlinked
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Input
          type="search"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="popLayout">
          {filteredDocs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 text-center text-muted-foreground text-sm"
            >
              {searchQuery ? 'No matching documents' : 'No documents yet'}
            </motion.div>
          ) : (
            filteredDocs.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                onMouseEnter={() => setHoveredId(doc.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={cn(
                  'group relative mb-1 rounded-lg transition-colors',
                  activeDocumentId === doc.id
                    ? 'bg-secondary border-l-4 border-primary'
                    : 'hover:bg-secondary/50'
                )}
              >
                {editingId === doc.id ? (
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
                    onClick={() => onSelectDocument(doc.id)}
                    className="w-full text-left p-3 flex items-start gap-2"
                  >
                    {getDocumentIcon(doc)}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{doc.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                )}

                {editingId !== doc.id && hoveredId === doc.id && (
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
                        handleStartEdit(doc)
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
                        setDeleteId(doc.id)
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
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
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
