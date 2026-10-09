import { motion, type HTMLMotionProps } from 'motion/react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-8', className)} {...props} />
}

interface RevealProps extends HTMLMotionProps<'div'> {
  delay?: number
  /** Deslocamento vertical inicial, em px. */
  y?: number
}

/** Revela o conteúdo com fade e leve deslocamento quando entra na tela. */
export function Reveal({ delay = 0, y = 16, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    />
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-electric-300',
        className,
      )}
    >
      <span aria-hidden className="h-px w-5 bg-gradient-to-r from-transparent to-electric-400" />
      {children}
    </span>
  )
}

interface SectionHeadingProps {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
  id?: string
  className?: string
}

export function SectionHeading({ eyebrow, title, description, id, className }: SectionHeadingProps) {
  return (
    <Reveal className={cn('mx-auto flex max-w-2xl flex-col items-center gap-4 text-center', className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id={id}
        className="text-gradient text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-[44px] sm:leading-[1.08]"
      >
        {title}
      </h2>
      {description && <p className="text-base leading-relaxed text-pretty text-fg-muted sm:text-lg">{description}</p>}
    </Reveal>
  )
}

/** Selo que identifica composições visuais como ilustrativas. */
export function IllustrativeTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-950/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-subtle backdrop-blur',
        className,
      )}
    >
      <span aria-hidden className="size-1 rounded-full bg-fg-subtle" />
      Exemplo ilustrativo
    </span>
  )
}
