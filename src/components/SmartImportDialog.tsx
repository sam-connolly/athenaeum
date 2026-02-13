import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useWarhammerDatabase } from '@/hooks/use-warhammer-database'
import type { Document } from '@/types/document'

interface SmartImportDialogProps {
  onImport: (title: string, content: string, sourceUrl?: string) => void
  documents: Document[]
  setDocuments: (updater: (docs: Document[]) => Document[]) => void
}

interface ParsedData {
  faction?: {
    name: string
    description: string
  }
  characters: Array<{
    name: string
    role?: string
    description: string
    battles?: string[]
  }>
}

export function SmartImportDialog({ onImport, documents, setDocuments }: SmartImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [googleDriveUrl, setGoogleDriveUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  
  const {
    addFaction,
    addCharacter,
    addBattle,
    factions,
    battles,
  } = useWarhammerDatabase()

  const handleSmartImport = async () => {
    if (!googleDriveUrl.trim()) {
      toast.error('Please enter a Google Drive URL')
      return
    }

    setIsLoading(true)
    setProgress(10)
    setStatusMessage('Fetching document from Google Drive...')
    
    try {
      let fileId = ''
      
      if (googleDriveUrl.includes('/document/d/')) {
        const match = googleDriveUrl.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
        if (match) fileId = match[1]
      } else if (googleDriveUrl.includes('/file/d/')) {
        const match = googleDriveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
        if (match) fileId = match[1]
      } else if (googleDriveUrl.includes('id=')) {
        const match = googleDriveUrl.match(/id=([a-zA-Z0-9_-]+)/)
        if (match) fileId = match[1]
      }

      if (!fileId) {
        toast.error('Invalid Google Drive URL format')
        setIsLoading(false)
        return
      }

      const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=txt`
      
      const response = await fetch(exportUrl)
      
      if (!response.ok) {
        throw new Error('Failed to fetch document. Make sure the document is publicly accessible.')
      }

      const rawText = await response.text()
      setProgress(30)
      setStatusMessage('Analyzing document structure with AI...')

      const promptText = `You are parsing a Warhammer document that contains information about a faction and multiple characters.

Document content:
${rawText}

Parse this document and extract:
1. Faction information (name and description)
2. All characters mentioned (name, role, description, and any battles they participated in)

Return the result as a JSON object with this structure:
{
  "faction": {
    "name": "faction name",
    "description": "faction description (2-3 sentences)"
  },
  "characters": [
    {
      "name": "character name",
      "role": "character role/title (optional)",
      "description": "character description (2-3 paragraphs)",
      "battles": ["battle name 1", "battle name 2"] (optional, only if battles are explicitly mentioned)
    }
  ]
}

Be thorough and extract all characters mentioned in the document. For the description fields, write comprehensive summaries that capture the key information about each entity.`

      const llmResponse = await window.spark.llm(promptText, 'gpt-4o', true)
      const parsedData: ParsedData = JSON.parse(llmResponse)

      setProgress(50)
      setStatusMessage('Creating database entries...')

      let factionId = ''
      if (parsedData.faction) {
        const existingFaction = factions.find(f => 
          f.name.toLowerCase() === parsedData.faction!.name.toLowerCase()
        )
        
        if (existingFaction) {
          factionId = existingFaction.id
          toast.info(`Using existing faction: ${existingFaction.name}`)
        } else {
          const newFaction = addFaction({
            name: parsedData.faction.name,
            description: parsedData.faction.description,
          })
          factionId = newFaction.id
          
          const factionDoc: Document = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: parsedData.faction.name,
            content: `# ${parsedData.faction.name}\n\n${parsedData.faction.description}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            sourceUrl: googleDriveUrl,
            entityType: 'faction',
            entityId: newFaction.id,
          }
          
          setDocuments((currentDocs) => [factionDoc, ...(currentDocs || [])])
        }
      }

      setProgress(60)
      
      const characterCreationPromises = parsedData.characters.map(async (charData, index) => {
        setStatusMessage(`Creating character ${index + 1} of ${parsedData.characters.length}...`)
        
        const battleIds: string[] = []
        
        if (charData.battles && charData.battles.length > 0) {
          for (const battleName of charData.battles) {
            const existingBattle = battles.find(b => 
              b.name.toLowerCase() === battleName.toLowerCase()
            )
            
            if (existingBattle) {
              battleIds.push(existingBattle.id)
            } else {
              const newBattle = addBattle({
                name: battleName,
                description: `Battle mentioned in ${charData.name}'s history`,
              })
              battleIds.push(newBattle.id)
            }
          }
        }

        const newCharacter = addCharacter({
          name: charData.name,
          factionId: factionId,
          role: charData.role,
          description: charData.description,
          battleIds: battleIds,
        })

        const characterDoc: Document = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${index}`,
          title: charData.name,
          content: `# ${charData.name}\n\n${charData.role ? `**Role:** ${charData.role}\n\n` : ''}${charData.description}${charData.battles && charData.battles.length > 0 ? `\n\n## Battles\n\n${charData.battles.map(b => `- ${b}`).join('\n')}` : ''}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          sourceUrl: googleDriveUrl,
          entityType: 'character',
          entityId: newCharacter.id,
        }

        return characterDoc
      })

      const characterDocs = await Promise.all(characterCreationPromises)
      
      setDocuments((currentDocs) => [...characterDocs, ...(currentDocs || [])])

      setProgress(100)
      setStatusMessage('Import complete!')
      
      toast.success(`Successfully imported ${parsedData.faction ? '1 faction and ' : ''}${parsedData.characters.length} character${parsedData.characters.length !== 1 ? 's' : ''}!`)
      
      setTimeout(() => {
        setOpen(false)
        setGoogleDriveUrl('')
        setProgress(0)
        setStatusMessage('')
      }, 1000)
      
    } catch (error) {
      console.error('Smart import error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import document')
      setProgress(0)
      setStatusMessage('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      setOpen(newOpen)
      if (!newOpen) {
        setGoogleDriveUrl('')
        setProgress(0)
        setStatusMessage('')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant="default">
          <Sparkle size={18} weight="fill" />
          Smart Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Smart Import from Google Drive</DialogTitle>
          <DialogDescription>
            Import a Warhammer document and automatically create database entries and wiki pages for factions, characters, and battles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="smart-google-drive-url">Google Drive Document URL</Label>
            <Input
              id="smart-google-drive-url"
              placeholder="https://docs.google.com/document/d/..."
              value={googleDriveUrl}
              onChange={(e) => setGoogleDriveUrl(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Paste a link to a publicly accessible Google Doc containing faction and character information
            </p>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">{statusMessage}</p>
            </div>
          )}

          <Button
            onClick={handleSmartImport}
            disabled={!googleDriveUrl.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? 'Processing...' : 'Import and Process'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
