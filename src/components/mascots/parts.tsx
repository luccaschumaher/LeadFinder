import type { ReactNode } from 'react'
import { anim, type Look, type Mood } from './utils'

/** Gradiente radial com luz no canto superior esquerdo — dá o volume "3D" dos personagens. */
export function Shade({ id, light, mid, dark }: { id: string; light: string; mid: string; dark: string }) {
  return (
    <radialGradient id={id} cx="0.34" cy="0.26" r="0.82">
      <stop offset="0" stopColor={light} />
      <stop offset="0.55" stopColor={mid} />
      <stop offset="1" stopColor={dark} />
    </radialGradient>
  )
}

/** Brilho especular suave sobre uma superfície. */
export function Gloss({
  cx,
  cy,
  rx,
  ry,
  rotate = -18,
  opacity = 0.5,
}: {
  cx: number
  cy: number
  rx: number
  ry: number
  rotate?: number
  opacity?: number
}) {
  return (
    <ellipse
      cx={cx}
      cy={cy}
      rx={rx}
      ry={ry}
      fill="#fff"
      opacity={opacity}
      transform={`rotate(${rotate} ${cx} ${cy})`}
    />
  )
}

/** Bochechas rosadas. */
export function Cheeks({
  y,
  left,
  right,
  color = '#FF8FB1',
  opacity = 0.5,
}: {
  y: number
  left: number
  right: number
  color?: string
  opacity?: number
}) {
  return (
    <>
      <ellipse cx={left} cy={y} rx={5} ry={3} fill={color} opacity={opacity} />
      <ellipse cx={right} cy={y} rx={5} ry={3} fill={color} opacity={opacity} />
    </>
  )
}

/** Grupo que pisca (escala vertical em torno do próprio centro). */
export function Blink({ animated, delay = 0, children }: { animated: boolean; delay?: number; children: ReactNode }) {
  return (
    <g className={anim(animated, 'mascot-part animate-mascot-blink')} style={{ animationDelay: `${delay}s` }}>
      {children}
    </g>
  )
}

/** Olho clássico: esclera, pupila que segue o olhar e reflexo. */
export function Eye({
  cx,
  cy,
  r,
  pupil = r * 0.62,
  look,
  animated,
  sclera = '#fff',
  iris = '#1B2035',
}: {
  cx: number
  cy: number
  r: number
  pupil?: number
  look: Look
  animated: boolean
  sclera?: string
  iris?: string
}) {
  const dx = look.x * (r - pupil) * 0.85
  const dy = look.y * (r - pupil) * 0.75
  return (
    <Blink animated={animated}>
      <circle cx={cx} cy={cy} r={r} fill={sclera} />
      <g style={{ transform: `translate(${dx}px, ${dy}px)`, transition: 'transform 140ms ease-out' }}>
        <circle cx={cx} cy={cy} r={pupil} fill={iris} />
        <circle cx={cx + pupil * 0.38} cy={cy - pupil * 0.42} r={pupil * 0.36} fill="#fff" />
        <circle cx={cx - pupil * 0.35} cy={cy + pupil * 0.4} r={pupil * 0.16} fill="#fff" opacity={0.7} />
      </g>
    </Blink>
  )
}

/** Boca: sorriso em repouso, oval animado falando, traço curto pensando. */
export function Mouth({
  cx,
  cy,
  mood,
  animated,
  color,
  width = 12,
}: {
  cx: number
  cy: number
  mood: Mood
  animated: boolean
  color: string
  width?: number
}) {
  if (mood === 'talking') {
    return (
      <ellipse
        className={anim(animated, 'mascot-part animate-mascot-talk')}
        cx={cx}
        cy={cy + 1}
        rx={width * 0.32}
        ry={3.4}
        fill={color}
      />
    )
  }
  if (mood === 'thinking') {
    return (
      <path
        d={`M${cx - width * 0.25} ${cy + 1} q${width * 0.25} -1.5 ${width * 0.5} 0`}
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    )
  }
  const h = width / 2
  return (
    <path
      d={`M${cx - h} ${cy - 1} q${h} ${h * 0.75} ${width} 0`}
      stroke={color}
      strokeWidth={2.6}
      strokeLinecap="round"
      fill="none"
    />
  )
}
