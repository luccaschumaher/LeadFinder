import {
  Check,
  Copy,
  FileText,
  History,
  LibraryBig,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { LimitBanner, LockedFeature } from '@/components/app/notices'
import { PageHeader } from '@/components/app/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge, Card, CardHeader, ProgressBar, Skeleton } from '@/components/ui/display'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/cn'
import { errorMessage } from '@/lib/errors'
import { toast } from '@/lib/toast'
import { copyToClipboard, formatRelative } from '@/lib/utils'
import { promptService } from '@/services/prompts'
import { siteGeneratorService } from '@/services/siteGenerator'
import { useData } from '@/stores/data'
import type { SiteBrief, SiteGeneration } from '@/types'

const GOALS = [
  'Gerar contatos pelo WhatsApp',
  'Receber agendamentos online',
  'Apresentar serviços e transmitir credibilidade',
  'Vender produtos online',
  'Divulgar cardápio e pedidos',
  'Captar orçamentos',
]
const STYLES = [
  'Moderno e minimalista',
  'Elegante e sofisticado',
  'Vibrante e jovem',
  'Corporativo e sóbrio',
  'Acolhedor e artesanal',
]
const FEATURES = [
  'Botão de WhatsApp',
  'Formulário de contato',
  'Mapa de localização',
  'Galeria de fotos',
  'Agendamento online',
  'Depoimentos',
  'Blog',
  'Cardápio digital',
  'Integração com Instagram',
]

const EMPTY: SiteBrief = {
  companyName: '',
  segment: '',
  city: '',
  goal: GOALS[0],
  style: STYLES[0],
  colors: '',
  features: [],
  extra: '',
}
const EXAMPLE: SiteBrief = {
  companyName: 'Clínica Sorriso Pleno',
  segment: 'Clínica odontológica',
  city: 'Curitiba, PR',
  goal: 'Receber agendamentos online',
  style: 'Moderno e minimalista',
  colors: 'Azul-petróleo, branco e detalhes em verde-água',
  features: ['Agendamento online', 'Botão de WhatsApp', 'Mapa de localização', 'Depoimentos'],
  extra: 'Destacar tratamentos estéticos e atendimento infantil.',
}

export function SiteGeneratorPage() {
  const { can } = usePlan()
  if (!can('siteGenerator')) {
    return (
      <>
        <PageHeader
          title="Gerador de prompts para sites"
          description="Gere prompts completos para criar sites em plataformas com IA."
        />
        <LockedFeature
          feature="siteGenerator"
          icon={WandSparkles}
          title="Prompts prontos para criar sites com IA"
          description="Preencha as informações do cliente e receba um prompt estruturado para usar em plataformas de criação de sites com inteligência artificial."
          benefits={[
            'Formulário guiado com objetivo, estilo, cores e funcionalidades',
            'Resultado organizado e pronto para copiar',
            'Salve os melhores prompts na sua biblioteca',
            'Histórico das gerações',
          ]}
          preview={<GeneratorForm brief={EXAMPLE} setBrief={() => {}} onSubmit={() => {}} busy={false} disabled />}
        />
      </>
    )
  }
  return <Generator />
}

function Generator() {
  const { siteGenerations, prompts } = usePlan()
  const generations = useData((s) => s.generations)
  const [brief, setBrief] = useState<SiteBrief>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<SiteGeneration | null>(generations[0] ?? null)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const limitReached = siteGenerations.used >= siteGenerations.total

  const generate = async () => {
    setBusy(true)
    try {
      const g = await siteGeneratorService.generate(brief)
      setResult(g)
      toast.success('Prompt gerado')
    } catch (err) {
      toast.error('Não foi possível gerar', errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    if (!result) return
    if (await copyToClipboard(result.output)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } else toast.error('Não foi possível copiar')
  }

  const saveToLibrary = async () => {
    if (!result) return
    setSaving(true)
    try {
      await promptService.create({
        title: `Site · ${result.brief.companyName}`,
        content: result.output,
        category: 'sites',
      })
      toast.success('Salvo na biblioteca', 'Disponível em Biblioteca de prompts › Criação de sites.')
    } catch (err) {
      toast.error('Não foi possível salvar', errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Gerador de prompts para sites"
        description="Preencha as informações do cliente e gere um prompt completo para plataformas de criação de sites com IA."
        actions={
          <div className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
            <span className="text-[12px] text-fg-muted">Gerações hoje</span>
            <ProgressBar
              value={siteGenerations.used}
              max={siteGenerations.total}
              className="w-20"
              tone={limitReached ? 'amber' : 'blue'}
            />
            <span className="font-mono text-[12px] text-fg tabular-nums">
              {siteGenerations.used}/{siteGenerations.total}
            </span>
          </div>
        }
      />

      {limitReached && (
        <div className="mb-4">
          <LimitBanner
            title="Limite diário atingido"
            description="Suas gerações renovam amanhã. Planos superiores têm mais gerações por dia."
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <GeneratorForm brief={brief} setBrief={setBrief} onSubmit={generate} busy={busy} disabled={limitReached} />

        <Card className="flex min-h-[480px] flex-col">
          <CardHeader
            title="Resultado"
            description={
              result
                ? `${result.brief.companyName} · ${formatRelative(result.createdAt)}`
                : 'O prompt gerado aparecerá aqui.'
            }
            action={
              result &&
              !busy &&
              (result.engine === 'ai' ? (
                <Badge tone="ice">Gerado com IA</Badge>
              ) : (
                <Badge tone="amber">Modelo local · sem IA</Badge>
              ))
            }
          />
          <div className="flex min-h-0 flex-1 flex-col p-5">
            <AnimatePresence mode="wait">
              {busy ? (
                <motion.div
                  key="busy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <p className="flex items-center gap-2 text-[13px] text-fg-muted">
                    <Sparkles className="size-4 animate-pulse text-electric-300" />
                    Montando o prompt com as informações do cliente…
                  </p>
                  {[90, 70, 85, 60, 78, 50, 88, 66].map((w, i) => (
                    <Skeleton key={i} className="h-3" style={{ width: `${w}%` }} />
                  ))}
                </motion.div>
              ) : result ? (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <pre className="max-h-[520px] flex-1 overflow-auto rounded-xl border border-line bg-ink-950/70 p-4 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-fg-muted">
                    {result.output}
                  </pre>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={copy}>
                      {copied ? <Check /> : <Copy />}
                      {copied ? 'Copiado' : 'Copiar prompt'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={saveToLibrary}
                      loading={saving}
                      disabled={prompts.used >= prompts.total}
                      title={prompts.used >= prompts.total ? 'Limite de prompts da biblioteca atingido' : undefined}
                    >
                      {!saving && <LibraryBig />}
                      Salvar na biblioteca
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setBrief(result.brief)}>
                      <RotateCcw />
                      Reutilizar dados
                    </Button>
                  </div>
                  <p className="mt-3 text-[12px] leading-relaxed text-fg-subtle">
                    {result.engine === 'ai'
                      ? 'Gerado com inteligência artificial. Revise os detalhes antes de usar com o cliente.'
                      : 'Este prompt foi montado por um modelo estruturado local, sem inteligência artificial.'}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-1 flex-col items-center justify-center text-center"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl border border-line-strong bg-ink-800 text-electric-300">
                    <FileText className="size-5" />
                  </span>
                  <p className="mt-4 text-sm font-medium text-fg">Nenhum prompt gerado ainda</p>
                  <p className="mt-1 max-w-xs text-[13px] text-fg-muted">
                    Preencha o formulário ou use o exemplo para ver como funciona.
                  </p>
                  <Button variant="secondary" size="xs" className="mt-5" onClick={() => setBrief(EXAMPLE)}>
                    Preencher com exemplo
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </div>

      {generations.length > 0 && (
        <Card className="mt-4">
          <CardHeader title="Histórico de gerações" description="As últimas 30 gerações ficam salvas aqui." />
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {generations.map((g) => (
              <li
                key={g.id}
                className={cn('flex items-center gap-3 px-5 py-3', result?.id === g.id && 'bg-electric-500/[0.04]')}
              >
                <History className="size-4 shrink-0 text-fg-subtle" />
                <button type="button" onClick={() => setResult(g)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[13px] font-medium text-fg hover:text-electric-200">
                    {g.brief.companyName}
                  </span>
                  <span className="block truncate text-[12px] text-fg-subtle">
                    {g.brief.segment} · {g.brief.goal}
                  </span>
                </button>
                <span className="hidden text-[12px] text-fg-subtle sm:block">{formatRelative(g.createdAt)}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Excluir geração"
                  onClick={async () => {
                    await siteGeneratorService.removeGeneration(g.id)
                    if (result?.id === g.id) setResult(null)
                    toast.success('Geração removida do histórico')
                  }}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}

interface GeneratorFormProps {
  brief: SiteBrief
  setBrief: (updater: SiteBrief | ((b: SiteBrief) => SiteBrief)) => void
  onSubmit: () => void
  busy: boolean
  disabled?: boolean
}

function GeneratorForm({ brief, setBrief, onSubmit, busy, disabled }: GeneratorFormProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof SiteBrief, string>>>({})
  const [customFeature, setCustomFeature] = useState('')
  const set = <K extends keyof SiteBrief>(key: K, value: SiteBrief[K]) => {
    setBrief((b) => ({ ...b, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }
  const toggleFeature = (f: string) =>
    set('features', brief.features.includes(f) ? brief.features.filter((x) => x !== f) : [...brief.features, f])

  const addCustom = () => {
    const value = customFeature.trim()
    if (value && !brief.features.includes(value)) set('features', [...brief.features, value])
    setCustomFeature('')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = {
      companyName: brief.companyName.trim() ? undefined : 'Informe o nome da empresa.',
      segment: brief.segment.trim() ? undefined : 'Informe o segmento.',
    }
    setErrors(next)
    if (next.companyName || next.segment) return
    onSubmit()
  }

  return (
    <Card className="p-5">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <fieldset disabled={busy} className="contents">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight text-fg">Informações do cliente</h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="xs" onClick={() => setBrief(EXAMPLE)}>
                Usar exemplo
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setBrief(EMPTY)}>
                Limpar
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da empresa" error={errors.companyName}>
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  placeholder="Ex.: Studio Bella"
                  value={brief.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                  error={errors.companyName}
                />
              )}
            </Field>
            <Field label="Segmento" error={errors.segment}>
              {({ id, describedBy }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  placeholder="Ex.: Salão de beleza"
                  value={brief.segment}
                  onChange={(e) => set('segment', e.target.value)}
                  error={errors.segment}
                />
              )}
            </Field>
            <Field label="Cidade">
              {({ id }) => (
                <Input
                  id={id}
                  placeholder="Ex.: Recife, PE"
                  value={brief.city}
                  onChange={(e) => set('city', e.target.value)}
                />
              )}
            </Field>
            <Field label="Objetivo do site">
              {({ id }) => (
                <Select id={id} value={brief.goal} onChange={(e) => set('goal', e.target.value)}>
                  {GOALS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </Select>
              )}
            </Field>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-fg">Estilo visual</p>
            <div role="radiogroup" aria-label="Estilo visual" className="flex flex-wrap gap-1.5">
              {STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={brief.style === s}
                  onClick={() => set('style', s)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors',
                    brief.style === s
                      ? 'border-electric-400/60 bg-electric-500/10 text-fg'
                      : 'border-line-strong text-fg-muted hover:text-fg',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Field label="Cores desejadas" hint="Ex.: tons terrosos, verde-oliva e creme">
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                placeholder="Descreva a paleta ou as cores da marca"
                value={brief.colors}
                onChange={(e) => set('colors', e.target.value)}
              />
            )}
          </Field>

          <div>
            <p className="mb-2 text-[13px] font-medium text-fg">Funcionalidades necessárias</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Funcionalidades">
              {[...FEATURES, ...brief.features.filter((f) => !FEATURES.includes(f))].map((f) => {
                const active = brief.features.includes(f)
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleFeature(f)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors',
                      active
                        ? 'border-electric-400/60 bg-electric-500/10 text-fg'
                        : 'border-line-strong text-fg-muted hover:text-fg',
                    )}
                  >
                    {active ? (
                      <Check className="size-3 text-electric-300" />
                    ) : (
                      <Plus className="size-3 text-fg-subtle" />
                    )}
                    {f}
                    {active && !FEATURES.includes(f) && <X className="size-3 text-fg-subtle" />}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                aria-label="Outra funcionalidade"
                placeholder="Outra funcionalidade"
                value={customFeature}
                onChange={(e) => setCustomFeature(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustom()
                  }
                }}
                className="h-8 text-[13px]"
              />
              <Button variant="secondary" size="xs" onClick={addCustom} disabled={!customFeature.trim()}>
                Adicionar
              </Button>
            </div>
          </div>

          <Field label="Informações adicionais">
            {({ id }) => (
              <Textarea
                id={id}
                placeholder="Diferenciais, público-alvo, serviços principais, referências…"
                value={brief.extra}
                onChange={(e) => set('extra', e.target.value)}
                maxLength={1200}
                className="min-h-20"
              />
            )}
          </Field>

          <Button type="submit" loading={busy} disabled={disabled} className="w-full sm:w-auto sm:self-end" size="sm">
            {!busy && <WandSparkles />}
            {busy ? 'Gerando…' : 'Gerar prompt'}
          </Button>
        </fieldset>
      </form>
    </Card>
  )
}
