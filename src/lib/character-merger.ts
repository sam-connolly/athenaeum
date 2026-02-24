import type { Document } from '@/types/document'


  existingCharacter?: Charac

  characterName: string,
  documents: Document[]
 


    return {
    }

    doc => doc.entity

    return {
      existingDocument,
   

    shouldMerge: false,
    existing
}
inter
  b

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
}   description: mergeSectionText(existingSections.description, newSections.description),
    additionalInfo: mergeSectionText(existingSections.additionalInfo, newSections.additionalInfo),
interface ContentSections {s),
  role?: string
  background?: string
  description?: string
  additionalInfo?: string
  battles?: string[]ourceEntry(newSourceUrl, newDocumentTitle)
  sources?: string[]udes(sourceEntry)) {
}...(merged.sources || []), sourceEntry]

    background: mergeSectionText(exist
    additionalInfo: mergeS
    sources: mergeArr ''

    const sourceEntry = ext
      mergele}\n\n`
  const existingSections = parseContentSections(existingContent)
  const newSections = parseContentSections(newContent)

  const merged: ContentSections = {ption}\n\n`
    role: newSections.role || existingSections.role,
    background: mergeSectionText(existingSections.background, newSections.background),
    description: mergeSectionText(existingSections.description, newSections.description),
    additionalInfo: mergeSectionText(existingSections.additionalInfo, newSections.additionalInfo),
  }

  if (merged.battles && merged.battles.length > 0) {
    mergedContent += `## Notable Battles\n\n`
    merged.battles.forEach(battle => {
      mergedContent += `- ${battle}\n`
    })
    mergedContent += '\n'
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
}
  }

  if (merged.battles && merged.battles.length > 0) {
    mergedContent += `## Notable Battles\n\n`
    merged.battles.forEach(battle => {
      mergedContent += `- ${battle}\n`
    })
  }
  }

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
} }

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
