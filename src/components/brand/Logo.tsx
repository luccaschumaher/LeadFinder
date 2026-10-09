import { useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * Símbolo do LeadFinder: um eixo em "L" (a base de empresas), um arco de radar
 * (a busca) e um ponto luminoso (a oportunidade encontrada).
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden className={cn('size-8 shrink-0', className)}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1A2233" />
          <stop offset="1" stopColor="#0A0D14" />
        </linearGradient>
        <radialGradient
          id={`${id}-glow`}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(21.5 10.5) scale(7)"
        >
          <stop stopColor="#2F6BFF" stopOpacity=".6" />
          <stop offset="1" stopColor="#2F6BFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#${id}-bg)`} />
      <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" stroke="white" strokeOpacity=".1" />
      <path d="M10 8.5V22h13.5" stroke="#E9ECF3" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 15a7 7 0 0 1 7 7" stroke="#5B91FF" strokeWidth="2" strokeLinecap="round" strokeOpacity=".75" />
      <circle cx="21.5" cy="10.5" r="7" fill={`url(#${id}-glow)`} />
      <circle cx="21.5" cy="10.5" r="2.6" fill="#5B91FF" />
      <circle cx="21.5" cy="10.5" r="1.1" fill="#fff" fillOpacity=".9" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-fg">
        Lead<span className="text-electric-400">Finder</span>
      </span>
    </span>
  )
}
