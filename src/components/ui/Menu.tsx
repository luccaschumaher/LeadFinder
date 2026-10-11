import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface MenuItem {
  label: string
  icon?: ReactNode
  onSelect: () => void
  danger?: boolean
  active?: boolean
  disabled?: boolean
}

interface MenuProps {
  /** Renderiza o gatilho; recebe as props de acessibilidade e o clique. */
  trigger: (props: { onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu' }) => ReactNode
  items: (MenuItem | 'separator')[]
  align?: 'start' | 'end'
  side?: 'top' | 'bottom'
  className?: string
}

/** Menu suspenso acessível (teclado, Esc e clique fora). */
export function Menu({ trigger, items, align = 'end', side = 'bottom', className }: MenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>('[role=menuitem]:not([disabled])')?.focus())
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        rootRef.current?.querySelector<HTMLElement>('[aria-haspopup]')?.focus()
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const els = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role=menuitem]:not([disabled])') ?? [])
        const i = els.indexOf(document.activeElement as HTMLElement)
        els[(i + (e.key === 'ArrowDown' ? 1 : -1) + els.length) % els.length]?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      {trigger({ onClick: () => setOpen((v) => !v), 'aria-expanded': open, 'aria-haspopup': 'menu' })}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={listRef}
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className={cn(
              'absolute z-50 min-w-48 overflow-hidden rounded-xl border border-line-strong bg-ink-800 p-1 shadow-[0_16px_40px_-12px_rgb(0_0_0/0.8)]',
              side === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5',
              align === 'end' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            )}
          >
            {items.map((item, i) =>
              item === 'separator' ? (
                <div key={`sep-${i}`} className="my-1 h-px bg-line" />
              ) : (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setOpen(false)
                    item.onSelect()
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors outline-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0',
                    item.danger
                      ? 'text-red-400 hover:bg-red-500/10 focus:bg-red-500/10'
                      : 'text-fg-muted hover:bg-overlay/[0.06] hover:text-fg focus:bg-overlay/[0.06] focus:text-fg',
                    item.active && 'text-fg',
                  )}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.active && <span className="size-1.5 rounded-full bg-electric-400" />}
                </button>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
