import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { List } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sidebar } from '@/components/Sidebar'
import { PageView } from '@/components/PageView'
import { EmptyState } from '@/components/EmptyState'
import { ImportDialog } from '@/components/ImportDialog'
import { DatabaseManager } from '@/components/DatabaseManager'
import { useDeletePage, usePages, useSearchPages, useUpdatePage } from '@/hooks/use-pages'
import { useIsMobile } from '@/hooks/use-mobile'

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(timer)
  }, [value, ms])
  return debounced
}

function App() {
  const [activePageId, setActivePageId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  const pagesQuery = usePages()
  const debouncedQuery = useDebounced(searchQuery, 250)
  const searchResults = useSearchPages(debouncedQuery)
  const updatePage = useUpdatePage()
  const deletePage = useDeletePage()

  const allPages = pagesQuery.data ?? []
  const searching = debouncedQuery.trim().length > 0
  const visiblePages = searching ? (searchResults.data ?? []) : allPages

  const selectPage = (id: string) => {
    setActivePageId(id)
    if (isMobile) setSidebarOpen(false)
  }

  const handleDelete = (id: string) => {
    deletePage.mutate(id, {
      onSuccess: () => {
        if (activePageId === id) setActivePageId(null)
        toast.success('Page deleted')
      },
      onError: (e) => toast.error(e.message),
    })
  }

  const handleRename = (id: string, title: string) => {
    updatePage.mutate({ id, input: { title } }, { onError: (e) => toast.error(e.message) })
  }

  const sidebarContent = (
    <Sidebar
      pages={visiblePages}
      isSearching={searching && searchResults.isFetching}
      activePageId={activePageId}
      onSelectPage={selectPage}
      onDeletePage={handleDelete}
      onRenamePage={handleRename}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    />
  )

  const renderMain = () => {
    if (pagesQuery.error) {
      return (
        <div className="flex items-center justify-center h-full p-8 text-center text-muted-foreground">
          <p>{pagesQuery.error.message}</p>
        </div>
      )
    }
    if (pagesQuery.isSuccess && allPages.length === 0) return <EmptyState onImported={selectPage} />
    return (
      <ScrollArea className="h-full">
        <PageView pageId={activePageId} onSelectPage={selectPage} />
      </ScrollArea>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      <header className="border-b border-border bg-card px-4 py-3 flex items-center gap-3 flex-shrink-0">
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open page list">
                <List size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        )}

        <h1 className="text-xl font-semibold flex-1">Athenaeum</h1>

        <div className="flex items-center gap-2">
          <DatabaseManager onOpenPage={selectPage} />
          <ImportDialog onImported={selectPage} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {!isMobile && sidebarContent}
        <main className="flex-1 overflow-hidden">{renderMain()}</main>
      </div>

      <Toaster />
    </div>
  )
}

export default App
