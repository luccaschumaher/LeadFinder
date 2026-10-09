import type { ComponentType } from 'react'
import type { AvatarId } from '@/types'
import { Alien, Dragon, Puppy, Robot } from './characters'
import type { CharacterProps } from './utils'

export const CHARACTER_COMPONENTS: Record<AvatarId, ComponentType<CharacterProps>> = {
  robot: Robot,
  dragon: Dragon,
  alien: Alien,
  puppy: Puppy,
}
