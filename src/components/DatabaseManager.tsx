import { useState } from 'react'
import { Database, Plus, Trash, Pencil, Download, Upload } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useWarhammerDatabase } from '@/hooks/use-warhammer-database'
import { downloadDatabaseAsJson } from '@/lib/database-utils'
import { toast } from 'sonner'

interface EntityFormData {
  name: string
  description?: string
  factionId?: string
  role?: string
  battleIds?: string[]
  date?: string
  location?: string
}

export function DatabaseManager() {
  const {
    database,
    factions,
    battles,
    characters,
    addFaction,
    addBattle,
    addCharacter,
    deleteFaction,
    deleteBattle,
    deleteCharacter,
    getFactionById,
    getBattleById,
  } = useWarhammerDatabase()

  const [open, setOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null)
  const [formData, setFormData] = useState<EntityFormData>({ name: '' })
  const [selectedBattles, setSelectedBattles] = useState<string[]>([])

  const handleExportDatabase = () => {
    downloadDatabaseAsJson(database)
    toast.success('Database exported successfully')
  }
  const handleAddFaction = () => {
    if (!formData.name.trim()) {
      toast.error('Faction name is required')
      return
    }

    addFaction({
      name: formData.name,
      description: formData.description,
    })

    toast.success('Faction added successfully')
    resetForm()
    setOpen(false)
  }

  const handleAddBattle = () => {
    if (!formData.name.trim()) {
      toast.error('Battle name is required')
      return
    }

    addBattle({
      name: formData.name,
      description: formData.description,
      date: formData.date,
      location: formData.location,
    })

    toast.success('Battle added successfully')
    resetForm()
    setOpen(false)
  }

  const handleAddCharacter = () => {
    if (!formData.name.trim()) {
      toast.error('Character name is required')
      return
    }

    if (!formData.factionId) {
      toast.error('Please select a faction')
      return
    }

    addCharacter({
      name: formData.name,
      factionId: formData.factionId,
      battleIds: selectedBattles,
      role: formData.role,
      description: formData.description,
    })

    toast.success('Character added successfully')
    resetForm()
    setOpen(false)
  }

  const resetForm = () => {
    setFormData({ name: '' })
    setSelectedBattles([])
  }

  const handleDelete = () => {
    if (!deleteTarget) return

    switch (deleteTarget.type) {
      case 'faction':
        deleteFaction(deleteTarget.id)
        toast.success('Faction deleted')
        break
      case 'battle':
        deleteBattle(deleteTarget.id)
        toast.success('Battle deleted')
        break
      case 'character':
        deleteCharacter(deleteTarget.id)
        toast.success('Character deleted')
        break
    }

    setDeleteDialogOpen(false)
    setDeleteTarget(null)
  }

  const confirmDelete = (type: string, id: string) => {
    setDeleteTarget({ type, id })
    setDeleteDialogOpen(true)
  }

  const toggleBattle = (battleId: string) => {
    setSelectedBattles((prev) =>
      prev.includes(battleId) ? prev.filter((id) => id !== battleId) : [...prev, battleId]
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(newOpen) => { setOpen(newOpen); if (!newOpen) resetForm() }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Database size={20} />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Warhammer Database</DialogTitle>
            <DialogDescription>
              Manage factions, battles, and characters for your wiki
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pb-2">
            <Button variant="outline" size="sm" onClick={handleExportDatabase}>
              <Download size={16} className="mr-2" />
              Export JSON
            </Button>
          </div>

          <Tabs defaultValue="view" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="view">View Entities</TabsTrigger>
              <TabsTrigger value="add">Add New</TabsTrigger>
            </TabsList>

            <TabsContent value="view" className="space-y-4">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Factions ({factions.length})</h3>
                    <div className="grid gap-2">
                      {factions.map((faction) => (
                        <Card key={faction.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{faction.name}</CardTitle>
                                {faction.description && (
                                  <CardDescription className="mt-1">
                                    {faction.description}
                                  </CardDescription>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => confirmDelete('faction', faction.id)}
                              >
                                <Trash size={16} />
                              </Button>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                      {factions.length === 0 && (
                        <p className="text-sm text-muted-foreground">No factions yet</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Battles ({battles.length})</h3>
                    <div className="grid gap-2">
                      {battles.map((battle) => (
                        <Card key={battle.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-base">{battle.name}</CardTitle>
                                <div className="flex gap-2 mt-1">
                                  {battle.date && (
                                    <Badge variant="secondary" className="text-xs">
                                      {battle.date}
                                    </Badge>
                                  )}
                                  {battle.location && (
                                    <Badge variant="secondary" className="text-xs">
                                      {battle.location}
                                    </Badge>
                                  )}
                                </div>
                                {battle.description && (
                                  <CardDescription className="mt-2">
                                    {battle.description}
                                  </CardDescription>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => confirmDelete('battle', battle.id)}
                              >
                                <Trash size={16} />
                              </Button>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                      {battles.length === 0 && (
                        <p className="text-sm text-muted-foreground">No battles yet</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Characters ({characters.length})</h3>
                    <div className="grid gap-2">
                      {characters.map((character) => {
                        const faction = getFactionById(character.factionId)
                        return (
                          <Card key={character.id}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-base">{character.name}</CardTitle>
                                  <div className="flex gap-2 mt-1 flex-wrap">
                                    {faction && (
                                      <Badge variant="default" className="text-xs">
                                        {faction.name}
                                      </Badge>
                                    )}
                                    {character.role && (
                                      <Badge variant="secondary" className="text-xs">
                                        {character.role}
                                      </Badge>
                                    )}
                                    {character.battleIds.length > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        {character.battleIds.length} battle{character.battleIds.length !== 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                  </div>
                                  {character.description && (
                                    <CardDescription className="mt-2">
                                      {character.description}
                                    </CardDescription>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => confirmDelete('character', character.id)}
                                >
                                  <Trash size={16} />
                                </Button>
                              </div>
                            </CardHeader>
                          </Card>
                        )
                      })}
                      {characters.length === 0 && (
                        <p className="text-sm text-muted-foreground">No characters yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <Tabs defaultValue="faction" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="faction">Faction</TabsTrigger>
                  <TabsTrigger value="battle">Battle</TabsTrigger>
                  <TabsTrigger value="character">Character</TabsTrigger>
                </TabsList>

                <TabsContent value="faction" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="faction-name">Name *</Label>
                    <Input
                      id="faction-name"
                      placeholder="e.g., Ultramarines"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="faction-description">Description</Label>
                    <Textarea
                      id="faction-description"
                      placeholder="Brief description of the faction..."
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleAddFaction} className="w-full">
                    <Plus size={18} className="mr-2" />
                    Add Faction
                  </Button>
                </TabsContent>

                <TabsContent value="battle" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="battle-name">Name *</Label>
                    <Input
                      id="battle-name"
                      placeholder="e.g., Battle of Macragge"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="battle-date">Date</Label>
                      <Input
                        id="battle-date"
                        placeholder="e.g., 745.M41"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="battle-location">Location</Label>
                      <Input
                        id="battle-location"
                        placeholder="e.g., Macragge"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="battle-description">Description</Label>
                    <Textarea
                      id="battle-description"
                      placeholder="Brief description of the battle..."
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <Button onClick={handleAddBattle} className="w-full">
                    <Plus size={18} className="mr-2" />
                    Add Battle
                  </Button>
                </TabsContent>

                <TabsContent value="character" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="character-name">Name *</Label>
                    <Input
                      id="character-name"
                      placeholder="e.g., Marneus Calgar"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="character-faction">Faction *</Label>
                    <Select
                      value={formData.factionId}
                      onValueChange={(value) => setFormData({ ...formData, factionId: value })}
                    >
                      <SelectTrigger id="character-faction">
                        <SelectValue placeholder="Select a faction" />
                      </SelectTrigger>
                      <SelectContent>
                        {factions.map((faction) => (
                          <SelectItem key={faction.id} value={faction.id}>
                            {faction.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {factions.length === 0 && (
                      <p className="text-xs text-muted-foreground">Add a faction first</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="character-role">Role</Label>
                    <Input
                      id="character-role"
                      placeholder="e.g., Chapter Master"
                      value={formData.role || ''}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Battles</Label>
                    <div className="border rounded-md p-3 space-y-2 max-h-32 overflow-y-auto">
                      {battles.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No battles available</p>
                      ) : (
                        battles.map((battle) => (
                          <div key={battle.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`battle-${battle.id}`}
                              checked={selectedBattles.includes(battle.id)}
                              onChange={() => toggleBattle(battle.id)}
                              className="rounded"
                            />
                            <label
                              htmlFor={`battle-${battle.id}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {battle.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="character-description">Description</Label>
                    <Textarea
                      id="character-description"
                      placeholder="Brief description of the character..."
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleAddCharacter}
                    className="w-full"
                    disabled={factions.length === 0}
                  >
                    <Plus size={18} className="mr-2" />
                    Add Character
                  </Button>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
