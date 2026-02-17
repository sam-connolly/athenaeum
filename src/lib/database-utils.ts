import type { WarhammerDatabase } from '@/types/warhammer'

export function exportDatabaseToJson(database: WarhammerDatabase): string {
  if (!database) {
    throw new Error('Cannot export: Database object is null or undefined')
  }
  
  if (!database.factions || !database.battles || !database.characters) {
    throw new Error('Cannot export: Database is missing required properties (factions, battles, or characters)')
  }

  try {
    return JSON.stringify(database, null, 2)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to serialize database to JSON: ${errorMsg}`)
  }
}

export function downloadDatabaseAsJson(database: WarhammerDatabase, filename = 'warhammer-database.json') {
  try {
    const jsonString = exportDatabaseToJson(database)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to download database file: ${errorMsg}`)
  }
}

export function importDatabaseFromJson(jsonString: string): WarhammerDatabase {
  if (!jsonString || jsonString.trim().length === 0) {
    throw new Error('Cannot import: JSON string is empty')
  }

  let data: unknown
  try {
    data = JSON.parse(jsonString)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Invalid JSON'
    throw new Error(`Failed to parse JSON: ${errorMsg}`)
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid database format: Expected a JSON object, got ' + typeof data)
  }

  const db = data as Partial<WarhammerDatabase>

  const missing: string[] = []
  if (!db.characters) missing.push('characters')
  if (!db.factions) missing.push('factions')
  if (!db.battles) missing.push('battles')
  
  if (missing.length > 0) {
    throw new Error(`Invalid database format: Missing required properties: ${missing.join(', ')}`)
  }

  if (!Array.isArray(db.characters)) {
    throw new Error(`Invalid database format: 'characters' must be an array, got ${typeof db.characters}`)
  }

  if (!Array.isArray(db.factions)) {
    throw new Error(`Invalid database format: 'factions' must be an array, got ${typeof db.factions}`)
  }

  if (!Array.isArray(db.battles)) {
    throw new Error(`Invalid database format: 'battles' must be an array, got ${typeof db.battles}`)
  }

  return db as WarhammerDatabase
}
