import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowSquareOut } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { LinkedEntities } from '@/components/LinkedEntities'
import { usePage, usePages } from '@/hooks/use-pages'
import { renderMarkdown } from '@/lib/markdown'

interface PageViewProps {
  pageId: string | null
  onSelectPage: (id: string) => void
}

export function PageView({ pageId, onSelectPage }: PageViewProps) {
  const { data: page, isLoading, error } = usePage(pageId)
  const { data: pages = [] } = usePages()

  const rendered = useMemo(() => (page ? renderMarkdown(page.content) : null), [page])

  if (!pageId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <p className="text-lg">Select a page to read</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-8 space-y-4">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !page || !rendered) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground p-8 text-center">
        <p>{error ? error.message : 'This page no longer exists.'}</p>
      </div>
    )
  }

  const contents = rendered.headings.filter((h) => h.depth <= 3)

  return (
    <motion.article
      key={page.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-3xl mx-auto p-4 md:p-8 space-y-6"
    >
      <header className="border-b border-border pb-6">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2">{page.title}</h1>
        <time className="text-sm text-muted-foreground" dateTime={page.updatedAt}>
          Last updated {new Date(page.updatedAt).toLocaleDateString()}
        </time>
      </header>

      <LinkedEntities refs={page.entityRefs} currentPageId={page.id} pages={pages} onSelectPage={onSelectPage} />

      {contents.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-3">Contents</h2>
            <nav className="space-y-1">
              {contents.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className="block text-sm hover:text-primary transition-colors"
                  style={{ paddingLeft: `${(heading.depth - 1) * 1}rem` }}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </CardContent>
        </Card>
      )}

      {/* renderMarkdown drops raw HTML, images and unsafe link schemes. */}
      <div className="page-content" dangerouslySetInnerHTML={{ __html: rendered.html }} />

      {page.sourceDocuments.length > 0 && (
        <footer className="border-t border-border pt-4 text-sm text-muted-foreground">
          <p className="font-medium mb-1">Sources</p>
          <ul className="space-y-1">
            {page.sourceDocuments.map((source) => (
              <li key={source.id}>
                {source.sourceUrl ? (
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-primary"
                  >
                    {source.title} <ArrowSquareOut size={14} />
                  </a>
                ) : (
                  <span>{source.title} (pasted)</span>
                )}{' '}
                · imported {new Date(source.createdAt).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </footer>
      )}
    </motion.article>
  )
}
