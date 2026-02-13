export interface Document {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  sourceUrl?: string
  entityType?: 'character' | 'faction' | 'battle'
  entityId?: string
}
