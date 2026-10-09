import { useId } from 'react'
import { getPlan } from '@/config/plans'
import { cn } from '@/lib/cn'
import type { PlanId } from '@/types'

/*
 * Medalhas circulares dos planos. Cada uma tem anel metálico, disco interno,
 * emblema próprio e brilho — Free (faísca), Silver (estrela), Gold (coroa), Diamond (diamante).
 */

const PALETTES: Record<
  PlanId,
  { ring: [string, string, string]; disc: [string, string]; emblem: [string, string, string] }
> = {
  free: {
    ring: ['#C9D3E3', '#6B7891', '#2B3345'],
    disc: ['#1E2A44', '#0B1120'],
    emblem: ['#E0EDFF', '#8DB4FF', '#2F6BFF'],
  },
  silver: {
    ring: ['#FFFFFF', '#B8C4D6', '#5B6880'],
    disc: ['#2A3448', '#121826'],
    emblem: ['#FFFFFF', '#D5DEEB', '#8A98B0'],
  },
  gold: {
    ring: ['#FFF6C9', '#F5C542', '#9A6406'],
    disc: ['#4A3209', '#1E1404'],
    emblem: ['#FFFBE6', '#FCD34D', '#C27C0E'],
  },
  diamond: {
    ring: ['#F0FBFF', '#7DD3FC', '#5B4BDB'],
    disc: ['#22205A', '#0C0B26'],
    emblem: ['#FFFFFF', '#A5E8FF', '#6D7CFF'],
  },
}

function Emblem({ plan, fill }: { plan: PlanId; fill: string }) {
  switch (plan) {
    case 'free':
      // Faísca de quatro pontas
      return (
        <path
          d="M32 17 C 33.6 26, 38 30.4, 47 32 C 38 33.6, 33.6 38, 32 47 C 30.4 38, 26 33.6, 17 32 C 26 30.4, 30.4 26, 32 17 Z"
          fill={fill}
        />
      )
    case 'silver':
      // Estrela de cinco pontas arredondada
      return (
        <path
          d="M32 17.5 l4.4 9.2 l10 1.3 l-7.3 7 l1.9 9.9 l-9 -4.9 l-9 4.9 l1.9 -9.9 l-7.3 -7 l10 -1.3 Z"
          fill={fill}
          stroke={fill}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      )
    case 'gold':
      // Coroa
      return (
        <>
          <path d="M19 41 L 17 24 L 25.5 31 L 32 20 L 38.5 31 L 47 24 L 45 41 Z" fill={fill} strokeLinejoin="round" />
          <rect x="19" y="42.5" width="26" height="4" rx="2" fill={fill} />
          <circle cx="17" cy="23" r="2.2" fill={fill} />
          <circle cx="32" cy="19" r="2.4" fill={fill} />
          <circle cx="47" cy="23" r="2.2" fill={fill} />
        </>
      )
    case 'diamond':
      // Diamante lapidado
      return (
        <>
          <path d="M22 26 L 27 19.5 H 37 L 42 26 L 32 45.5 Z" fill={fill} />
          <path
            d="M22 26 H 42 M27 19.5 L 29.5 26 L 32 45.5 M37 19.5 L 34.5 26 L 32 45.5"
            stroke="#fff"
            strokeOpacity="0.55"
            strokeWidth="1"
            fill="none"
            strokeLinejoin="round"
          />
          <path d="M27 19.5 H 37 L 34.5 26 H 29.5 Z" fill="#fff" opacity="0.45" />
        </>
      )
  }
}

export function PlanBadge({ plan, size = 40, className }: { plan: PlanId; size?: number; className?: string }) {
  const uid = `p${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const c = PALETTES[plan]
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={`Plano ${getPlan(plan).name}`}
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id={`${uid}-ring`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={c.ring[0]} />
          <stop offset="0.45" stopColor={c.ring[1]} />
          <stop offset="1" stopColor={c.ring[2]} />
        </linearGradient>
        <radialGradient id={`${uid}-disc`} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor={c.disc[0]} />
          <stop offset="1" stopColor={c.disc[1]} />
        </radialGradient>
        <linearGradient id={`${uid}-emblem`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={c.emblem[0]} />
          <stop offset="0.5" stopColor={c.emblem[1]} />
          <stop offset="1" stopColor={c.emblem[2]} />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={c.emblem[1]} stopOpacity="0.45" />
          <stop offset="1" stopColor={c.emblem[1]} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* anel metálico */}
      <circle cx="32" cy="32" r="30" fill={`url(#${uid}-ring)`} />
      <circle cx="32" cy="32" r="29.4" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.8" />
      {/* disco interno */}
      <circle cx="32" cy="32" r="24.5" fill={`url(#${uid}-disc)`} />
      <circle cx="32" cy="32" r="24.5" fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="1.2" />
      <circle cx="32" cy="32" r="16" fill={`url(#${uid}-glow)`} />
      {/* emblema */}
      <Emblem plan={plan} fill={`url(#${uid}-emblem)`} />
      {plan === 'diamond' && (
        <g fill="#fff">
          <path d="M46 17 l1 2.4 l2.4 1 l-2.4 1 l-1 2.4 l-1 -2.4 l-2.4 -1 l2.4 -1 Z" opacity="0.9" />
          <circle cx="18.5" cy="43.5" r="1.1" opacity="0.7" />
        </g>
      )}
      {/* brilho superior */}
      <path d="M12 26 A 21 21 0 0 1 52 26 A 26 18 0 0 0 12 26 Z" fill="#fff" opacity="0.14" />
    </svg>
  )
}
