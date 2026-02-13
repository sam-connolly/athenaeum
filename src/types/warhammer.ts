export interface Faction {
  id: string
  name: string
  description?: string
  createdAt: number
  updatedAt: number
}

export interface Battle {
  id: string
  name: string
  date?: string
  location?: string
  description?: string
  createdAt: number
  updatedAt: number
}

export interface Character {
  id: string
  name: string
  factionId: string
  battleIds: string[]
  role?: string
  description?: string
  createdAt: number
  updatedAt: number
}

export interface WarhammerDatabase {
  characters: Character[]
  factions: Faction[]
  battles: Battle[]
}
