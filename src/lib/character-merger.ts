import type { Document } from '@/types/document'

export interface MergeResult {
  shouldMerge: boolean

 

  battles?: string[]
  role?: string
  background?: string
  description?: string
  additionalInfo?: string
  battles?: string[]
  sources?: string[]
}

  if (existingDocument && existingChar
      shouldMerge: true,
      existingCharacter
  }
  return {
    existingDocument: null,
  }

  
  newSourceUrl?: string,
): string {
  const newSections = pa
  let mergedContent = '
  if 
  }
  
  }
  if (newSections.backg
      sections.background =
   
 

  }
  if (newSections.descript
      sections.descri
      sections.descripti
  }
  if (secti
  }
  if (newSections.additionalInfo) {
  
      sections.additiona
  
  if (sections.additional
  }
  i
  
    sections.battles =
  
   
  
  if (newSourceReference) {
    if (!existingSources.inclu
    }
  
    mergedContent += `## Sources\n\n${sections.sou
  
}
fu
  if (sections.background) {
    mergedContent += `## Background\n\n${sections.background}\n\n`
  }
  
  if (newSections.description) {
    if (sections.description) {
      sections.description = `${sections.description}\n\n${newSections.description}`
    } else {
      sections.description = newSections.description
    }
  }
  
  if (sections.description) {
    mergedContent += `## Description\n\n${sections.description}\n\n`
  }
  
  if (newSections.additionalInfo) {
    if (sections.additionalInfo) {
      sections.additionalInfo = `${sections.additionalInfo}\n\n${newSections.additionalInfo}`
    } else {
      sections.additionalInfo = newSections.additionalInfo
    }
  }
  
  if (sections.additionalInfo) {
    mergedContent += `## Additional Information\n\n${sections.additionalInfo}\n\n`
  }
  
  if (newSections.battles) {
    const existingBattles = sections.battles || []
    const combinedBattles = [...existingBattles, ...newSections.battles]
    const uniqueBattles = Array.from(new Set(combinedBattles))
    sections.battles = uniqueBattles
  }
  
  if (sections.battles && sections.battles.length > 0) {
    mergedContent += `## Notable Battles\n\n${sections.battles.map(b => `- ${b}`).join('\n')}\n\n`
  }
  
  const newSourceReference = createSourceReference(newSourceUrl, newDocumentTitle)
  if (newSourceReference) {
    const existingSources = sections.sources || []
    if (!existingSources.includes(newSourceReference)) {
      sections.sources = [...existingSources, newSourceReference]
    }
  }
  
  if (sections.sources && sections.sources.length > 0) {
    mergedContent += `## Sources\n\n${sections.sources.map(s => `- ${s}`).join('\n')}\n\n`
  }
  
  return mergedContent.trim()
}

function parseContentSections(content: string): ContentSections {


























































