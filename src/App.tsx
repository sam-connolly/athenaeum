import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { List } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sidebar } from '@/components/Sidebar'
import { DocumentRenderer } from '@/components/DocumentRenderer'
import { EmptyState } from '@/components/EmptyState'
import { ImportDialog } from '@/components/ImportDialog'
import type { Document } from '@/types/document'
import { useIsMobile } from '@/hooks/use-mobile'

function App() {
  const [documentsRaw, setDocuments] = useKV<Document[]>('wiki-documents', [])
  const documents = documentsRaw || []
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  const activeDocument = documents.find((doc) => doc.id === activeDocumentId) || null

  const handleImport = (title: string, content: string, sourceUrl?: string) => {
    const newDoc: Document = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceUrl,
    }

    setDocuments((currentDocs) => [newDoc, ...(currentDocs || [])])
    setActiveDocumentId(newDoc.id)
    setSidebarOpen(false)
  }

  const handleDeleteDocument = (id: string) => {
    setDocuments((currentDocs) => (currentDocs || []).filter((doc) => doc.id !== id))
    if (activeDocumentId === id) {
      setActiveDocumentId(null)
    }
  }

  const handleRenameDocument = (id: string, newTitle: string) => {
    setDocuments((currentDocs) =>
      (currentDocs || []).map((doc) =>
        doc.id === id ? { ...doc, title: newTitle, updatedAt: Date.now() } : doc
      )
    )
  }

  const handleSelectDocument = (id: string) => {
    setActiveDocumentId(id)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const sidebarContent = (
    <Sidebar
      documents={documents}
      activeDocumentId={activeDocumentId}
      onSelectDocument={handleSelectDocument}
      onDeleteDocument={handleDeleteDocument}
      onRenameDocument={handleRenameDocument}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    />
  )

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center gap-3 flex-shrink-0">
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <List size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        )}
        
        <h1 className="text-xl font-semibold flex-1">WikiDrive</h1>
        
        <ImportDialog onImport={handleImport} />
      </header>

      <div className="flex-1 flex overflow-hidden">
        {!isMobile && sidebarContent}

        <main className="flex-1 overflow-hidden">
          {documents.length === 0 ? (
            <EmptyState onImport={handleImport} />
          ) : (
            <ScrollArea className="h-full">
              <DocumentRenderer document={activeDocument} />
            </ScrollArea>
          )}
        </main>
      </div>

      <Toaster />
    </div>
  )
}

export default App