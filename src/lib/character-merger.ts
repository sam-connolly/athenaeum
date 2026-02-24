import type { Document } from '@/types/document'

interface Character {
  id: string

  characterName: st
  characters: C
  const normalizedNam
  const existingChara
 

      shouldMerge: false,
  }
  const existingDocument = do
  )
 

      existingCharacter,
  }
  return {
    existingDocument: und
  }

  
  description?: string
  battles?: string[]
}
ex
  newContent: string,
  newDocumen
  const existingSections 
  
  
  
  const existingDocument = documents.find(
    doc => doc.entityId === existingCharacter.id && doc.entityType === 'character'
  )
  
  if (existingDocument && existingCharacter) {
    return {
      shouldMerge: true,
      existingDocument,
      existingCharacter,
    }
  }
  
  return {
    shouldMerge: false,
    existingDocument: undefined,
    existingCharacter: undefined,
  }
}

interface ContentSections {
  role?: string
  background?: string
  description?: string
  additionalInfo?: string
  battles?: string[]
  sources?: string[]
}

export function mergeCharacterContent(
  existingContent: string,
  newContent: string,
  newSourceUrl?: string,
  newDocumentTitle?: string
): string {
  }
  return mergedContent.trim()

  const sections: ContentSections = {}
  
    sections.role = roleM
  
  if (backgroundMatch) {
  }
  const descriptionMatch = content.mat
    s
  
  
  }
  const battlesMatch = content
    const battleText = battlesMatch[1].trim()
      .split
      .map(line => line.replace(/^-\s*/, '').trim(
  
  i
  
      .filter(line => line.trim(
  }
  return sections

  if (!sourceUrl) return null
  if 
  }
  









































































































