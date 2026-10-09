import { useEffect, useId, useRef, useState } from 'react'
import { avatarInfo } from '@/data/characters'
import { cn } from '@/lib/cn'
import type { AvatarId } from '@/types'
import { CHARACTER_COMPONENTS } from './registry'
import { anim, type Look, type Mood } from './utils'

const CENTER: Look = { x: 0, y: 0 }
const THINKING_LOOK: Look = { x: 0.55, y: -0.7 }

/** Faz os olhos seguirem o cursor (apenas com mouse e com animações ativas). */
function useLookAt(ref: React.RefObject<SVGSVGElement | null>, enabled: boolean) {
  const [look, setLook] = useState<Look>(CENTER)

  useEffect(() => {
    if (!enabled || !window.matchMedia('(pointer: fine)').matches) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rect = ref.current?.getBoundingClientRect()
        if (!rect) return
        const dx = e.clientX - (rect.left + rect.width / 2)
        const dy = e.clientY - (rect.top + rect.height * 0.45)
        const reach = 320
        setLook({ x: Math.max(-1, Math.min(1, dx / reach)), y: Math.max(-1, Math.min(1, dy / reach)) })
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [ref, enabled])

  return enabled ? look : CENTER
}

interface MascotProps {
  id: AvatarId
  mood?: Mood
  size?: number
  /** Respiração, piscadas e olhar seguindo o cursor. */
  animated?: boolean
  className?: string
}

/** Personagem de corpo inteiro, com sombra e estados de humor. */
export function Mascot({ id, mood = 'idle', size = 112, animated = true, className }: MascotProps) {
  const ref = useRef<SVGSVGElement>(null)
  const uid = `m${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const tracked = useLookAt(ref, animated && mood === 'idle')
  const Character = CHARACTER_COMPONENTS[id]
  const look = mood === 'thinking' ? THINKING_LOOK : tracked

  return (
    <svg
      ref={ref}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={`${avatarInfo(id).species} ${avatarInfo(id).name}`}
      className={cn('shrink-0 overflow-visible', className)}
    >
      <ellipse cx="60" cy="113" rx="25" ry="4" fill="#000" opacity="0.35" />
      <g className={anim(animated, 'animate-mascot-bob')}>
        <Character uid={uid} look={look} mood={mood} animated={animated} />
      </g>
      {mood === 'thinking' && (
        <g fill="#BCD3FF">
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={94 + i * 8}
              cy={20 - i * 5}
              r={2.6 + i * 0.6}
              className={anim(animated, 'animate-mascot-dot')}
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </g>
      )}
    </svg>
  )
}

interface ProfileAvatarProps {
  id?: AvatarId
  size?: number
  className?: string
  /** Fallback quando a conta ainda não escolheu avatar. */
  initials?: string
  animated?: boolean
  mood?: Mood
}

/** Avatar circular (cabeça do personagem sobre um fundo colorido). */
export function ProfileAvatar({
  id,
  size = 32,
  className,
  initials,
  animated = false,
  mood = 'idle',
}: ProfileAvatarProps) {
  const uid = `a${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  if (!id || !CHARACTER_COMPONENTS[id]) {
    return (
      <span
        style={{ width: size, height: size }}
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-electric-500/30 to-electric-700/20 font-mono text-[11px] font-medium text-electric-200 ring-1 ring-electric-500/30',
          className,
        )}
      >
        {initials}
      </span>
    )
  }
  const info = avatarInfo(id)
  const Character = CHARACTER_COMPONENTS[id]
  return (
    <span
      role="img"
      aria-label={`Avatar: ${info.species} ${info.name}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 25%, ${info.bg[0]}, ${info.bg[1]})`,
      }}
      className={cn('relative block shrink-0 overflow-hidden rounded-full ring-1 ring-white/10', className)}
    >
      <svg viewBox="16 8 88 88" width={size} height={size} aria-hidden className="absolute inset-0 translate-y-[6%]">
        <Character uid={uid} look={CENTER} mood={mood} animated={animated} />
      </svg>
    </span>
  )
}
