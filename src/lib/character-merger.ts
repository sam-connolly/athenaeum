import type { Document } from '@/types/document'
import type { Character } from '@/types/warhammer'

export interface MergeResult {
  shouldMerge: boolean
  existingDocument?: Document
  existingCharacter?: Character
}

export function findExistingCharacter(
  characterName: string,
  documents: Document[],
  characters: Character[]
): MergeResult {
  const normalizedName = characterName.toLowerCase().trim()
  
  const existingCharacter = characters.find(
    c => c.name.toLowerCase().trim() === normalizedName
  )
  
  if (!existingCharacter) {
    return {
      shouldMerge: false,
    }
  }
  
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
  const existingSections = parseContentSections(existingContent)
  const newSections = parseContentSections(newContent)
  
  const sections: ContentSections = { ...existingSections }
  
  if (newSections.role) {
    if (sections.role && sections.role !== newSections.role) {
      sections.role = `${sections.role}; ${newSections.role}`
    } else {
      sections.role = newSections.role
    }
  }
  
  if (newSections.background) {
    if (sections.background) {
      sections.background = `${sections.background}\n\n${newSections.background}`
    } else {
      sections.background = newSections.background
    }
  }
  
  if (newSections.description) {
    if (sections.description) {
      sections.description = `${sections.description}\n\n${newSections.description}`
    } else {
      sections.description = newSections.description
    }
  }
  
  if (newSections.additionalInfo) {
    if (sections.additionalInfo) {
      sections.additionalInfo = `${sections.additionalInfo}\n\n${newSections.additionalInfo}`
    } else {
      sections.additionalInfo = newSections.additionalInfo
    }
  }
  
  if (newSections.battles) {
    const existingBattles = sections.battles || []
    const combinedBattles = [...existingBattles, ...newSections.battles]
    const uniqueBattles = Array.from(new Set(combinedBattles))
    sections.battles = uniqueBattles
  }
  
  const newSourceReference = createSourceReference(newSourceUrl, newDocumentTitle)
  if (newSourceReference) {
    const existingSources = sections.sources || []
    if (!existingSources.includes(newSourceReference)) {
      sections.sources = [...existingSources, newSourceReference]
    }
  }
  
  let mergedContent = ''
  
  if (sections.role) {
    mergedContent += `## Role\n\n${sections.role}\n\n`
  }
  
  if (sections.background) {
    mergedContent += `## Background\n\n${sections.background}\n\n`
  }
  
  if (sections.description) {
    mergedContent += `## Description\n\n${sections.description}\n\n`
  }
  
  if (sections.additionalInfo) {
    mergedContent += `## Additional Information\n\n${sections.additionalInfo}\n\n`
  }
  
  if (sections.battles && sections.battles.length > 0) {
    mergedContent += `## Notable Battles\n\n${sections.battles.map(b => `- ${b}`).join('\n')}\n\n`
  }
  
  if (sections.sources && sections.sources.length > 0) {
    mergedContent += `## Sources\n\n${sections.sources.map(s => `- ${s}`).join('\n')}\n\n`
  }
  
  return mergedContent.trim()
}

function parseContentSections(content: string): ContentSections {
  const sections: ContentSections = {}
  
  const roleMatch = content.match(/## Role\s*\n\n([\s\S]*?)(?=\n##|\n*$)/)
  if (roleMatch) {
    sections.role = roleMatch[1].trim()
  }
  
  const backgroundMatch = content.match(/## Background\s*\n\n([\s\S]*?)(?=\n##|\n*$)/)
  if (backgroundMatch) {
    sections.background = backgroundMatch[1].trim()
  }
  
  const descriptionMatch = content.match(/## Description\s*\n\n([\s\S]*?)(?=\n##|\n*$)/)
  if (descriptionMatch) {
    sections.description = descriptionMatch[1].trim()
  }
  
  const additionalInfoMatch = content.match(/## Additional Information\s*\n\n([\s\S]*?)(?=\n##|\n*$)/)
  if (additionalInfoMatch) {
    sections.additionalInfo = additionalInfoMatch[1].trim()
  }
  
  const battlesMatch = content.match(/## Notable Battles\s*\n\n([\s\S]*?)(?=\n##|\n*$)/)
  if (battlesMatch) {
    const battleText = battlesMatch[1].trim()
    sections.battles = battleText
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
  }
  
  const sourcesMatch = content.match(/## Sources\s*\n\n([\s\S]*?)(?=\n##|\n*$)/)
  if (sourcesMatch) {
    const sourceText = sourcesMatch[1].trim()
    sections.sources = sourceText
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
  }
  
  return sections
}

function createSourceReference(sourceUrl?: string, documentTitle?: string): string | null {
  if (!sourceUrl) return null
  
  if (documentTitle) {
    return `${documentTitle}: ${sourceUrl}`
  }
  
  return sourceUrl
}
