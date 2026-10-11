import { Mascot, ProfileAvatar } from '@/components/mascots/Mascot'
import { DEFAULT_MASCOT } from '@/data/characters'
import { useUser } from '@/stores/session'

/**
 * Personagem escolhido pelo usuário para representar a LeadIA.
 * `lg` mostra o corpo inteiro animado; `sm`/`md` mostram o avatar circular.
 */
export function WaveAvatar({
  size = 'md',
  state = 'idle',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  state?: 'idle' | 'thinking'
  className?: string
}) {
  const user = useUser()
  const id = user?.preferences.mascot ?? DEFAULT_MASCOT

  if (size === 'lg') return <Mascot id={id} mood={state} size={132} animated className={className} />
  return <ProfileAvatar id={id} size={size === 'sm' ? 28 : 44} className={className} />
}
