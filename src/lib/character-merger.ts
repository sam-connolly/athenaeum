import type { Document } from '@/types/document'


export interface MergeResult {
  shouldMerge: boolean
  existingDocument: Document | null
export function findExistingCharacter
 

  
    char => char.name.to
  
    return { shouldMerge:
  
    doc => doc.entityType === 'character' && doc.entityId =
  
    shouldMerge: true,
    existingCharacter,
}
ex
  newContent: string,
  newDocumentTitle?: string
  c
  
  
    sections.role = newSections.role
  
  
  
    if (sections.backg
    } else {
    }
  
 

    if (sections.description) {
    } else {
    }
  
    mergedContent += `## De
  
    if (sections.additionalInfo) {
    } else {
  
  
  
  
    const existingBattles = sections
   
  
  if (sections.battles
  }
  i
  
  if (newSourceUrl || newDocume
      ? (newSourceUrl ? `${new
    
      sectio
  }
  if 
  }
  

  role?: string
  d
  
}
function parseContentSections(c
  
  if (roleMa
  }
  con
   
  
  if (descriptionMatch) {
  }
  c
  
  
  if (battlesMatch) {
    sections.battles = battleLines
      .map(l
  
  if 
   
  
  
}
exp
}
export function createSource
  documentTitle?: string
  if (documentTitle && sourceUrl) {
  } else if (documentTitle) {
  } else if (sourceUrl) {
  }
}



































  const sections: ContentSections = {}
  
  const roleMatch = content.match(/## Role\s*\n\n([\s\S]*?)(?=\n##|\n\n##|$)/i)
  if (roleMatch) {
    sections.role = roleMatch[1].trim()
  }
  
  const backgroundMatch = content.match(/## Background\s*\n\n([\s\S]*?)(?=\n##|\n\n##|$)/i)
  if (backgroundMatch) {
    sections.background = backgroundMatch[1].trim()
  }
  
  const descriptionMatch = content.match(/## Description\s*\n\n([\s\S]*?)(?=\n##|\n\n##|$)/i)
  if (descriptionMatch) {
    sections.description = descriptionMatch[1].trim()
  }
  
  const additionalMatch = content.match(/## Additional Information\s*\n\n([\s\S]*?)(?=\n##|\n\n##|$)/i)
  if (additionalMatch) {
    sections.additionalInfo = additionalMatch[1].trim()
  }
  
  const battlesMatch = content.match(/## Notable Battles\s*\n\n([\s\S]*?)(?=\n##|\n\n##|$)/i)
  if (battlesMatch) {
    const battleLines = battlesMatch[1].trim().split('\n')
    sections.battles = battleLines
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
  }
  
  const sourcesMatch = content.match(/## Sources?\s*\n\n([\s\S]*?)(?=\n##|\n\n##|$)/i)
  if (sourcesMatch) {
    const sourceLines = sourcesMatch[1].trim().split('\n')
    sections.sources = sourceLines
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
  }
  
  return sections
}

export function extractSourceUrlFromDocument(document: Document): string | undefined {
  return document.sourceUrl
}

export function createSourceReference(
  sourceUrl?: string,
  documentTitle?: string
): string {
  if (documentTitle && sourceUrl) {
    return `${documentTitle} (${sourceUrl})`
  } else if (documentTitle) {
    return documentTitle
  } else if (sourceUrl) {
    return sourceUrl
  }
  return 'Unknown source'
}
