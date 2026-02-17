import { useState } from 'react'
import { Checkbox } from '@/components/ui/check
import {
  DialogContent,
import {
  Dialog,
  DialogContent,
  DialogDescription,

  name: string
  description:
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
        setHasS
        return

      setHasScanned(tr
    } catch (error) {
      console.error(error)
      setIsScanning(false)
  }
  const toggleCharacter = (characterName: string) => 

        newSet.delete(characterName)
        newSet.add(char
    
  }
  const handleCreateCharacters = () => {

      let content = `# ${charact

      }
      content += `

      content += `*This character page was extracted from "${documentTitle}
      return {
        content,
    })
    onCharactersCreated(characterPages)

  }

    setHasScanned(false)
  }

    if (!newOpen) {
    }
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
      
                      }`}
                    >
       
      
                            onClick={(e) => e.stopPropagation()}
                          <div className="flex-
                              {character.name}
                          
                                </Badge>

              
                          </di
                
       
      


          <Button variant="outline" 
          </Button>
            <Butt
   

              Create {selecte
          )}
      </DialogContent>
  )
































































































































