import { useKV } from '@github/spark/hooks'
import type { Character, Faction, Battle, WarhammerDatabase } from '@/types/warhammer'

const DEFAULT_DATABASE: WarhammerDatabase = {
  characters: [],
  factions: [],
  battles: [],
}

export function useWarhammerDatabase() {
  const [database, setDatabase] = useKV<WarhammerDatabase>('warhammer-database', DEFAULT_DATABASE)

  const db = database || DEFAULT_DATABASE

  const addFaction = (faction: Omit<Faction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newFaction: Faction = {
      ...faction,
      id: `faction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    setDatabase((current) => {
      const base = current || DEFAULT_DATABASE
      return {
        ...base,
        factions: [...base.factions, newFaction],
      }
    })

    return newFaction
  }

  const updateFaction = (id: string, updates: Partial<Omit<Faction, 'id' | 'createdAt'>>) => {
    setDatabase((current) => {
      const base = current || DEFAULT_DATABASE
      return {
        ...base,
        factions: base.factions.map((faction) =>
          faction.id === id
            ? { ...faction, ...updates, updatedAt: Date.now() }
            : faction
        ),
      }
    })
  }

  const deleteFaction = (id: string) => {
    setDatabase((current) => {
      const base = current || DEFAULT_DATABASE
      return {
        ...base,
        factions: base.factions.filter((faction) => faction.id !== id),
        characters: base.characters.map((char) =>
          char.factionId === id ? { ...char, factionId: '' } : char
        ),
      }
    })
  }

  const addBattle = (battle: Omit<Battle, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBattle: Battle = {
      ...battle,
      id: `battle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    setDatabase((current) => {
      const base = current || DEFAULT_DATABASE
      return {
        ...base,
        battles: [...base.battles, newBattle],
      }
    })

    return newBattle
  }

  const updateBattle = (id: string, updates: Partial<Omit<Battle, 'id' | 'createdAt'>>) => {
    setDatabase((current) => {
      const base = current || DEFAULT_DATABASE
      return {
        ...base,
        battles: base.battles.map((battle) =>
          battle.id === id
            ? { ...battle, ...updates, updatedAt: Date.now() }
            : battle
        ),
      }
    })
  }

  const deleteBattle = (id: string) => {
    setDatabase((current) => {
      const base = current || DEFAULT_DATABASE
      return {
        ...base,
        battles: base.battles.filter((battle) => battle.id !== id),
        characters: base.characters.map((char) => ({
          ...char,
          battleIds: char.battleIds.filter((battleId) => battleId !== id),
        })),
      }
    })
  }

  const addCharacter = (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCharacter: Character = {
      ...character,
      id: `character-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    setDatabase((current) => {
      const base = current || DEFAULT_DATABASE
      return {
        ...base,
        characters: [...base.characters, newCharacter],
      }
    })

    return newCharacter
  }

  const updateCharacter = (id: string, updates: Partial<Omit<Character, 'id' | 'createdAt'>>) => {
    setDatabase((current) => {
      const base = current || DEFAULT_DATABASE
      return {
        ...base,
        characters: base.characters.map((character) =>
          character.id === id
            ? { ...character, ...updates, updatedAt: Date.now() }
            : character
        ),
      }
    })
  }

  const deleteCharacter = (id: string) => {
    setDatabase((current) => {
      const base = current || DEFAULT_DATABASE
      return {
        ...base,
        characters: base.characters.filter((character) => character.id !== id),
      }
    })
  }

  const getFactionById = (id: string): Faction | undefined => {
    return db.factions.find((faction) => faction.id === id)
  }

  const getBattleById = (id: string): Battle | undefined => {
    return db.battles.find((battle) => battle.id === id)
  }

  const getCharacterById = (id: string): Character | undefined => {
    return db.characters.find((character) => character.id === id)
  }

  const getCharactersByFaction = (factionId: string): Character[] => {
    return db.characters.filter((character) => character.factionId === factionId)
  }

  const getCharactersByBattle = (battleId: string): Character[] => {
    return db.characters.filter((character) => character.battleIds.includes(battleId))
  }

  return {
    database: db,
    factions: db.factions,
    battles: db.battles,
    characters: db.characters,
    addFaction,
    updateFaction,
    deleteFaction,
    addBattle,
    updateBattle,
    deleteBattle,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    getFactionById,
    getBattleById,
    getCharacterById,
    getCharactersByFaction,
    getCharactersByBattle,
  }
}
