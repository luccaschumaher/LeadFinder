import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const base =
  'group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium tracking-tight transition-[background-color,box-shadow,color,transform] duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary:
    'bg-electric-500 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_0_0_1px_rgb(47_107_255/0.6),0_8px_24px_-8px_rgb(47_107_255/0.7)] hover:bg-electric-400 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_0_0_1px_rgb(91_145_255/0.8),0_10px_32px_-8px_rgb(47_107_255/0.9)]',
  secondary: 'bg-white/[0.04] text-fg ring-1 ring-inset ring-line-strong hover:bg-white/[0.08] hover:ring-white/20',
  ghost: 'text-fg-muted hover:bg-white/[0.05] hover:text-fg',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-12 px-6 text-[15px]',
}

interface StyleProps {
  variant?: Variant
  size?: Size
  className?: string
}

function buttonStyles({ variant = 'primary', size = 'md', className }: StyleProps) {
  return cn(base, variants[variant], sizes[size], className)
}

type ButtonLinkProps = StyleProps & { to: string; children: ReactNode } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    'href'
  >

/**
 * Link com aparência de botão. Âncoras da própria página (#secao) usam <a>;
 * rotas internas usam o Link do React Router.
 */
export function ButtonLink({ to, variant, size, className, children, ...props }: ButtonLinkProps) {
  const classes = buttonStyles({ variant, size, className })
  if (to.startsWith('#')) {
    return (
      <a href={to} className={classes} {...props}>
        {children}
      </a>
    )
  }
  return (
    <Link to={to} className={classes} {...props}>
      {children}
    </Link>
  )
}

type ButtonProps = StyleProps & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({ variant, size, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />
}
