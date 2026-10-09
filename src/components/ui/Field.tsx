import { Check, ChevronDown, Eye, EyeOff } from 'lucide-react'
import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

const control =
  'w-full rounded-lg border bg-ink-950/60 text-sm text-fg placeholder:text-fg-subtle transition-[border-color,box-shadow,background-color] duration-150 outline-none focus:border-electric-400/70 focus:bg-ink-950 focus:ring-3 focus:ring-electric-500/15 disabled:cursor-not-allowed disabled:opacity-50'

const controlTone = (error?: string) =>
  error ? 'border-red-500/60 focus:border-red-400 focus:ring-red-500/15' : 'border-line-strong hover:border-white/20'

interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  /** Conteúdo à direita do rótulo (ex.: link "Esqueceu a senha?"). */
  aside?: ReactNode
  className?: string
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode
}

/** Envolve um controle com rótulo, dica e mensagem de erro acessíveis. */
export function Field({ label, hint, error, aside, className, children }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || aside) && (
        <div className="flex items-center justify-between gap-3">
          {label && (
            <label htmlFor={id} className="text-[13px] font-medium text-fg">
              {label}
            </label>
          )}
          {aside}
        </div>
      )}
      {children({ id, describedBy, invalid: !!error })}
      {error ? (
        <p id={`${id}-error`} className="text-[12px] text-red-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-[12px] text-fg-subtle">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { error?: string; icon?: ReactNode }

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, icon, ...props },
  ref,
) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-subtle [&>svg]:size-4">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={!!error || undefined}
        className={cn(control, controlTone(error), 'h-10 px-3', icon ? 'pl-9' : undefined, className)}
        {...props}
      />
    </div>
  )
})

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(function PasswordInput(
  { className, error, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        aria-invalid={!!error || undefined}
        className={cn(control, controlTone(error), 'h-10 pr-10 pl-3', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-fg-subtle transition-colors hover:text-fg"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
})

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, error, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={!!error || undefined}
      className={cn(control, controlTone(error), 'min-h-24 resize-y px-3 py-2.5 leading-relaxed', className)}
      {...props}
    />
  )
})

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { error?: string }

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, error, children, ...props },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(control, controlTone(error), 'h-10 appearance-none pr-9 pl-3 [&>option]:bg-ink-850', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-subtle" />
    </div>
  )
})

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <label htmlFor={inputId} className={cn('group inline-flex cursor-pointer items-start gap-2.5 text-sm', className)}>
      <span className="relative mt-0.5 flex size-4 shrink-0">
        <input id={inputId} type="checkbox" className="peer absolute inset-0 cursor-pointer opacity-0" {...props} />
        <span className="flex size-4 items-center justify-center rounded-[5px] border border-line-strong bg-ink-950 transition-colors peer-checked:border-electric-500 peer-checked:bg-electric-500 peer-focus-visible:ring-2 peer-focus-visible:ring-electric-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ink-900 peer-checked:[&>svg]:opacity-100">
          <Check className="size-3 text-white opacity-0" strokeWidth={3} />
        </span>
      </span>
      {label && <span className="leading-snug text-fg-muted">{label}</span>}
    </label>
  )
}

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[13px] leading-snug text-fg-subtle">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
          checked ? 'bg-electric-500' : 'bg-white/12',
        )}
      >
        <span
          className={cn(
            'inline-block size-4 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}
