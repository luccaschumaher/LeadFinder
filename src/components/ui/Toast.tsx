import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '@/lib/store'
import { dismissToast as dismiss, toastStore } from '@/lib/toast'
import { cn } from '@/lib/cn'

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info }
const TONES = { success: 'text-emerald-400', error: 'text-red-400', info: 'text-electric-300' }

export function Toaster() {
  const items = useStore(toastStore, (s) => s)
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => {
          const Icon = ICONS[t.tone]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              role={t.tone === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line-strong bg-ink-800/95 p-3.5 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.7)] backdrop-blur"
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', TONES[t.tone])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[13px] leading-snug text-fg-muted">{t.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Fechar notificação"
                className="-m-1 rounded-md p-1 text-fg-subtle transition-colors hover:text-fg"
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
