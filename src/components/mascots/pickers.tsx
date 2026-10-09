import { Check } from 'lucide-react'
import { AVATARS, MASCOTS } from '@/data/characters'
import { cn } from '@/lib/cn'
import type { AvatarId, MascotId } from '@/types'
import { ProfileAvatar } from './Mascot'

/** Grade de avatares para a foto de perfil. */
export function AvatarPicker({
  value,
  onChange,
  size = 52,
  className,
}: {
  value: AvatarId
  onChange: (id: AvatarId) => void
  size?: number
  className?: string
}) {
  return (
    <div role="radiogroup" aria-label="Avatar" className={cn('flex flex-wrap gap-2.5', className)}>
      {AVATARS.map((a) => {
        const selected = value === a.id
        return (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${a.species} ${a.name}`}
            title={`${a.name} · ${a.species}`}
            onClick={() => onChange(a.id)}
            className={cn(
              'group relative rounded-full transition-transform duration-200 hover:-translate-y-0.5',
              selected ? 'ring-2 ring-electric-400 ring-offset-2 ring-offset-ink-900' : 'opacity-80 hover:opacity-100',
            )}
          >
            <ProfileAvatar id={a.id} size={size} />
            {selected && (
              <span className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full bg-electric-500 ring-2 ring-ink-900">
                <Check className="size-2.5 text-white" strokeWidth={3} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Escolha do personagem da WaveIA. */
export function MascotPicker({
  value,
  onChange,
  className,
  compact,
}: {
  value: MascotId
  onChange: (id: MascotId) => void
  className?: string
  compact?: boolean
}) {
  return (
    <div role="radiogroup" aria-label="Personagem da WaveIA" className={cn('grid grid-cols-4 gap-2', className)}>
      {MASCOTS.map((m) => {
        const selected = value === m.id
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${m.species} ${m.name}`}
            title={`${m.name} · ${m.personality}`}
            onClick={() => onChange(m.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-colors',
              selected
                ? 'border-electric-400/60 bg-electric-500/10'
                : 'border-line hover:border-line-strong hover:bg-white/[0.03]',
            )}
          >
            <ProfileAvatar id={m.id} size={compact ? 34 : 42} />
            {!compact && <span className={cn('text-[11px]', selected ? 'text-fg' : 'text-fg-muted')}>{m.name}</span>}
          </button>
        )
      })}
    </div>
  )
}
