import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  const [characters, setCharacters] = useState<ExtractedCharacter[]>([])
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set())
  const [isScanning, setIsScanning] = useState(false)
  const [hasScanned, setHasScanned] = useState(false)

  const scanForCharacters = async () => {
    setIsScanning(true)
    
    try {
      const prompt = spark.llmPrompt`You are analyzing a document for characters. Extract all notable characters mentioned.

Document Title: ${documentTitle}

Document Content:
${documentContent}

Return a JSON object with a "characters" array. Each character should have:
- name: The character's name
- role: Their role or title (optional)
- description: A brief description of who they are
- relevantContent: A relevant excerpt from the document about them

If no clear characters are found, return {"characters": []}.`

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
      
      content += `**Description:** ${character.description}\n\n`
      content += `## From ${documentTitle}\n\n`
      content += `${character.relevantContent}\n\n`
      content += `---\n\n`
      content += `*This character page was extracted from "${documentTitle}"*`

      return {
        title: character.name,
        content,
      }
    })

    onCharactersCreated(characterPages)
    setSelectedCharacters(new Set())
    onOpenChange(false)
    resetDialog()
  }

  const resetDialog = () => {
    setCharacters([])
    setHasScanned(false)
    setIsScanning(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      resetDialog()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkle size={24} weight="fill" className="text-accent" />
            Extract Characters
          </DialogTitle>
          <DialogDescription>
            Scan this document for characters and create dedicated pages for them.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            {!hasScanned ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <User size={48} className="text-accent" weight="duotone" />
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Click below to scan "{documentTitle}" for characters
                  </p>
                </div>
                <Button
                  disabled={isScanning}
                  onClick={scanForCharacters}
                  size="lg"
                  className="gap-2"
                >
                  <Sparkle size={18} weight="fill" />
                  {isScanning ? 'Scanning...' : 'Scan for Characters'}
                </Button>
              </div>
            ) : characters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <User size={48} className="text-muted-foreground" weight="duotone" />
                <p className="text-sm text-muted-foreground">No characters found in this document</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Found {characters.length} character(s). Select which ones to create pages for:
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedCharacters.size === characters.length) {
                        setSelectedCharacters(new Set())
                      } else {
                        setSelectedCharacters(new Set(characters.map((c) => c.name)))
                      }
                    }}
                  >
                    {selectedCharacters.size === characters.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                {characters.map((character) => {
                  const isSelected = selectedCharacters.has(character.name)
                  
                  return (
                    <Card
                      key={character.name}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'border-primary bg-accent/10' : 'hover:border-primary/50'
                      }`}
                      onClick={() => toggleCharacter(character.name)}
                    >
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCharacter(character.name)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 space-y-1">
                            <CardTitle className="flex items-center gap-2">
                              {character.name}
                              {character.role && (
                                <Badge variant="secondary" className="text-xs">
                                  {character.role}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              {character.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {hasScanned && characters.length > 0 ? 'Skip' : 'Cancel'}
          </Button>
          {hasScanned && characters.length > 0 && (
            <Button
              disabled={selectedCharacters.size === 0}
              onClick={handleCreateCharacters}
              className="gap-2"
            >
              <Sparkle size={16} weight="fill" />
              Create {selectedCharacters.size} Character Page{selectedCharacters.size !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
