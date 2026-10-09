import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Copy,
  Database,
  ExternalLink,
  Globe,
  LibraryBig,
  MapPin,
  NotebookPen,
  Phone,
  ScanSearch,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { CompanyAvatar, FavoriteButton, LeadStatusMenu, SaveLeadButton, SourceBadge } from '@/components/app/company'
import { locationLabel, openCompanyWebsite, useCompanyState } from '@/lib/company'
import { DemoNotice } from '@/components/app/notices'
import { PageHeader } from '@/components/app/PageHeader'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Badge, Card, CardHeader, EmptyState } from '@/components/ui/display'
import { Textarea } from '@/components/ui/Field'
import { ROUTES } from '@/config/routes'
import { toast } from '@/lib/toast'
import { copyToClipboard, formatDate, formatDateTime, formatRating } from '@/lib/utils'
import { leadService } from '@/services/leads'
import { useData } from '@/stores/data'

export function CompanyPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const company = useData((s) => s.companies[id])
  const notes = useData((s) => s.notes[id])
  const { lead } = useCompanyState(id)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [removing, setRemoving] = useState(false)

  if (!company) {
    return (
      <>
        <PageHeader
          title="Empresa não encontrada"
          breadcrumbs={[{ label: 'Buscar empresas', to: ROUTES.search }, { label: 'Empresa' }]}
        />
        <Card>
          <EmptyState
            icon={<Building2 />}
            title="Não encontramos esta empresa"
            description="Ela pode ter sido removida ou o endereço está incorreto. Faça uma nova busca para encontrar empresas."
            action={
              <ButtonLink to={ROUTES.search} size="xs">
                <ScanSearch />
                Buscar empresas
              </ButtonLink>
            }
          />
        </Card>
      </>
    )
  }

  const addNote = async (e: FormEvent) => {
    e.preventDefault()
    if (!note.trim()) return
    setSavingNote(true)
    await leadService.addNote(company.id, note)
    setNote('')
    setSavingNote(false)
    toast.success('Anotação registrada')
  }

  const removeLead = async () => {
    if (!lead) return
    setRemoving(true)
    await leadService.remove([lead.id])
    setRemoving(false)
    setConfirmRemove(false)
    toast.success('Lead removido', 'A empresa continua disponível nos resultados e favoritos.')
  }

  const copy = async (value: string, label: string) => {
    const ok = await copyToClipboard(value)
    if (ok) toast.success(`${label} copiado`)
    else toast.error('Não foi possível copiar')
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: lead ? 'Meus Leads' : 'Buscar empresas', to: lead ? ROUTES.leads : ROUTES.search },
          { label: company.name },
        ]}
        title={
          <span className="flex items-center gap-3">
            <CompanyAvatar name={company.name} className="size-11 text-[13px]" />
            <span className="min-w-0">
              <span className="block truncate">{company.name}</span>
              <span className="mt-1 flex items-center gap-2 text-[13px] font-normal tracking-normal text-fg-muted">
                {company.category} <SourceBadge company={company} />
              </span>
            </span>
          </span>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft />
              Voltar
            </Button>
            <FavoriteButton companyId={company.id} size="sm" />
            {!lead && <SaveLeadButton companyId={company.id} size="sm" />}
          </>
        }
      />

      {company.source === 'demo' && (
        <DemoNotice className="mb-4">
          Empresa fictícia de demonstração. Telefone (DDD 00), site (domínio .example) e endereço não são reais.
        </DemoNotice>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader
              title="Informações disponíveis"
              description="Somente dados fornecidos pela fonte são exibidos."
            />
            <dl className="grid gap-px overflow-hidden px-5 pt-4 pb-5 sm:grid-cols-2 sm:gap-x-6">
              <InfoRow icon={<MapPin />} label="Endereço">
                {company.address}
                <span className="block text-fg-subtle">{locationLabel(company)}</span>
              </InfoRow>
              <InfoRow icon={<Phone />} label="Telefone">
                {company.phone ? (
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[13px]">{company.phone}</span>
                    <button
                      type="button"
                      onClick={() => copy(company.phone!, 'Telefone')}
                      aria-label="Copiar telefone"
                      className="text-fg-subtle hover:text-fg"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </span>
                ) : (
                  <Unavailable />
                )}
              </InfoRow>
              <InfoRow icon={<Globe />} label="Site">
                {company.website ? (
                  <button
                    type="button"
                    onClick={() => openCompanyWebsite(company)}
                    className="inline-flex max-w-full items-center gap-1.5 text-electric-300 hover:text-electric-200"
                  >
                    <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="size-3.5 shrink-0" />
                  </button>
                ) : (
                  <span>
                    <Badge tone="blue">Sem site informado</Badge>
                    <span className="mt-1 block text-[12px] text-fg-subtle">Oportunidade para oferecer um site.</span>
                  </span>
                )}
              </InfoRow>
              <InfoRow icon={<Star />} label="Avaliação">
                {company.rating !== undefined ? (
                  <span>
                    {formatRating(company.rating)} de 5{' '}
                    <span className="text-fg-subtle">· {company.reviewCount} avaliações</span>
                  </span>
                ) : (
                  <Unavailable />
                )}
              </InfoRow>
              <InfoRow icon={<Building2 />} label="Categoria">
                {company.category}
              </InfoRow>
              <InfoRow icon={<Database />} label="Fonte dos dados">
                {company.source === 'demo' ? 'Demonstração (dados fictícios)' : 'Dados do Google Maps'}
              </InfoRow>
            </dl>
          </Card>

          <Card>
            <CardHeader
              title="Anotações"
              description="Observações pessoais sobre esta empresa. Visíveis apenas para você."
            />
            <form onSubmit={addNote} className="px-5 pt-4">
              <Textarea
                aria-label="Nova anotação"
                placeholder="Ex.: Conversei com a proprietária, pediu proposta até sexta."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-20"
                maxLength={1000}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-[11px] text-fg-subtle">{note.length}/1000</span>
                <Button type="submit" size="xs" disabled={!note.trim()} loading={savingNote}>
                  Adicionar anotação
                </Button>
              </div>
            </form>
            {notes?.length ? (
              <ol className="mt-4 divide-y divide-line border-t border-line">
                {notes.map((n) => (
                  <li key={n.id} className="group flex gap-3 px-5 py-3.5">
                    <NotebookPen className="mt-0.5 size-4 shrink-0 text-fg-subtle" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-fg">{n.text}</p>
                      <p className="mt-1 text-[11px] text-fg-subtle">{formatDateTime(n.createdAt)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Excluir anotação"
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                      onClick={async () => {
                        await leadService.deleteNote(company.id, n.id)
                        toast.success('Anotação excluída')
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-5 pt-4 pb-5 text-[13px] text-fg-subtle">Nenhuma anotação ainda.</p>
            )}
            {!!notes?.length && <div className="h-2" />}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h2 className="text-sm font-semibold tracking-tight text-fg">Status do lead</h2>
            {lead ? (
              <>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[13px] text-fg-subtle">Status</span>
                  <LeadStatusMenu leadId={lead.id} status={lead.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-[13px]">
                  <span className="text-fg-subtle">Salvo em</span>
                  <span className="flex items-center gap-1.5 text-fg-muted">
                    <CalendarDays className="size-3.5" />
                    {formatDate(lead.createdAt)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  className="mt-4 w-full text-red-300 hover:text-red-200"
                  onClick={() => setConfirmRemove(true)}
                >
                  <Trash2 />
                  Remover dos leads
                </Button>
              </>
            ) : (
              <>
                <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">
                  Salve esta empresa em Meus Leads para acompanhar o status da negociação.
                </p>
                <div className="mt-4">
                  <SaveLeadButton companyId={company.id} size="sm" />
                </div>
              </>
            )}
          </Card>

          <Card className="relative overflow-hidden p-5">
            <div aria-hidden className="absolute -top-16 -right-16 size-40 rounded-full bg-electric-500/10 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-lg border border-electric-500/25 bg-electric-500/10 text-electric-300">
                  <Sparkles className="size-4" />
                </span>
                <Badge>Em breve</Badge>
              </div>
              <h2 className="mt-4 text-sm font-semibold tracking-tight text-fg">Análise do site com IA</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">
                {company.website
                  ? 'Avaliará velocidade, responsividade e pontos de melhoria do site atual para embasar sua proposta.'
                  : 'Para empresas sem site, sugerirá a estrutura ideal e argumentos de venda para o segmento.'}
              </p>
              <Button variant="secondary" size="xs" className="mt-4 w-full" disabled>
                Analisar com IA
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold tracking-tight text-fg">Preparar abordagem</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted">
              Use um modelo da biblioteca e substitua {'{{empresa}}'} por{' '}
              <span className="text-fg">{company.name}</span>.
            </p>
            <ButtonLink to={ROUTES.prompts} variant="secondary" size="xs" className="mt-4 w-full">
              <LibraryBig />
              Abrir biblioteca de prompts
            </ButtonLink>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={removeLead}
        loading={removing}
        destructive
        title="Remover dos leads?"
        description={`${company.name} sairá de Meus Leads e o status será perdido. As anotações continuam salvas.`}
        confirmLabel="Remover"
      />
    </>
  )
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-line py-3 text-sm last:border-0 sm:[&:nth-last-child(2)]:border-0">
      <span className="mt-0.5 text-fg-subtle [&>svg]:size-4">{icon}</span>
      <div className="min-w-0 flex-1">
        <dt className="text-[12px] text-fg-subtle">{label}</dt>
        <dd className="mt-0.5 text-fg">{children}</dd>
      </div>
    </div>
  )
}

function Unavailable() {
  return <span className="text-fg-subtle">Não informado pela fonte</span>
}
