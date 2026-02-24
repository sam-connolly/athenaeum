import type { Document } from '@/types/document'
import type { Character } from '@/types/warhammer'

export interface MergeResult {
  shouldMerge: boolean
  existingDocument: Document | null
  existingCharacter: Character | null
}

interface ContentSections {
  role?: string
  background?: string
  description?: string
  additionalInfo?: string
  battles?: string[]
  sources?: string[]
}

export function findExistingCharacter(
  characterName: string,
  documents: Document[],
  characters: Character[]
): MergeResult {
  const existingDocument = documents.find(
    doc => doc.entityType === 'character' && 
    doc.title.toLowerCase().includes(characterName.toLowerCase())
  )
  
  const existingCharacter = characters.find(
    char => char.name.toLowerCase().includes(characterName.toLowerCase())
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
    existingDocument: null,
    existingCharacter: null,
  }
}

export function mergeCharacterContent(
  existingContent: string,
  newContent: string,
  newSourceUrl?: string,
  newDocumentTitle?: string
): string {
  const sections = parseContentSections(existingContent)
  const newSections = parseContentSections(newContent)
  
  let mergedContent = ''
  
  if (newSections.role) {
    sections.role = newSections.role
  }
  
  if (sections.role) {
    mergedContent += `## Role\n\n${sections.role}\n\n`
  }
  
  if (newSections.background) {
    if (sections.background) {
      sections.background = `${sections.background}\n\n${newSections.background}`
    } else {
      sections.background = newSections.background
    }
  }
  
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
