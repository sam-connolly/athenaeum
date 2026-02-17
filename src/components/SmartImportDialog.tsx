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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkle, Warning } from '@phosphor-icons/react'
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

interface ErrorDetails {
  stage: string
  message: string
  technicalDetails?: string
  rawResponse?: string
}

export function SmartImportDialog({ onImport, documents, setDocuments }: SmartImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [googleDriveUrl, setGoogleDriveUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState<ErrorDetails | null>(null)
  
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
    setError(null)
    
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
        throw new Error('Invalid Google Drive URL format. Please use a valid Google Drive document link.')
      }

      const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=txt`
      
      let response: Response
      try {
        response = await fetch(exportUrl)
      } catch (fetchError) {
        const errorDetails: ErrorDetails = {
          stage: 'Fetching Document',
          message: 'Network error while fetching document',
          technicalDetails: fetchError instanceof Error ? fetchError.message : 'Unknown network error',
        }
        setError(errorDetails)
        throw new Error('Failed to fetch document. Check your internet connection.')
      }
      
      if (!response.ok) {
        const errorDetails: ErrorDetails = {
          stage: 'Fetching Document',
          message: `HTTP ${response.status}: ${response.statusText}`,
          technicalDetails: `The document may not be publicly accessible or the link may be incorrect. Status: ${response.status}`,
        }
        setError(errorDetails)
        throw new Error('Failed to fetch document. Make sure the document is publicly accessible (Anyone with the link can view).')
      }

      let rawText: string
      try {
        rawText = await response.text()
      } catch (textError) {
        const errorDetails: ErrorDetails = {
          stage: 'Reading Document',
          message: 'Failed to read document content',
          technicalDetails: textError instanceof Error ? textError.message : 'Unknown error',
        }
        setError(errorDetails)
        throw new Error('Failed to read document content.')
      }

      if (!rawText || rawText.trim().length === 0) {
        const errorDetails: ErrorDetails = {
          stage: 'Reading Document',
          message: 'Document appears to be empty',
          technicalDetails: `Document length: ${rawText.length} characters`,
        }
        setError(errorDetails)
        throw new Error('The document appears to be empty.')
      }

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

      let llmResponse: string
      try {
        llmResponse = await window.spark.llm(promptText, 'gpt-4o', true)
      } catch (llmError) {
        const errorDetails: ErrorDetails = {
          stage: 'AI Processing',
          message: 'AI failed to process the document',
          technicalDetails: llmError instanceof Error ? llmError.message : 'Unknown LLM error',
        }
        setError(errorDetails)
        throw new Error('AI failed to process the document. Please try again.')
      }

      if (!llmResponse || llmResponse.trim().length === 0) {
        const errorDetails: ErrorDetails = {
          stage: 'AI Processing',
          message: 'AI returned empty response',
          technicalDetails: 'LLM response was empty or whitespace only',
        }
        setError(errorDetails)
        throw new Error('AI returned an empty response.')
      }

      let parsedData: ParsedData
      try {
        parsedData = JSON.parse(llmResponse)
      } catch (parseError) {
        const errorDetails: ErrorDetails = {
          stage: 'Parsing AI Response',
          message: 'Failed to parse AI response as JSON',
          technicalDetails: parseError instanceof Error ? parseError.message : 'Invalid JSON',
          rawResponse: llmResponse.substring(0, 500),
        }
        setError(errorDetails)
        throw new Error('Failed to parse AI response. The response was not valid JSON.')
      }

      if (!parsedData.characters || !Array.isArray(parsedData.characters)) {
        const errorDetails: ErrorDetails = {
          stage: 'Validating AI Response',
          message: 'Invalid data structure in AI response',
          technicalDetails: `Missing or invalid 'characters' array. Response keys: ${Object.keys(parsedData).join(', ')}`,
          rawResponse: JSON.stringify(parsedData, null, 2).substring(0, 500),
        }
        setError(errorDetails)
        throw new Error('AI response has invalid structure. Missing characters array.')
      }

      if (parsedData.characters.length === 0) {
        const errorDetails: ErrorDetails = {
          stage: 'Validating AI Response',
          message: 'No characters found in document',
          technicalDetails: `AI found ${parsedData.faction ? 'a faction but ' : ''}no characters in the document`,
          rawResponse: JSON.stringify(parsedData, null, 2),
        }
        setError(errorDetails)
        throw new Error('No characters were found in the document.')
      }

      setProgress(50)
      setStatusMessage('Creating database entries...')

      let factionId = ''
      if (parsedData.faction) {
        try {
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
              content: `${parsedData.faction.description}`,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              sourceUrl: googleDriveUrl,
              entityType: 'faction',
              entityId: newFaction.id,
            }
            
            setDocuments((currentDocs) => [factionDoc, ...(currentDocs || [])])
          }
        } catch (factionError) {
          const errorDetails: ErrorDetails = {
            stage: 'Creating Faction',
            message: 'Failed to create faction entry',
            technicalDetails: factionError instanceof Error ? factionError.message : 'Unknown error',
          }
          setError(errorDetails)
          throw new Error(`Failed to create faction: ${parsedData.faction.name}`)
        }
      }

      setProgress(60)
      
      try {
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
            content: `${charData.role ? `## Role\n\n${charData.role}\n\n` : ''}## Background\n\n${charData.description}${charData.battles && charData.battles.length > 0 ? `\n\n## Notable Battles\n\n${charData.battles.map(b => `- ${b}`).join('\n')}` : ''}`,
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
      } catch (characterError) {
        const errorDetails: ErrorDetails = {
          stage: 'Creating Characters',
          message: 'Failed to create one or more character entries',
          technicalDetails: characterError instanceof Error ? characterError.message : 'Unknown error',
        }
        setError(errorDetails)
        throw new Error('Failed to create character entries.')
      }

      setProgress(100)
      setStatusMessage('Import complete!')
      
      toast.success(`Successfully imported ${parsedData.faction ? '1 faction and ' : ''}${parsedData.characters.length} character${parsedData.characters.length !== 1 ? 's' : ''}!`)
      
      setTimeout(() => {
        setOpen(false)
        setGoogleDriveUrl('')
        setProgress(0)
        setStatusMessage('')
        setError(null)
      }, 1000)
      
    } catch (error) {
      console.error('Smart import error:', error)
      
      if (!error) {
        setError({
          stage: 'Unknown',
          message: 'An unknown error occurred',
          technicalDetails: 'No error object was provided',
        })
      }
      
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
        setError(null)
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
      <DialogContent className="max-w-xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Smart Import from Google Drive</DialogTitle>
          <DialogDescription>
            Import a Warhammer document and automatically create database entries and wiki pages for factions, characters, and battles.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-4 py-4 pr-4">
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

            {error && (
              <Alert variant="destructive">
                <Warning className="h-4 w-4" />
                <AlertTitle>Error: {error.stage}</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <p className="font-medium">{error.message}</p>
                  {error.technicalDetails && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-xs font-mono">
                      <p className="font-semibold mb-1">Technical Details:</p>
                      <p>{error.technicalDetails}</p>
                    </div>
                  )}
                  {error.rawResponse && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-semibold">View Raw Response</summary>
                      <pre className="mt-1 p-2 bg-destructive/10 rounded text-xs overflow-x-auto">
                        {error.rawResponse}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            )}

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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
