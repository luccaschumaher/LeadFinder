import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cx } from '../lib/cx'

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-line bg-ink-900', className)}>{children}</div>
}

export function CardTitle({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {hint && <p className="mt-0.5 text-[12px] text-fg-subtle">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

/** Número de destaque (stat tile). */
export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone?: 'good' | 'bad'
}) {
  return (
    <Card className="p-5">
      <p className="text-[12px] text-fg-subtle">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-fg tabular-nums">{value}</p>
      {sub && (
        <p
          className={cx(
            'mt-1 text-[12px]',
            tone === 'good' ? 'text-emerald-300' : tone === 'bad' ? 'text-red-300' : 'text-fg-muted',
          )}
        >
          {sub}
        </p>
      )}
    </Card>
  )
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-lg border border-line bg-ink-950/60 p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-md px-2.5 py-1 text-[12px] whitespace-nowrap transition-colors',
            o.value === value ? 'bg-ink-700 text-fg' : 'text-fg-subtle hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors disabled:opacity-50 [&_svg]:size-4',
        variant === 'primary'
          ? 'bg-electric-500 text-white hover:bg-electric-400'
          : 'text-fg-muted hover:bg-white/5 hover:text-fg',
        className,
      )}
    />
  )
}

const PLAN_STYLE: Record<string, string> = {
  free: 'border-line-strong text-fg-muted',
  silver: 'border-slate-300/30 text-slate-200',
  gold: 'border-amber-300/35 text-amber-200',
  diamond: 'border-cyan-300/35 text-cyan-200',
}

export function PlanTag({ plan }: { plan: string }) {
  const label = { free: 'Free', silver: 'Silver', gold: 'Gold', diamond: 'Diamond' }[plan] ?? plan
  return (
    <span className={cx('inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-medium', PLAN_STYLE[plan])}>
      {label}
    </span>
  )
}

/** Situação da assinatura com texto (nunca só cor). */
export function StatusTag({ status }: { status: string | null }) {
  if (!status) return <span className="text-[12px] text-fg-subtle">—</span>
  const map: Record<string, [string, string]> = {
    active: ['Ativa', 'text-emerald-300 bg-emerald-400/10'],
    canceled: ['Cancelada (até o fim)', 'text-amber-200 bg-amber-400/10'],
    revoked: ['Reembolsada', 'text-red-300 bg-red-400/10'],
    expired: ['Vencida', 'text-fg-muted bg-white/5'],
  }
  const [label, style] = map[status] ?? [status, 'text-fg-muted bg-white/5']
  return <span className={cx('inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-medium', style)}>{label}</span>
}

export function Th({ children, right }: { children: ReactNode; right?: boolean }) {
  return (
    <th scope="col" className={cx('px-3 py-2.5 font-medium whitespace-nowrap', right && 'text-right')}>
      {children}
    </th>
  )
}

export function Td({ children, right, className }: { children: ReactNode; right?: boolean; className?: string }) {
  return (
    <td className={cx('px-3 py-2.5 whitespace-nowrap', right && 'text-right tabular-nums', className)}>{children}</td>
  )
}
