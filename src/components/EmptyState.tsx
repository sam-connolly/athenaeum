import { FileText } from '@phosphor-icons/react'
import { ImportDialog } from './ImportDialog'

interface EmptyStateProps {
  onImport: (title: string, content: string, sourceUrl?: string) => void
}

export function EmptyState({ onImport }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md px-8">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-secondary p-6">
            <FileText size={48} className="text-muted-foreground" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-3">Welcome to WikiDrive</h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Start building your knowledge base by importing documents from Google Drive or creating
          new ones from scratch.
        </p>
        <ImportDialog onImport={onImport} />
      </div>
    </div>
  )
}
