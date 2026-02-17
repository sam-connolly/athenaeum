import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
      if (!documentContent || documentContent.trim().length === 0) {
        toast.error('Cannot scan empty document. Document content is required.')
        setIsScanning(false)
        return
      }

      if (documentContent.length < 50) {
        toast.error('Document is too short to extract characters. Please provide more content (at least 50 characters).')
        setIsScanning(false)
        return
      }

      const prompt = window.spark.llmPrompt`You are analyzing a document to extract character information.

Document title: ${documentTitle}
Document content:
${documentContent}

Extract all named characters from this document. For each character, provide:
1. Their name
2. A brief description
3. Their role or title (if mentioned)
4. Relevant quotes or information about them

Return the result as a valid JSON object with a single property called "characters" that contains the character list. Use this exact format:
{
  "characters": [
    {
      "name": "Character Name",
      "description": "brief description of the character",
      "role": "their role or title (optional)",
      "relevantContent": "relevant quotes or information (optional)"
    }
  ]
}`

      let response: string
      try {
        response = await window.spark.llm(prompt, 'gpt-4o', true)
      } catch (llmError) {
        const errorMsg = llmError instanceof Error ? llmError.message : 'Unknown error'
        toast.error(`AI request failed: ${errorMsg}. Please check your connection and try again.`)
        console.error('Character extraction LLM error:', llmError)
        setIsScanning(false)
        return
      }

      if (!response || response.trim().length === 0) {
        toast.error('AI returned empty response. This may be a temporary issue. Please try again.')
        console.error('Character extraction error: Empty LLM response')
        setIsScanning(false)
        return
      }

      let result: { characters?: Character[] }
      try {
        result = JSON.parse(response)
      } catch (parseError) {
        const errorMsg = parseError instanceof Error ? parseError.message : 'Invalid JSON'
        toast.error(`Failed to parse AI response: ${errorMsg}. Response was not valid JSON format.`)
        console.error('Character extraction JSON parse error:', parseError, 'Response:', response.substring(0, 500))
        setIsScanning(false)
        return
      }
      
      if (!result.characters) {
        toast.error(`Invalid AI response structure: Missing 'characters' property. Expected format: {characters: [...]}`)
        console.error('Character extraction error: Missing characters property. Response:', result)
        setIsScanning(false)
        return
      }

      if (!Array.isArray(result.characters)) {
        toast.error(`Invalid AI response structure: 'characters' is not an array. Type received: ${typeof result.characters}`)
        console.error('Character extraction error: characters is not an array. Response:', result)
        setIsScanning(false)
        return
      }

      setCharacters(result.characters)
      setHasScanned(true)
      
      if (result.characters.length === 0) {
        toast.info('No characters found in this document. The document may not contain named characters.')
      } else {
        toast.success(`Found ${result.characters.length} character${result.characters.length !== 1 ? 's' : ''}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Character scan failed: ${errorMsg}`)
      console.error('Character extraction unexpected error:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const toggleCharacter = (name: string) => {
    setSelectedCharacters((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(name)) {
        newSet.delete(name)
      } else {
        newSet.add(name)
      }
      return newSet
    })
  }

  const handleCreateCharacters = () => {
    const selectedChars = characters.filter((char) => selectedCharacters.has(char.name))
    
    const newDocuments = selectedChars.map((char) => ({
      title: char.name,
      content: `${char.role ? `## Role\n\n${char.role}\n\n` : ''}## Description\n\n${char.description}${char.relevantContent ? `\n\n## Additional Information\n\n${char.relevantContent}` : ''}\n\n## Source\n\nExtracted from: ${documentTitle}`,
    }))
    
    onCharactersCreated(newDocuments)
    onOpenChange(false)
  }

  const handleReset = () => {
    setHasScanned(false)
    setCharacters([])
    setSelectedCharacters(new Set())
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset()
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
