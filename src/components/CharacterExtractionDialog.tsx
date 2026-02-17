import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Character {
  name: string
  description: string
  role?: string
  relevantContent?: string
}

interface CharacterExtractionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentContent: string
  documentTitle: string
  onCharactersCreated: (characters: Array<{ title: string; content: string }>) => void
}

export function CharacterExtractionDialog({
  open,
  onOpenChange,
  documentContent,
  documentTitle,
  onCharactersCreated,
}: CharacterExtractionDialogProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasScanned, setHasScanned] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set())

  const handleScanForCharacters = async () => {
    setIsScanning(true)
    try {
      const prompt = spark.llmPrompt`You are analyzing a document to extract character information.

Document content:
${documentContent}

Extract all named characters from this document. For each character, provide:
1. Their name
2. A brief description
3. Their role (if mentioned)
4. Relevant quotes or information about them

Return the result as a valid JSON object with a single property called "characters" that contains the character list. Use this exact format:
{
  "characters": [
    {
      "name": "Character Name",
      "description": "brief description of the character",
      "role": "their role or title (optional)",
      "relevantContent": "relevant quotes or information from the document"
    }
  ]
}

Only extract actual named characters, not generic references.`

      const response = await spark.llm(prompt, 'gpt-4o', true)
      const parsedData = JSON.parse(response)

      if (!parsedData.characters || parsedData.characters.length === 0) {
        toast.info('No characters found in this document')
        setHasScanned(true)
        setIsScanning(false)
        return
      }

      setCharacters(parsedData.characters)
      setHasScanned(true)
      toast.success(`Found ${parsedData.characters.length} character(s)!`)
    } catch (error) {
      toast.error('Failed to scan for characters')
      console.error(error)
    } finally {
      setIsScanning(false)
    }
  }

  const toggleCharacter = (characterName: string) => {
    setSelectedCharacters((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(characterName)) {
        newSet.delete(characterName)
      } else {
        newSet.add(characterName)
      }
      return newSet
    })
  }

  const handleCreateCharacters = () => {
    const selectedChars = characters.filter((char) => selectedCharacters.has(char.name))
    
    const characterPages = selectedChars.map((character) => {
      let content = `# ${character.name}\n\n`
      
      if (character.role) {
        content += `**Role:** ${character.role}\n\n`
      }
      
      content += `## Description\n\n${character.description}\n\n`
      
      if (character.relevantContent) {
        content += `## Relevant Information\n\n${character.relevantContent}\n\n`
      }
      
      content += `*This character page was extracted from "${documentTitle}"*\n`
      
      return {
        title: character.name,
        content,
      }
    })
    
    onCharactersCreated(characterPages)
    onOpenChange(false)
    setHasScanned(false)
    setCharacters([])
    setSelectedCharacters(new Set())
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setHasScanned(false)
      setCharacters([])
      setSelectedCharacters(new Set())
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Extract Characters</DialogTitle>
          <DialogDescription>
            Scan this document for characters and create individual wiki pages for them.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="space-y-4 py-4 pr-4">
            {!hasScanned ? (
              <Button
                onClick={handleScanForCharacters}
                disabled={isScanning}
                className="w-full"
              >
                {isScanning ? 'Scanning...' : 'Scan for Characters'}
              </Button>
            ) : (
              <>
                {characters.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No characters found in this document.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Select characters to create wiki pages:
                    </p>
                    <div className="space-y-3">
                      {characters.map((character) => (
                        <div
                          key={character.name}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => toggleCharacter(character.name)}
                        >
                          <Checkbox
                            checked={selectedCharacters.has(character.name)}
                            onCheckedChange={() => toggleCharacter(character.name)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{character.name}</p>
                              {character.role && (
                                <Badge variant="secondary" className="text-xs">
                                  {character.role}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {character.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateCharacters}
                        disabled={selectedCharacters.size === 0}
                        className="flex-1"
                      >
                        Create {selectedCharacters.size} Character{selectedCharacters.size !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
