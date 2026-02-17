import { useState } from 'react'
import {
  DialogD
  DialogTitle,
import { Button } fr
import { Checkb
import { toast
interface Character {
  description: string
  relevantContent?: string

  open: boolean
  documentContent: string


  open,
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

  documentTitle,
  onCharactersCreated,
}: CharacterExtractionDialogProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [hasScanned, setHasScanned] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set())

  const handleScanForCharacters = async () => {
    }
    try {
      const prompt = spark.llmPrompt`You are analyzing a document to extract character information.

      const respo
${documentContent}

Extract all named characters from this document. For each character, provide:
        setIs
2. A brief description

4. Relevant quotes or information about them

Return the result as a valid JSON object with a single property called "characters" that contains the character list. Use this exact format:
{
  "characters": [
    }
      "name": "Character Name",
      "description": "brief description of the character",
      "role": "their role or title (optional)",
    })
    o
   
 

    if (!newOpen) {

    }
  }

      <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogTitle>Extract Characters</DialogTitle>
            Scan this docum
        </DialogHeader>
        <Scrol
       

                className="w-full"
                {isScanni
            ) : (
                {char
                    No characters found in this do
                ) : (
               
                    </p>
     
   

                          <Checkbox
                            onChecked
                          />
                            <div class
                              {chara
              
                              )}
       
                   
    })
   

                        Cancel
                      <Button
    
                      >
                      </Button>
      
              </>
          </div>
      <
  )















    onOpenChange(false)
    setHasScanned(false)
    setCharacters([])
    setSelectedCharacters(new Set())
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setHasScanned(false)

      setSelectedCharacters(new Set())
    }
    onOpenChange(newOpen)



    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>

          <DialogDescription>
            Scan this document for characters and create individual wiki pages for them.
          </DialogDescription>


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

              <>

                  <p className="text-sm text-muted-foreground text-center py-8">
                    No characters found in this document.
                  </p>

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

                        onClick={handleCreateCharacters}

                        className="flex-1"
                      >
                        Create {selectedCharacters.size} Character{selectedCharacters.size !== 1 ? 's' : ''}

                    </div>

                )}
              </>
            )}

        </ScrollArea>

    </Dialog>

}
