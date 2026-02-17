import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkle, User } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface ExtractedCharacter {
  name: string
  role?: string
  description: string
  relevantContent: string
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
  const [characters, setCharacters] = useState<ExtractedCharacter[]>([])
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set())
  const [hasScanned, setHasScanned] = useState(false)

  const handleScanForCharacters = async () => {
    setIsScanning(true)
    
    try {
      const promptText = `You are analyzing a document to extract character information.

Document Title: ${documentTitle}

Document Content:
${documentContent}

Carefully read through the document and identify all characters mentioned. For each character, extract:
1. Their name
2. Their role or title (if mentioned)
3. A brief description (2-3 sentences summarizing key information about them)
4. Relevant content from the document about this character (extract the specific paragraphs or sentences that discuss this character)

Return the result as a JSON object with this structure:
{
  "characters": [
    {
      "name": "Character Name",
      "role": "Role or Title (optional)",
      "description": "Brief summary of the character",
      "relevantContent": "The actual content from the document about this character"
    }
  ]
}

Only extract characters that are clearly named individuals (not generic mentions like "the soldier" or "citizens"). Focus on protagonists, antagonists, and other significant named characters.

If no clear characters are found, return an empty characters array.`

      const response = await window.spark.llm(promptText, 'gpt-4o', true)
      const parsedData = JSON.parse(response)

      if (!parsedData.characters || !Array.isArray(parsedData.characters)) {
        throw new Error('Invalid response format from AI')
      }

      if (parsedData.characters.length === 0) {
        toast.info('No characters found in this document')
        setCharacters([])
        setHasScanned(true)
        return
      }

      setCharacters(parsedData.characters)
      const allNames = new Set<string>(parsedData.characters.map((c: ExtractedCharacter) => c.name))
      setSelectedCharacters(allNames)
      setHasScanned(true)
      
      toast.success(`Found ${parsedData.characters.length} character${parsedData.characters.length !== 1 ? 's' : ''}!`)
    } catch (error) {
      console.error('Character extraction error:', error)
      toast.error('Failed to scan for characters. Please try again.')
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

  const handleCreatePages = () => {
    const selectedChars = characters.filter((c) => selectedCharacters.has(c.name))
    
    if (selectedChars.length === 0) {
      toast.error('Please select at least one character')
      return
    }

    const characterPages = selectedChars.map((character) => {
      let content = `# ${character.name}\n\n`
      
      if (character.role) {
        content += `**Role:** ${character.role}\n\n`
      }
      
      content += `## Overview\n\n${character.description}\n\n`
      content += `## Details\n\n${character.relevantContent}\n\n`
      content += `---\n\n*Extracted from: ${documentTitle}*`

      return {
        title: character.name,
        content,
      }
    })

    onCharactersCreated(characterPages)
    
    toast.success(`Created ${characterPages.length} character page${characterPages.length !== 1 ? 's' : ''}!`)
    
    setCharacters([])
    setSelectedCharacters(new Set())
    setHasScanned(false)
    onOpenChange(false)
  }

  const handleClose = () => {
    setCharacters([])
    setSelectedCharacters(new Set())
    setHasScanned(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkle size={24} weight="fill" className="text-accent" />
            Extract Characters with AI
          </DialogTitle>
          <DialogDescription>
            Scan the document content for characters and automatically create pages for them
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-220px)]">
          <div className="space-y-4 py-4 pr-4">
            {!hasScanned ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="rounded-full bg-accent/10 p-6">
                  <User size={48} className="text-accent" weight="duotone" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">Ready to scan for characters</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    AI will analyze "{documentTitle}" and identify all named characters mentioned in the content.
                  </p>
                </div>
                <Button
                  onClick={handleScanForCharacters}
                  disabled={isScanning}
                  className="gap-2"
                  size="lg"
                >
                  <Sparkle size={18} weight="fill" />
                  {isScanning ? 'Scanning...' : 'Scan for Characters'}
                </Button>
              </div>
            ) : characters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">No characters found</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    The AI didn't detect any named characters in this document. You can try importing a different document.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Found {characters.length} character{characters.length !== 1 ? 's' : ''}</h3>
                    <p className="text-sm text-muted-foreground">
                      Select which characters to create pages for
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCharacters(new Set(characters.map(c => c.name)))}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCharacters(new Set())}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {characters.map((character) => (
                    <Card
                      key={character.name}
                      className={`cursor-pointer transition-colors ${
                        selectedCharacters.has(character.name)
                          ? 'border-accent bg-accent/5'
                          : 'hover:border-muted-foreground/20'
                      }`}
                      onClick={() => toggleCharacter(character.name)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedCharacters.has(character.name)}
                            onCheckedChange={() => toggleCharacter(character.name)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 space-y-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {character.name}
                              {character.role && (
                                <Badge variant="secondary" className="font-normal">
                                  {character.role}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {character.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View extracted content
                          </summary>
                          <div className="mt-2 p-3 bg-muted/50 rounded-md text-xs">
                            {character.relevantContent}
                          </div>
                        </details>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {hasScanned && characters.length > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePages}
              disabled={selectedCharacters.size === 0}
              className="gap-2"
            >
              Create {selectedCharacters.size} Page{selectedCharacters.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
