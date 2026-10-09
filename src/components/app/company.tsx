import { BookmarkCheck, BookmarkPlus, Check, ChevronDown, ExternalLink, Star } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/display'
import { Menu } from '@/components/ui/Menu'
import { cn } from '@/lib/cn'
import { errorMessage } from '@/lib/errors'
import { openCompanyWebsite, useCompanyState } from '@/lib/company'
import { toast } from '@/lib/toast'
import { initials } from '@/lib/utils'
import { LEAD_STATUSES, leadService, statusLabel } from '@/services/leads'
import type { Company, LeadStatus } from '@/types'

const STATUS_TONE: Record<LeadStatus, 'blue' | 'cyan' | 'amber' | 'green' | 'red'> = {
  new: 'blue',
  contacted: 'cyan',
  negotiating: 'amber',
  converted: 'green',
  lost: 'red',
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot>
      {statusLabel(status)}
    </Badge>
  )
}

/** Seletor de status em forma de badge clicável. */
export function LeadStatusMenu({ leadId, status }: { leadId: string; status: LeadStatus }) {
  return (
    <Menu
      align="start"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label={`Status: ${statusLabel(status)}. Alterar status`}
          className="inline-flex items-center gap-1 rounded-md transition-opacity hover:opacity-80"
        >
          <LeadStatusBadge status={status} />
          <ChevronDown className="size-3 text-fg-subtle" />
        </button>
      )}
      items={LEAD_STATUSES.map((s) => ({
        label: s.label,
        active: s.id === status,
        onSelect: async () => {
          if (s.id === status) return
          await leadService.setStatus([leadId], s.id)
          toast.success('Status atualizado', `Lead movido para "${s.label}".`)
        },
      }))}
    />
  )
}

export function CompanyAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-700 font-mono text-[11px] text-fg-muted ring-1 ring-line-strong',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}

export function SourceBadge({ company }: { company: Company }) {
  return company.source === 'demo' ? (
    <Badge tone="amber" className="font-mono uppercase tracking-wider">
      Demo
    </Badge>
  ) : null
}

export function FavoriteButton({ companyId, size = 'icon-sm' }: { companyId: string; size?: 'icon-sm' | 'xs' | 'sm' }) {
  const { favorite } = useCompanyState(companyId)
  const [busy, setBusy] = useState(false)
  const iconOnly = size === 'icon-sm'

  const toggle = async () => {
    setBusy(true)
    try {
      const added = await leadService.toggleFavorite(companyId)
      toast.success(added ? 'Adicionado aos favoritos' : 'Removido dos favoritos')
    } catch (e) {
      toast.error('Não foi possível atualizar', errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant={iconOnly ? 'ghost' : 'secondary'}
      size={size}
      onClick={toggle}
      disabled={busy}
      aria-pressed={favorite}
      aria-label={favorite ? 'Remover dos favoritos' : 'Favoritar'}
      title={favorite ? 'Remover dos favoritos' : 'Favoritar'}
    >
      <Star className={cn(favorite && 'fill-amber-300 text-amber-300')} />
      {!iconOnly && (favorite ? 'Favorito' : 'Favoritar')}
    </Button>
  )
}

export function SaveLeadButton({ companyId, size = 'xs' }: { companyId: string; size?: 'xs' | 'sm' | 'icon-sm' }) {
  const { lead } = useCompanyState(companyId)
  const [busy, setBusy] = useState(false)
  const iconOnly = size === 'icon-sm'

  if (lead) {
    return (
      <Button
        variant="ghost"
        size={size}
        disabled
        className="!opacity-100 text-emerald-300"
        aria-label="Salvo nos leads"
      >
        {iconOnly ? <BookmarkCheck /> : <Check />}
        {!iconOnly && 'Salvo'}
      </Button>
    )
  }

  const save = async () => {
    setBusy(true)
    try {
      await leadService.save(companyId)
      toast.success('Salvo em Meus Leads', 'Acompanhe o status na página de leads.')
    } catch (e) {
      toast.error('Não foi possível salvar', errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant={iconOnly ? 'ghost' : 'secondary'}
      size={size}
      onClick={save}
      loading={busy}
      aria-label="Salvar como lead"
      title="Salvar como lead"
    >
      {!busy && <BookmarkPlus />}
      {!iconOnly && 'Salvar lead'}
    </Button>
  )
}

export function WebsiteButton({ company, size = 'icon-sm' }: { company: Company; size?: 'icon-sm' | 'xs' }) {
  if (!company.website) return null
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => openCompanyWebsite(company)}
      aria-label={`Abrir site de ${company.name}`}
      title="Abrir site"
    >
      <ExternalLink />
      {size === 'xs' && 'Abrir site'}
    </Button>
  )
}
