import { motion } from 'framer-motion'
import type { Document } from '@/types/document'

interface DocumentRendererProps {
  document: Document | null
}

export function DocumentRenderer({ document }: DocumentRendererProps) {
  if (!document) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-lg">Select a document to view</p>
      </div>
    )
  }

  const lines = document.content.split('\n')
  
  return (
    <motion.article
      key={document.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-3xl mx-auto p-8 space-y-6"
    >
      <header className="border-b border-border pb-6 mb-8">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2">
          {document.title}
        </h1>
        <time className="text-sm text-muted-foreground">
          Last updated: {new Date(document.updatedAt).toLocaleDateString()}
        </time>
      </header>

      <div className="prose prose-lg max-w-none space-y-4">
        {lines.map((line, index) => {
          if (line.trim() === '') {
            return <div key={index} className="h-4" />
          }
          
          if (line.startsWith('# ')) {
            return (
              <h1 key={index} className="text-3xl font-semibold mt-8 mb-4 tracking-tight">
                {line.substring(2)}
              </h1>
            )
          }
          
          if (line.startsWith('## ')) {
            return (
              <h2 key={index} className="text-2xl font-semibold mt-6 mb-3 tracking-tight">
                {line.substring(3)}
              </h2>
            )
          }
          
          if (line.startsWith('### ')) {
            return (
              <h3 key={index} className="text-xl font-medium mt-5 mb-2 tracking-tight">
                {line.substring(4)}
              </h3>
            )
          }
          
          return (
            <p key={index} className="text-base leading-relaxed">
              {line}
            </p>
          )
        })}
      </div>
    </motion.article>
  )
}
