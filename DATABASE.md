# Warhammer Database Structure

This wiki application includes an in-memory JSON database for storing Warhammer-related entities.

## Database Schema

### Factions
Factions represent the various armies and organizations in the Warhammer universe.

```typescript
interface Faction {
  id: string              // Unique identifier (auto-generated)
  name: string           // Faction name (e.g., "Ultramarines")
  description?: string   // Optional description
  createdAt: number      // Timestamp
  updatedAt: number      // Timestamp
}
```

### Battles
Battles represent significant conflicts in the Warhammer universe.

```typescript
interface Battle {
  id: string              // Unique identifier (auto-generated)
  name: string           // Battle name (e.g., "Battle of Macragge")
  date?: string          // Optional date (e.g., "745.M41")
  location?: string      // Optional location
  description?: string   // Optional description
  createdAt: number      // Timestamp
  updatedAt: number      // Timestamp
}
```

### Characters
Characters represent individuals in the Warhammer universe, with relationships to factions and battles.

```typescript
interface Character {
  id: string              // Unique identifier (auto-generated)
  name: string           // Character name (e.g., "Marneus Calgar")
  factionId: string      // Reference to faction ID (required)
  battleIds: string[]    // Array of battle IDs this character participated in
  role?: string          // Optional role (e.g., "Chapter Master")
  description?: string   // Optional description
  createdAt: number      // Timestamp
  updatedAt: number      // Timestamp
}
```

## Relationships

- **Character → Faction**: Each character belongs to one faction (one-to-many relationship)
- **Character → Battles**: Each character can participate in multiple battles (many-to-many relationship)

## Database Operations

### Accessing the Database

Use the `useWarhammerDatabase()` hook in React components:

```typescript
import { useWarhammerDatabase } from '@/hooks/use-warhammer-database'

function MyComponent() {
  const { 
    factions, 
    battles, 
    characters,
    addFaction,
    addBattle,
    addCharacter,
    // ... other operations
  } = useWarhammerDatabase()
  
  // Your component logic
}
```

### Available Operations

#### Factions
- `addFaction(faction)` - Add a new faction
- `updateFaction(id, updates)` - Update an existing faction
- `deleteFaction(id)` - Delete a faction (sets factionId to empty string for associated characters)
- `getFactionById(id)` - Get a faction by ID

#### Battles
- `addBattle(battle)` - Add a new battle
- `updateBattle(id, updates)` - Update an existing battle
- `deleteBattle(id)` - Delete a battle (removes battle from all characters' battleIds)
- `getBattleById(id)` - Get a battle by ID

#### Characters
- `addCharacter(character)` - Add a new character
- `updateCharacter(id, updates)` - Update an existing character
- `deleteCharacter(id)` - Delete a character
- `getCharacterById(id)` - Get a character by ID
- `getCharactersByFaction(factionId)` - Get all characters in a faction
- `getCharactersByBattle(battleId)` - Get all characters who participated in a battle

## Storage

The database is stored using the Spark KV persistence API with the key `warhammer-database`. All data persists between sessions.

## Export/Import

The database can be exported to JSON format using the "Export JSON" button in the Database Manager. This creates a downloadable JSON file with the complete database structure.

Example exported JSON:

```json
{
  "factions": [
    {
      "id": "faction-1234567890-abc",
      "name": "Ultramarines",
      "description": "The Ultramarines are a Space Marine Chapter...",
      "createdAt": 1704067200000,
      "updatedAt": 1704067200000
    }
  ],
  "battles": [
    {
      "id": "battle-1234567890-def",
      "name": "Battle of Macragge",
      "date": "745.M41",
      "location": "Macragge",
      "description": "The First Tyrannic War...",
      "createdAt": 1704067200000,
      "updatedAt": 1704067200000
    }
  ],
  "characters": [
    {
      "id": "character-1234567890-ghi",
      "name": "Marneus Calgar",
      "factionId": "faction-1234567890-abc",
      "battleIds": ["battle-1234567890-def"],
      "role": "Chapter Master",
      "description": "Marneus Calgar is the Chapter Master...",
      "createdAt": 1704067200000,
      "updatedAt": 1704067200000
    }
  ]
}
```

## Linking Documents to Entities

Documents can be linked to database entities by setting the `entityType` and `entityId` fields:

```typescript
const document: Document = {
  // ... other fields
  entityType: 'character', // 'character' | 'faction' | 'battle'
  entityId: 'character-1234567890-ghi'
}
```

When viewing a document linked to an entity, the DocumentRenderer will automatically display relevant metadata from the database.
