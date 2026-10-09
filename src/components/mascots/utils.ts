import type { CSSProperties } from 'react'

export type Mood = 'idle' | 'thinking' | 'talking'

export interface Look {
  x: number
  y: number
}

/** Props recebidas por todo personagem (desenhado em um viewBox de 120×120). */
export interface CharacterProps {
  /** Prefixo único para os ids de gradiente. */
  uid: string
  look: Look
  mood: Mood
  animated: boolean
}

/** Liga a classe de animação só quando o personagem está animado. */
export const anim = (animated: boolean, className: string) => (animated ? className : undefined)

/** Origem de rotação em coordenadas do desenho (ex.: base de uma orelha). */
export const origin = (x: number, y: number): CSSProperties => ({ transformOrigin: `${x}px ${y}px` })
