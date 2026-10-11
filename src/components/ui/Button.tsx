import { LoaderCircle } from 'lucide-react'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

const base =
  'group/btn relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium tracking-tight transition-[background-color,box-shadow,color,transform] duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0'

const variants: Record<Variant, string> = {
  primary:
    'bg-electric-500 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_0_0_1px_rgb(47_107_255/0.6),0_8px_24px_-8px_rgb(47_107_255/0.7)] hover:bg-electric-400 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.3),0_0_0_1px_rgb(91_145_255/0.8),0_10px_32px_-8px_rgb(47_107_255/0.9)]',
  secondary:
    'bg-overlay/[0.04] text-fg ring-1 ring-inset ring-line-strong hover:bg-overlay/[0.08] hover:ring-overlay/20',
  ghost: 'text-fg-muted hover:bg-overlay/[0.06] hover:text-fg',
  danger: 'bg-red-500/90 text-white ring-1 ring-inset ring-red-400/40 hover:bg-red-500',
}

const sizes: Record<Size, string> = {
  xs: 'h-8 rounded-lg px-2.5 text-[13px] [&_svg]:size-3.5',
  sm: 'h-9 rounded-lg px-3.5 text-sm [&_svg]:size-4',
  md: 'h-11 rounded-xl px-5 text-[15px] [&_svg]:size-4',
  lg: 'h-12 rounded-xl px-6 text-[15px] [&_svg]:size-4',
  icon: 'size-9 rounded-lg [&_svg]:size-4',
  'icon-sm': 'size-8 rounded-lg [&_svg]:size-4',
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
 * Link com aparência de botão. Âncoras da própria página (#secao) e URLs externas
 * usam <a>; rotas internas usam o Link do React Router.
 */
export function ButtonLink({ to, variant, size, className, children, ...props }: ButtonLinkProps) {
  const classes = buttonStyles({ variant, size, className })
  if (to.startsWith('#') || /^https?:/.test(to)) {
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

type ButtonProps = StyleProps & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }

export function Button({
  variant,
  size,
  className,
  type = 'button',
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <LoaderCircle className="animate-spin" />}
      {children}
    </button>
  )
}
