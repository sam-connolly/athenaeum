import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
  Dialog
  DialogF
  DialogTitle,
import { ScrollArea 
import { Badge 
import { Sparkl

  name: string
  description: string
}
interface CharacterExtractionDialogProps {
  onOpenChange: (open: boolean) => void
  documentTitle: string
}

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
If no clear cha
      const respon

        throw new Erro

        toast.info('No characters found in this document')
        setHasScanned(true)
      }
      setCharacters(parsedData.characters)

      
    } catch (error) {
      toa
      setIsScanning(false)

  const toggleCharacter = (chara

        newSet.de
        newSet.add

  }
 
    
     
    }
    const characterPages = selectedChars.
      
        content += `**Role:** ${character.role}\n\n`
     
   


      }

    

    setSelectedCharacters(new Set())
    onOpenChange(false)

    setCharacters([])
    setHasScanned(false)
  }

      <DialogContent className="max-w-3xl">
          <DialogTitle className="flex items-center gap-2"
            Extract Chara
          <DialogDescriptio
          </Di


              <div className="flex flex-co
                  <User size={48} className="text-accent" weight="duotone" />
                <div className="text-
                  <p clas
      
                <Button
                  dis
                  size="lg"
                  <Sparkle size={18} weight="fill" />
               
            ) : characters
     
   

              </div>
              <div className="space-y
                  <div>
                    <p className="text
                    </p>
              
                      variant="ou
       
                   
      
   

                    </Button>
                </div>
    
                    <Card
                      className={`cursor-pointer transiti
            
     

                        <div className="flex items-start gap-
                            checked={selected
      
                          <
                              {character.name}
       
      
                            </CardTitle>
                              {character.description}
                          </div>

              
              </div>
          </div>

      

            <Button
    
            >
    
          </DialogFoo
      </DialogContent>
  )














































































































































