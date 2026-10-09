import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/* ---------- Card ---------- */

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-ink-900 shadow-[inset_0_1px_0_rgb(255_255_255/0.03)]',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-fg-subtle">{description}</p>}
      </div>
      {action}
    </div>
  )
}

/* ---------- Badge ---------- */

type BadgeTone = 'neutral' | 'blue' | 'cyan' | 'amber' | 'green' | 'red' | 'ice'

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-white/[0.05] text-fg-muted ring-line-strong',
  blue: 'bg-electric-500/12 text-electric-300 ring-electric-500/25',
  cyan: 'bg-cyan-accent/10 text-cyan-accent ring-cyan-accent/25',
  amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/25',
  green: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25',
  red: 'bg-red-400/10 text-red-300 ring-red-400/25',
  ice: 'bg-ice-accent/10 text-ice-accent ring-ice-accent/25',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
  dot,
}: {
  tone?: BadgeTone
  className?: string
  children: ReactNode
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap ring-1 ring-inset [&_svg]:size-3',
        badgeTones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

/* ---------- Skeleton ---------- */

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden style={style} className={cn('animate-pulse rounded-md bg-white/[0.06]', className)} />
}

/* ---------- Empty state ---------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="relative mb-5">
        <div aria-hidden className="absolute inset-0 rounded-2xl bg-electric-500/20 blur-xl" />
        <span className="relative flex size-12 items-center justify-center rounded-2xl border border-line-strong bg-ink-800 text-electric-300 [&_svg]:size-5">
          {icon}
        </span>
      </div>
      <h3 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-pretty text-fg-muted">{description}</p>
      )}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}

/* ---------- Progress ---------- */

export function ProgressBar({
  value,
  max,
  className,
  tone = 'blue',
}: {
  value: number
  max: number
  className?: string
  tone?: 'blue' | 'amber' | 'red'
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('h-1.5 overflow-hidden rounded-full bg-white/[0.07]', className)}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500 ease-out',
          tone === 'blue' && 'bg-gradient-to-r from-electric-600 to-electric-400',
          tone === 'amber' && 'bg-amber-400',
          tone === 'red' && 'bg-red-400',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* ---------- Segmented control ---------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: ReactNode; count?: number }[]
  label: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg [scrollbar-width:none] border border-line bg-ink-950/60 p-0.5',
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] whitespace-nowrap transition-colors [&_svg]:size-3.5',
            value === o.value
              ? 'bg-white/[0.08] text-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]'
              : 'text-fg-subtle hover:text-fg',
          )}
        >
          {o.label}
          {o.count !== undefined && (
            <span className="font-mono text-[11px] text-fg-subtle tabular-nums">{o.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ---------- Kbd ---------- */

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-line-strong bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle">
      {children}
    </kbd>
  )
}
