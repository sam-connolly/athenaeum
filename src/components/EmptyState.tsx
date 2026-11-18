import { BookOpen } from '@phosphor-icons/react'
import { ImportDialog } from './ImportDialog'

interface EmptyStateProps {
  onImported: (pageId: string) => void
}

export function EmptyState({ onImported }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md px-8 space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-secondary p-6">
            <BookOpen size={48} className="text-muted-foreground" />
          </div>
        </div>
        <p className="text-muted-foreground">No pages yet. Import a lore document to start the wiki.</p>
        <ImportDialog onImported={onImported} />
      </div>
    </div>
  )
}
