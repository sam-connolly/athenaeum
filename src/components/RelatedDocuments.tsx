import { FileText, User, Shield, Sword } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Document } from '@/types/document'
import type { Character, Faction, Battle } from '@/types/warhammer'

interface RelatedDocumentsProps {
  documents: Document[]
  currentDocumentId: string | null
  entity: Character | Faction | Battle
  entityType: 'character' | 'faction' | 'battle'
  onSelectDocument: (id: string) => void
  getFactionById?: (id: string) => Faction | undefined
  getBattleById?: (id: string) => Battle | undefined
  getCharacterById?: (id: string) => Character | undefined
}

export function RelatedDocuments({
  documents,
  currentDocumentId,
  entity,
  entityType,
  onSelectDocument,
  getFactionById,
  getBattleById,
  getCharacterById,
}: RelatedDocumentsProps) {
  const relatedDocs: Document[] = []

  if (entityType === 'faction') {
    const charactersInFaction = documents.filter(
      (doc) =>
        doc.entityType === 'character' &&
        doc.entityId &&
        getCharacterById?.(doc.entityId)?.factionId === entity.id
    )
    relatedDocs.push(...charactersInFaction)

    const battlesWithFaction = documents.filter(
      (doc) =>
        doc.entityType === 'battle' &&
        doc.entityId &&
        documents.some(
          (charDoc) =>
            charDoc.entityType === 'character' &&
            charDoc.entityId &&
            getCharacterById?.(charDoc.entityId)?.factionId === entity.id &&
            getCharacterById?.(charDoc.entityId)?.battleIds.includes(doc.entityId!)
        )
    )
    relatedDocs.push(...battlesWithFaction)
  } else if (entityType === 'character' && 'factionId' in entity) {
    const factionDoc = documents.find(
      (doc) => doc.entityType === 'faction' && doc.entityId === entity.factionId
    )
    if (factionDoc) relatedDocs.push(factionDoc)

    const battleDocs = documents.filter(
      (doc) =>
        doc.entityType === 'battle' && doc.entityId && entity.battleIds.includes(doc.entityId)
    )
    relatedDocs.push(...battleDocs)

    const siblingCharacters = documents.filter(
      (doc) =>
        doc.entityType === 'character' &&
        doc.entityId &&
        doc.id !== currentDocumentId &&
        getCharacterById?.(doc.entityId)?.factionId === entity.factionId
    )
    relatedDocs.push(...siblingCharacters)
  } else if (entityType === 'battle') {
    const charactersInBattle = documents.filter(
      (doc) =>
        doc.entityType === 'character' &&
        doc.entityId &&
        getCharacterById?.(doc.entityId)?.battleIds.includes(entity.id)
    )
    relatedDocs.push(...charactersInBattle)

    const factionsInBattle = documents.filter(
      (doc) =>
        doc.entityType === 'faction' &&
        doc.entityId &&
        charactersInBattle.some(
          (charDoc) =>
            charDoc.entityId && getCharacterById?.(charDoc.entityId)?.factionId === doc.entityId
        )
    )
    relatedDocs.push(...factionsInBattle)
  }

  const uniqueDocs = Array.from(new Map(relatedDocs.map((doc) => [doc.id, doc])).values())

  if (uniqueDocs.length === 0) {
    return null
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'character':
        return <User size={16} />
      case 'faction':
        return <Shield size={16} />
      case 'battle':
        return <Sword size={16} />
      default:
        return <FileText size={16} />
    }
  }

  const getEntityInfo = (doc: Document) => {
    if (!doc.entityType || !doc.entityId) return null

    if (doc.entityType === 'character') {
      const char = getCharacterById?.(doc.entityId)
      if (char) {
        const faction = getFactionById?.(char.factionId)
        return faction ? faction.name : null
      }
    } else if (doc.entityType === 'battle') {
      const battle = getBattleById?.(doc.entityId)
      return battle?.date || battle?.location || null
    }
    return null
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Related Documents ({uniqueDocs.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {uniqueDocs.map((doc, index) => {
            const entityInfo = getEntityInfo(doc)
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-start h-auto py-3 px-3"
                  onClick={() => onSelectDocument(doc.id)}
                >
                  <div className="flex items-start gap-3 w-full text-left">
                    <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
                      {getIcon(doc.entityType || '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <p className="text-sm font-medium truncate flex-1">{doc.title}</p>
                        {doc.entityType && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {doc.entityType}
                          </Badge>
                        )}
                      </div>
                      {entityInfo && (
                        <p className="text-xs text-muted-foreground">{entityInfo}</p>
                      )}
                    </div>
                  </div>
                </Button>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
