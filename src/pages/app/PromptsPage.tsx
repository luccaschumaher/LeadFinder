import { Copy, CopyPlus, Ellipsis, LibraryBig, Lock, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef, useState, type FormEvent } from 'react'
import { LimitBanner, LockedFeature } from '@/components/app/notices'
import { PageHeader } from '@/components/app/PageHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog, Dialog } from '@/components/ui/Dialog'
import { Badge, Card, EmptyState, ProgressBar, Segmented } from '@/components/ui/display'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Menu } from '@/components/ui/Menu'
import { isUnlimited } from '@/config/plans'
import { categoryLabel, PROMPT_CATEGORIES, PROMPT_TEMPLATES } from '@/data/promptTemplates'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/cn'
import { errorMessage } from '@/lib/errors'
import { toast } from '@/lib/toast'
import { copyToClipboard, formatDate, normalize } from '@/lib/utils'
import { promptService, type PromptInput } from '@/services/prompts'
import { useData } from '@/stores/data'
import type { Prompt, PromptCategory } from '@/types'

type Tab = 'mine' | 'templates'
const VARIABLES = ['{{empresa}}', '{{segmento}}', '{{cidade}}']

export function PromptsPage() {
  const { can } = usePlan()
  if (!can('promptLibrary')) {
    return (
      <>
        <PageHeader
          title="Biblioteca de prompts"
          description="Guarde e reutilize as instruções que você usa para abordar empresas com IA."
        />
        <LockedFeature
          feature="promptLibrary"
          icon={LibraryBig}
          title="Seus prompts de abordagem, sempre à mão"
          description="Crie, organize e reutilize as instruções que você usa com IA para abordar empresas, além de acessar os modelos prontos do LeadFinder."
          benefits={[
            'Modelos prontos de primeiro contato, follow-up, proposta e objeções',
            'Prompts personalizados com variáveis como {{empresa}} e {{cidade}}',
            'Categorias, busca, favoritos e cópia com um clique',
            'Silver: 5 prompts · Gold: 10 prompts · Diamond: ilimitados',
          ]}
        />
      </>
    )
  }
  return <PromptLibrary />
}

