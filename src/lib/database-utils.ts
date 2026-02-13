import type { WarhammerDatabase } from '@/types/warhammer'

export function exportDatabaseToJson(database: WarhammerDatabase): string {
  return JSON.stringify(database, null, 2)
}

export function downloadDatabaseAsJson(database: WarhammerDatabase, filename = 'warhammer-database.json') {
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
}

export function importDatabaseFromJson(jsonString: string): WarhammerDatabase | null {
  try {
    const data = JSON.parse(jsonString)
    if (
      data &&
      Array.isArray(data.characters) &&
      Array.isArray(data.factions) &&
      Array.isArray(data.battles)
    ) {
      return data as WarhammerDatabase
    }
    return null
  } catch {
    return null
  }
}
