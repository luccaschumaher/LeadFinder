import type { AvatarId, MascotId } from '@/types'

export interface CharacterInfo {
  id: AvatarId
  name: string
  species: string
  /** Fundo do avatar circular (gradiente). */
  bg: [string, string]
}

export const AVATARS: CharacterInfo[] = [
  { id: 'robot', name: 'Bit', species: 'Robô', bg: ['#1F3A6B', '#0E1A33'] },
  { id: 'dragon', name: 'Faísca', species: 'Dragão', bg: ['#0F4F4A', '#082826'] },
  { id: 'alien', name: 'Zuni', species: 'Alienígena', bg: ['#2D4A1E', '#15240F'] },
  { id: 'puppy', name: 'Pipoca', species: 'Cachorrinho', bg: ['#5A3A1E', '#2B1B0E'] },
]

export const DEFAULT_AVATAR: AvatarId = 'robot'

export const MASCOTS: { id: MascotId; name: string; species: string; personality: string }[] = [
  { id: 'robot', name: 'Bit', species: 'Robô', personality: 'Preciso e organizado' },
  { id: 'dragon', name: 'Faísca', species: 'Dragão', personality: 'Ousado e criativo' },
  { id: 'alien', name: 'Zuni', species: 'Alienígena', personality: 'Curioso e cheio de ideias' },
  { id: 'puppy', name: 'Pipoca', species: 'Cachorrinho', personality: 'Animado e parceiro' },
]

export const DEFAULT_MASCOT: MascotId = 'robot'

export const avatarInfo = (id: AvatarId) => AVATARS.find((a) => a.id === id) ?? AVATARS[0]
export const mascotInfo = (id: MascotId) => MASCOTS.find((m) => m.id === id) ?? MASCOTS[0]