function PromptLibrary() {
  const prompts = useData((s) => s.prompts)
  const { prompts: usage } = usePlan()
  const [tab, setTab] = useState<Tab>(prompts.length > 0 ? 'mine' : 'templates')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<PromptCategory | 'all'>('all')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [editor, setEditor] = useState<{ prompt?: Prompt; initial?: PromptInput } | null>(null)
  const [toDelete, setToDelete] = useState<Prompt | null>(null)
  const [deleting, setDeleting] = useState(false)

  const unlimited = isUnlimited(usage.total)
  const limitReached = !unlimited && usage.used >= usage.total

  const filteredMine = useMemo(() => {
    const q = normalize(query)
    return prompts
      .filter((p) => (category === 'all' || p.category === category) && (!onlyFavorites || p.favorite))
      .filter((p) => !q || normalize(`${p.title} ${p.content}`).includes(q))
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt))
  }, [prompts, query, category, onlyFavorites])

  const filteredTemplates = useMemo(() => {
    const q = normalize(query)
    return PROMPT_TEMPLATES.filter(
      (p) =>
        (category === 'all' || p.category === category) && (!q || normalize(`${p.title} ${p.content}`).includes(q)),
    )
  }, [query, category])

  const copy = async (content: string) => {
    if (await copyToClipboard(content))
      toast.success('Prompt copiado', 'Cole na sua ferramenta de IA e substitua as variáveis.')
    else toast.error('Não foi possível copiar')
  }

  const openCreate = (initial?: PromptInput) => {
    if (limitReached) {
      toast.error('Limite de prompts atingido', 'Conheça os planos para salvar mais prompts.')
      return
    }
    setEditor({ initial })
  }

  const remove = async () => {
    if (!toDelete) return
    setDeleting(true)
    await promptService.remove(toDelete.id)
    setDeleting(false)
    setToDelete(null)
    toast.success('Prompt excluído')
  }

  return (
    <>
      <PageHeader
        title="Biblioteca de prompts"
        description="Guarde e reutilize as instruções que você usa para abordar empresas com IA."
        actions={
          <Button
            size="sm"
            onClick={() => openCreate()}
            disabled={limitReached}
            title={limitReached ? 'Limite do plano atingido' : undefined}
          >
            {limitReached ? <Lock /> : <Plus />}
            Novo prompt
          </Button>
        }
      />

      <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-[13px] sm:justify-start sm:gap-3">
            <span className="text-fg-muted">Prompts personalizados</span>
            <span className="font-mono text-fg tabular-nums">
              {unlimited ? `${usage.used} · ilimitado` : `${usage.used}/${usage.total}`}
            </span>
          </div>
          {!unlimited && (
            <ProgressBar
              value={usage.used}
              max={usage.total}
              tone={limitReached ? 'amber' : 'blue'}
              className="mt-2 sm:max-w-xs"
            />
          )}
        </div>
        <p className="text-[12px] text-fg-subtle">Modelos do LeadFinder não contam no limite.</p>
      </Card>

      {limitReached && (
        <div className="mb-4">
          <LimitBanner
            title={`Você atingiu o limite de ${usage.total} prompts`}
            description="Exclua prompts que não usa mais ou faça upgrade para salvar novos."
          />
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          label="Seção"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'mine', label: 'Meus prompts', count: prompts.length },
            { value: 'templates', label: 'Modelos do LeadFinder', count: PROMPT_TEMPLATES.length },
          ]}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            aria-label="Buscar prompts"
            placeholder="Buscar prompts"
            icon={<Search />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 sm:w-60"
          />
          <Select
            aria-label="Categoria"
            value={category}
            onChange={(e) => setCategory(e.target.value as PromptCategory | 'all')}
            className="h-9 sm:w-48"
          >
            <option value="all">Todas as categorias</option>
            {PROMPT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
          {tab === 'mine' && (
            <Button
              variant={onlyFavorites ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setOnlyFavorites((v) => !v)}
              aria-pressed={onlyFavorites}
            >
              <Star className={cn(onlyFavorites && 'fill-amber-300 text-amber-300')} />
              Favoritos
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4">
        {tab === 'mine' ? (
          prompts.length === 0 ? (
            <Card>
              <EmptyState
                icon={<LibraryBig />}
                title="Sua biblioteca está vazia"
                description="Crie seu primeiro prompt ou salve uma cópia de um modelo do LeadFinder."
                action={
                  <>
                    <Button size="xs" onClick={() => openCreate()} disabled={limitReached}>
                      <Plus />
                      Criar prompt
                    </Button>
                    <Button variant="secondary" size="xs" onClick={() => setTab('templates')}>
                      Ver modelos
                    </Button>
                  </>
                }
              />
            </Card>
          ) : filteredMine.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Search />}
                title="Nenhum prompt encontrado"
                description="Ajuste a busca ou os filtros."
              />
            </Card>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              <AnimatePresence initial={false}>
                {filteredMine.map((p) => (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                  >
                    <PromptCard
                      title={p.title}
                      category={p.category}
                      content={p.content}
                      meta={`Atualizado em ${formatDate(p.updatedAt)}`}
                      favorite={p.favorite}
                      onToggleFavorite={() => promptService.toggleFavorite(p.id)}
                      onCopy={() => copy(p.content)}
                      menu={[
                        { label: 'Editar', icon: <Pencil />, onSelect: () => setEditor({ prompt: p }) },
                        { label: 'Copiar conteúdo', icon: <Copy />, onSelect: () => copy(p.content) },
                        'separator',
                        { label: 'Excluir', icon: <Trash2 />, danger: true, onSelect: () => setToDelete(p) },
                      ]}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Search />}
              title="Nenhum modelo encontrado"
              description="Ajuste a busca ou a categoria."
            />
          </Card>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {filteredTemplates.map((t) => (
              <li key={t.id}>
                <PromptCard
                  title={t.title}
                  category={t.category}
                  content={t.content}
                  meta="Modelo do LeadFinder"
                  onCopy={() => copy(t.content)}
                  menu={[
                    { label: 'Copiar conteúdo', icon: <Copy />, onSelect: () => copy(t.content) },
                    {
                      label: 'Salvar cópia editável',
                      icon: <CopyPlus />,
                      disabled: limitReached,
                      onSelect: () => openCreate({ title: t.title, content: t.content, category: t.category }),
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <PromptEditor
        key={editor?.prompt?.id ?? (editor ? 'new' : 'closed')}
        state={editor}
        onClose={() => setEditor(null)}
        onSaved={() => setTab('mine')}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        loading={deleting}
        destructive
        title="Excluir prompt?"
        description={`"${toDelete?.title}" será excluído permanentemente.`}
        confirmLabel="Excluir"
      />
    </>
  )
}

function highlight(content: string) {
  return content.split(/(\{\{[^}]+\}\})/g).map((part, i) =>
    /^\{\{.+\}\}$/.test(part) ? (
      <span key={i} className="rounded bg-electric-500/12 px-1 text-electric-300">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

interface PromptCardProps {
  title: string
  category: PromptCategory
  content: string
  meta: string
  favorite?: boolean
  onToggleFavorite?: () => void
  onCopy: () => void
  menu: Parameters<typeof Menu>[0]['items']
}

function PromptCard({ title, category, content, meta, favorite, onToggleFavorite, onCopy, menu }: PromptCardProps) {
  return (
    <Card className="flex h-full flex-col p-4 transition-colors hover:border-line-strong">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-fg">{title}</h3>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge tone={category === 'sites' ? 'ice' : 'neutral'}>{categoryLabel(category)}</Badge>
            <span className="text-[11px] text-fg-subtle">{meta}</span>
          </div>
        </div>
        {onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleFavorite}
            aria-pressed={favorite}
            aria-label={favorite ? 'Remover dos favoritos' : 'Favoritar prompt'}
          >
            <Star className={cn(favorite && 'fill-amber-300 text-amber-300')} />
          </Button>
        )}
        <Menu
          trigger={(props) => (
            <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${title}`} {...props}>
              <Ellipsis />
            </Button>
          )}
          items={menu}
        />
      </div>
      <p className="mt-3 line-clamp-4 flex-1 font-mono text-[12px] leading-relaxed text-fg-muted">
        {highlight(content)}
      </p>
      <div className="mt-4 border-t border-line pt-3">
        <Button variant="secondary" size="xs" onClick={onCopy}>
          <Copy />
          Copiar
        </Button>
      </div>
    </Card>
  )
}

function PromptEditor({
  state,
  onClose,
  onSaved,
}: {
  state: { prompt?: Prompt; initial?: PromptInput } | null
  onClose: () => void
  onSaved: () => void
}) {
  const source = state?.prompt ?? state?.initial
  const [form, setForm] = useState<PromptInput>({
    title: source?.title ?? '',
    content: source?.content ?? '',
    category: source?.category ?? 'first-contact',
  })
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({})
  const [saving, setSaving] = useState(false)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const editing = !!state?.prompt

  const insertVariable = (v: string) => {
    const el = contentRef.current
    const start = el?.selectionStart ?? form.content.length
    const end = el?.selectionEnd ?? form.content.length
    const content = form.content.slice(0, start) + v + form.content.slice(end)
    setForm((f) => ({ ...f, content }))
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + v.length, start + v.length)
    })
  }

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const next = {
      title: form.title.trim() ? undefined : 'Dê um título ao prompt.',
      content: form.content.trim().length >= 10 ? undefined : 'Escreva o conteúdo (mínimo de 10 caracteres).',
    }
    setErrors(next)
    if (next.title || next.content) return
    setSaving(true)
    try {
      if (editing && state?.prompt) await promptService.update(state.prompt.id, form)
      else await promptService.create(form)
      toast.success(editing ? 'Prompt atualizado' : 'Prompt criado')
      onSaved()
      onClose()
    } catch (err) {
      toast.error('Não foi possível salvar', errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={!!state}
      onClose={onClose}
      locked={saving}
      size="lg"
      title={editing ? 'Editar prompt' : 'Novo prompt'}
      description="Use variáveis como {{empresa}} para personalizar o prompt a cada empresa."
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button size="sm" onClick={() => submit()} loading={saving}>
            {editing ? 'Salvar alterações' : 'Criar prompt'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <Field label="Título" error={errors.title}>
            {({ id, describedBy }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                data-autofocus
                value={form.title}
                maxLength={80}
                placeholder="Ex.: Primeiro contato para clínicas"
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                error={errors.title}
              />
            )}
          </Field>
          <Field label="Categoria">
            {({ id }) => (
              <Select
                id={id}
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as PromptCategory }))}
              >
                {PROMPT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field
          label="Conteúdo"
          error={errors.content}
          hint={`${form.content.length}/4000 caracteres`}
          aside={
            <div className="flex gap-1">
              {VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="rounded bg-electric-500/10 px-1.5 py-0.5 font-mono text-[10px] text-electric-300 hover:bg-electric-500/20"
                >
                  {v}
                </button>
              ))}
            </div>
          }
        >
          {({ id, describedBy }) => (
            <Textarea
              ref={contentRef}
              id={id}
              aria-describedby={describedBy}
              value={form.content}
              maxLength={4000}
              placeholder="Escreva a instrução que você usa com a IA…"
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              error={errors.content}
              className="min-h-48 font-mono text-[13px]"
            />
          )}
        </Field>
      </form>
    </Dialog>
  )
}
