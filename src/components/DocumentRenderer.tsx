import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useWarhammerDatabase } from '@/hooks/use-warhammer-database'
import { RelatedDocuments } from '@/components/RelatedDocuments'
import type { Document } from '@/types/document'
import { useMemo } from 'react'

interface DocumentRendererProps {
  document: Document | null
  documents: Document[]
  onSelectDocument: (id: string) => void
}

interface Heading {
  level: number
  text: string
  id: string
  lineIndex: number
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function DocumentRenderer({ document, documents, onSelectDocument }: DocumentRendererProps) {
  const { getFactionById, getBattleById, getCharacterById } = useWarhammerDatabase()

  const lines = document?.content.split('\n') || []

  const headings = useMemo(() => {
    if (!document) return []
    const extractedHeadings: Heading[] = []
    lines.forEach((line, index) => {
      if (line.startsWith('# ')) {
        extractedHeadings.push({
          level: 1,
          text: line.substring(2),
          id: slugify(line.substring(2)),
          lineIndex: index,
        })
      } else if (line.startsWith('## ')) {
        extractedHeadings.push({
          level: 2,
          text: line.substring(3),
          id: slugify(line.substring(3)),
          lineIndex: index,
        })
      } else if (line.startsWith('### ')) {
        extractedHeadings.push({
          level: 3,
          text: line.substring(4),
          id: slugify(line.substring(4)),
          lineIndex: index,
        })
      }
    })
    return extractedHeadings
  }, [document, lines])

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-lg">Select a document to view</p>
      </div>
    )
  }

  let entityMetadata: React.ReactNode = null
  if (document.entityType && document.entityId) {
    if (document.entityType === 'character') {
      const character = getCharacterById(document.entityId)
      if (character) {
        const faction = getFactionById(character.factionId)
        entityMetadata = (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Character Information</p>
                  <div className="flex flex-wrap gap-2">
                    {faction && (
                      <Badge variant="default">
                        Faction: {faction.name}
                      </Badge>
                    )}
                    {character.role && (
                      <Badge variant="secondary">
                        Role: {character.role}
                      </Badge>
                    )}
                    {character.battleIds.length > 0 && (
                      <Badge variant="outline">
                        {character.battleIds.length} Battle{character.battleIds.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
                {character.battleIds.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Battles</p>
                    <div className="flex flex-wrap gap-2">
                      {character.battleIds.map((battleId) => {
                        const battle = getBattleById(battleId)
                        return battle ? (
                          <Badge key={battleId} variant="outline">
                            {battle.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      }
    } else if (document.entityType === 'faction') {
      const faction = getFactionById(document.entityId)
      if (faction && faction.description) {
        entityMetadata = (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Faction Information</p>
              <p className="text-sm">{faction.description}</p>
            </CardContent>
          </Card>
        )
      }
    } else if (document.entityType === 'battle') {
      const battle = getBattleById(document.entityId)
      if (battle) {
        entityMetadata = (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Battle Information</p>
                  <div className="flex flex-wrap gap-2">
                    {battle.date && (
                      <Badge variant="secondary">
                        Date: {battle.date}
                      </Badge>
                    )}
                    {battle.location && (
                      <Badge variant="secondary">
                        Location: {battle.location}
                      </Badge>
                    )}
                  </div>
                </div>
                {battle.description && (
                  <p className="text-sm">{battle.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      }
    }
  }

  let relatedDocsSection: React.ReactNode = null
  if (document.entityType && document.entityId) {
    let entity
    if (document.entityType === 'character') {
      entity = getCharacterById(document.entityId)
    } else if (document.entityType === 'faction') {
      entity = getFactionById(document.entityId)
    } else if (document.entityType === 'battle') {
      entity = getBattleById(document.entityId)
    }

    if (entity) {
      relatedDocsSection = (
        <RelatedDocuments
          documents={documents}
          currentDocumentId={document.id}
          entity={entity}
          entityType={document.entityType}
          onSelectDocument={onSelectDocument}
          getFactionById={getFactionById}
          getBattleById={getBattleById}
          getCharacterById={getCharacterById}
        />
      )
    }
  }
  
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

      {entityMetadata}

      {headings.length > 0 && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4">Table of Contents</h2>
            <nav className="space-y-1">
              {headings.map((heading, index) => (
                <a
                  key={index}
                  href={`#${heading.id}`}
                  className={`block text-sm hover:text-primary transition-colors ${
                    heading.level === 1 ? 'font-medium' : ''
                  } ${heading.level === 2 ? 'pl-4' : ''} ${
                    heading.level === 3 ? 'pl-8 text-muted-foreground' : ''
                  }`}
                  onClick={(e) => {
                    e.preventDefault()
                    const element = globalThis.document.querySelector(`#${heading.id}`)
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </CardContent>
        </Card>
      )}

      <div className="prose prose-lg max-w-none space-y-4">
        {lines.map((line, index) => {
          if (line.trim() === '') {
            return <div key={index} className="h-4" />
          }
          
          if (line.startsWith('# ')) {
            const text = line.substring(2)
            const id = slugify(text)
            return (
              <h1
                key={index}
                id={id}
                className="text-3xl font-semibold mt-8 mb-4 tracking-tight scroll-mt-20"
              >
                {text}
              </h1>
            )
          }
          
          if (line.startsWith('## ')) {
            const text = line.substring(3)
            const id = slugify(text)
            return (
              <h2
                key={index}
                id={id}
                className="text-2xl font-semibold mt-6 mb-3 tracking-tight scroll-mt-20"
              >
                {text}
              </h2>
            )
          }
          
          if (line.startsWith('### ')) {
            const text = line.substring(4)
            const id = slugify(text)
            return (
              <h3
                key={index}
                id={id}
                className="text-xl font-medium mt-5 mb-2 tracking-tight scroll-mt-20"
              >
                {text}
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

      {relatedDocsSection}
    </motion.article>
  )
}
