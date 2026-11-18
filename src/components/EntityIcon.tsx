import { MapPin, Shield, Sword, User } from '@phosphor-icons/react'
import type { EntityType } from '@/types/api'

const ICONS = { faction: Shield, character: User, place: MapPin, battle: Sword }
const COLOURS = { faction: 'text-primary', character: 'text-accent', place: 'text-muted-foreground', battle: 'text-destructive' }

export function EntityIcon({ type, size = 16, className = '' }: { type: EntityType; size?: number; className?: string }) {
  const Icon = ICONS[type]
  return <Icon size={size} className={`${COLOURS[type]} ${className}`} />
}
