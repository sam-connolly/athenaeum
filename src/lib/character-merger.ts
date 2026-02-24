import type { Document } from '@/types/document'
import type { Character } from '@/types/warhammer'

interface ContentSections {
  role?: string
  background?: string
  description?: string
  additionalInfo?: string
  battles?: string[]
  sources?: string[]
}

interface MergeCheckResult {
  shouldMerge: boolean
  existingDocument?: Document
  existingCharacter?: Character
}

export function checkForExistingCharacter(
  characterName: string,
  documents: Document[],
  characters?: Character[]
): MergeCheckResult {
  if (!characters || characters.length === 0) {
    return {
      shouldMerge: false,
      existingDocument: undefined,
      existingCharacter: undefined,
    }
  }

  const existingCharacter = characters.find(
    char => char.name.toLowerCase() === characterName.toLowerCase()
  )

  if (!existingCharacter) {
    return {
      shouldMerge: false,
      existingDocument: undefined,
      existingCharacter: undefined,
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

export function mergeCharacterContent(
  existingContent: string,
  newContent: string,
  newSourceUrl?: string,
  newDocumentTitle?: string
): string {
  const existingSections = parseContentSections(existingContent)
  const newSections = parseContentSections(newContent)

  const merged: ContentSections = {
    role: newSections.role || existingSections.role,
    background: mergeSectionText(existingSections.background, newSections.background),
    description: mergeSectionText(existingSections.description, newSections.description),
    additionalInfo: mergeSectionText(existingSections.additionalInfo, newSections.additionalInfo),
    battles: mergeArrays(existingSections.battles, newSections.battles),
    sources: mergeArrays(existingSections.sources, newSections.sources),
  }

  if (newSourceUrl) {
    const sourceEntry = extractSourceEntry(newSourceUrl, newDocumentTitle)
    if (sourceEntry && !merged.sources?.includes(sourceEntry)) {
      merged.sources = [...(merged.sources || []), sourceEntry]
    }
  }

  let mergedContent = ''

  if (merged.role) {
    mergedContent += `**Role:** ${merged.role}\n\n`
  }

  if (merged.description) {
    mergedContent += `## Description\n\n${merged.description}\n\n`
  }

  if (merged.background) {
    mergedContent += `## Background\n\n${merged.background}\n\n`
  }

  if (merged.additionalInfo) {
    mergedContent += `## Additional Information\n\n${merged.additionalInfo}\n\n`
  }

  if (merged.battles && merged.battles.length > 0) {
    mergedContent += `## Notable Battles\n\n`
    merged.battles.forEach(battle => {
      mergedContent += `- ${battle}\n`
    })
    mergedContent += '\n'
  }

  if (merged.sources && merged.sources.length > 0) {
    mergedContent += `## Sources\n\n`
    merged.sources.forEach(source => {
      mergedContent += `- ${source}\n`
    })
  }

  return mergedContent.trim()
}

function parseContentSections(content: string): ContentSections {
  const sections: ContentSections = {}

  const roleMatch = content.match(/\*\*Role:\*\*\s*(.+?)(?=\n\n|\n##|$)/i)
  if (roleMatch) {
    sections.role = roleMatch[1].trim()
  }

  const backgroundMatch = content.match(/##\s*Background\s*\n\n([\s\S]+?)(?=\n##|\n\*\*|$)/i)
  if (backgroundMatch) {
    sections.background = backgroundMatch[1].trim()
  }

  const descriptionMatch = content.match(/##\s*Description\s*\n\n([\s\S]+?)(?=\n##|\n\*\*|$)/i)
  if (descriptionMatch) {
    sections.description = descriptionMatch[1].trim()
  }

  const additionalMatch = content.match(/##\s*Additional Information\s*\n\n([\s\S]+?)(?=\n##|\n\*\*|$)/i)
  if (additionalMatch) {
    sections.additionalInfo = additionalMatch[1].trim()
  }

  const battlesMatch = content.match(/##\s*Notable Battles\s*\n\n([\s\S]+?)(?=\n##|\n\*\*|$)/i)
  if (battlesMatch) {
    const battleText = battlesMatch[1].trim()
    sections.battles = battleText
      .split('\n')
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line.length > 0)
  }

  const sourcesMatch = content.match(/##\s*Sources\s*\n\n([\s\S]+?)$/i)
  if (sourcesMatch) {
    const sourceText = sourcesMatch[1].trim()
    sections.sources = sourceText
      .split('\n')
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(line => line.length > 0)
  }

  return sections
}

function mergeSectionText(existing?: string, newText?: string): string | undefined {
  if (!existing && !newText) return undefined
  if (!existing) return newText
  if (!newText) return existing
  
  if (existing.includes(newText) || newText.includes(existing)) {
    return newText.length > existing.length ? newText : existing
  }
  
  return `${existing}\n\n${newText}`
}

function mergeArrays(existing?: string[], newItems?: string[]): string[] | undefined {
  if (!existing && !newItems) return undefined
  if (!existing) return newItems
  if (!newItems) return existing
  
  const combined = [...existing]
  newItems.forEach(item => {
    if (!combined.some(existingItem => 
      existingItem.toLowerCase().trim() === item.toLowerCase().trim()
    )) {
      combined.push(item)
    }
  })
  
  return combined
}

function extractSourceEntry(sourceUrl: string, documentTitle?: string): string | null {
  if (!sourceUrl) return null
  
  if (documentTitle) {
    return `[${documentTitle}](${sourceUrl})`
  }

  return sourceUrl
}
