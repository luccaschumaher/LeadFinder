import {
  AudioWaveform,
  Check,
  ChevronDown,
  Copy,
  MessageSquarePlus,
  MessagesSquare,
  PlugZap,
  RotateCcw,
  SendHorizontal,
  Trash2,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { LockedFeature } from '@/components/app/notices'
import { PageHeader } from '@/components/app/PageHeader'
import { WaveAvatar } from '@/components/app/WaveAvatar'
import { Mascot, ProfileAvatar } from '@/components/mascots/Mascot'
import { MascotPicker } from '@/components/mascots/pickers'
import { DEFAULT_MASCOT, MASCOTS, mascotInfo } from '@/data/characters'
import { authService } from '@/services/auth'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { Badge, Card } from '@/components/ui/display'
import { Markdown } from '@/components/ui/Markdown'
import { Menu } from '@/components/ui/Menu'
import { DEMO_AI } from '@/config/app'
import { usePlan } from '@/hooks/usePlan'
import { cn } from '@/lib/cn'
import { toast } from '@/lib/toast'
import { copyToClipboard, formatRelative } from '@/lib/utils'
import { waveService } from '@/services/wave'
import { useData } from '@/stores/data'
import { useCurrentUser } from '@/stores/session'
import type { ChatMessage } from '@/types'

const SUGGESTIONS = [
  'Como abordar uma barbearia que ainda não tem site?',
  'Quais argumentos usar com uma clínica que só tem Instagram?',
  'Monte uma estrutura de proposta para um restaurante.',
  'Como responder quando o cliente diz que está caro?',
]

const CAPABILITIES = [
  'Estratégias de prospecção',
  'Análise de empresas',
  'Mensagens de contato',
  'Propostas comerciais',
  'Negociação e objeções',
]

export function WaveIAPage() {
  const { can } = usePlan()
  if (!can('waveIA')) {
    return (
      <>
        <PageHeader title="LeadIA" description="Sua assistente de prospecção e vendas de sites." />
        <LockedFeature
          feature="waveIA"
          icon={AudioWaveform}
          title="Uma assistente para vender mais sites"
          description="A LeadIA vai apoiar sua prospecção do primeiro contato à proposta: analisa empresas, sugere abordagens e ajuda a responder objeções."
          benefits={[...CAPABILITIES, 'Escolha seu parceiro: robô, dragão, alienígena ou cachorrinho']}
          previewStyle="clear"
          preview={
            <div className="flex flex-wrap items-end justify-center gap-6 py-6 sm:gap-10">
              {MASCOTS.map((m) => (
                <div key={m.id} className="flex flex-col items-center gap-2">
                  <Mascot id={m.id} size={104} />
                  <span className="text-[12px] text-fg-muted">{m.name}</span>
                </div>
              ))}
            </div>
          }
        />
      </>
    )
  }
  return <WaveChat />
}

function WaveChat() {
  const user = useCurrentUser()
  const { waveMessages } = usePlan()
  const limitReached = !DEMO_AI && waveMessages.used >= waveMessages.total
  const mascot = user.preferences.mascot ?? DEFAULT_MASCOT
  const chooseMascot = (id: typeof mascot) => {
    authService.updatePreferences({ mascot: id })
    toast.success(`${mascotInfo(id).name} vai te acompanhar`)
  }
  const conversations = useData((s) => s.conversations)
  const [activeId, setActiveId] = useState<string | null>(conversations[0]?.id ?? null)
  const [input, setInput] = useState('')
  const [pending, setPending] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const active = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId])
  const messages = active?.messages ?? []
  const last = messages[messages.length - 1]
  const thinking = !!pending && pending === activeId && last?.role === 'user'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, thinking])

  const send = async (text: string) => {
    const value = text.trim()
    if (!value || thinking) return
    setInput('')
    const id = await waveService.send(activeId, value)
    setActiveId(id)
    setPending(id)
    inputRef.current?.focus()
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    send(input)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const retry = async () => {
    if (!activeId) return
    setPending(activeId)
    await waveService.retry(activeId)
  }

  const newConversation = () => {
    setActiveId(null)
    setInput('')
    inputRef.current?.focus()
  }

  const remove = async () => {
    if (!toDelete) return
    await waveService.remove(toDelete)
    if (toDelete === activeId) setActiveId(null)
    setToDelete(null)
    toast.success('Conversa excluída')
  }

  const unanswered = !thinking && last?.role === 'user'

  return (
    <>
      <PageHeader
        title="LeadIA"
        description="Converse sobre prospecção, análise de empresas, abordagens e propostas."
        actions={
          DEMO_AI ? (
            <Badge tone="amber">
              <PlugZap />
              IA não conectada
            </Badge>
          ) : (
            <Badge tone={limitReached ? 'amber' : 'ice'}>
              {waveMessages.used}/{waveMessages.total} mensagens hoje
            </Badge>
          )
        }
      />

      <div className="grid gap-4 lg:h-[calc(100dvh-13rem)] lg:min-h-[560px] lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_260px]">
        {/* Conversas */}
        <Card className="hidden min-h-0 flex-col lg:flex">
          <div className="p-3">
            <Button variant="secondary" size="sm" className="w-full" onClick={newConversation}>
              <MessageSquarePlus />
              Nova conversa
            </Button>
          </div>
          <p className="px-4 pb-1.5 font-mono text-[10px] tracking-[0.16em] text-fg-subtle uppercase">Recentes</p>
          <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {conversations.length === 0 && (
              <li className="px-2 py-3 text-[12px] text-fg-subtle">Nenhuma conversa ainda.</li>
            )}
            {conversations.map((c) => (
              <li key={c.id} className="group relative">
                <button
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    'w-full rounded-lg px-2.5 py-2 pr-8 text-left transition-colors',
                    c.id === activeId ? 'bg-white/[0.07] text-fg' : 'text-fg-muted hover:bg-white/[0.04] hover:text-fg',
                  )}
                >
                  <span className="block truncate text-[13px]">{c.title}</span>
                  <span className="block text-[11px] text-fg-subtle">{formatRelative(c.updatedAt)}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Excluir conversa ${c.title}`}
                  onClick={() => setToDelete(c.id)}
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-300 focus:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </Card>

        {/* Conversa ativa */}
        <Card className="flex min-h-[70dvh] flex-col overflow-hidden lg:min-h-0">
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Menu
              align="start"
              trigger={(props) => (
                <button
                  type="button"
                  {...props}
                  aria-label="Trocar personagem da LeadIA"
                  title="Trocar personagem"
                  className="rounded-full transition-transform hover:scale-105"
                >
                  <WaveAvatar size="sm" state={thinking ? 'thinking' : 'idle'} />
                </button>
              )}
              items={MASCOTS.map((m) => ({
                label: `${m.name} · ${m.species}`,
                icon: <ProfileAvatar id={m.id} size={20} />,
                active: m.id === mascot,
                onSelect: () => chooseMascot(m.id),
              }))}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{active?.title ?? 'Nova conversa'}</p>
              <p className="truncate text-[11px] text-fg-subtle">
                {thinking ? 'Processando…' : 'LeadIA · assistente de vendas'}
              </p>
            </div>
            <div className="flex items-center gap-1 lg:hidden">
              <Menu
                trigger={(props) => (
                  <Button variant="ghost" size="xs" aria-label="Conversas" {...props}>
                    <MessagesSquare />
                    <span className="hidden sm:inline">Conversas</span>
                    <ChevronDown />
                  </Button>
                )}
                items={[
                  { label: 'Nova conversa', icon: <MessageSquarePlus />, onSelect: newConversation },
                  ...(conversations.length ? (['separator'] as const) : []),
                  ...conversations
                    .slice(0, 8)
                    .map((c) => ({ label: c.title, active: c.id === activeId, onSelect: () => setActiveId(c.id) })),
                ]}
              />
            </div>
            {active && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Excluir conversa"
                onClick={() => setToDelete(active.id)}
              >
                <Trash2 />
              </Button>
            )}
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6" aria-live="polite">
            {messages.length === 0 ? (
              <div className="mx-auto flex max-w-lg flex-col items-center pt-4 text-center">
                <WaveAvatar size="lg" />
                <h2 className="mt-8 text-lg font-semibold tracking-tight text-fg">
                  Olá, {user.name.split(' ')[0]}. Como posso ajudar?
                </h2>
                <p className="mt-1.5 text-sm text-fg-muted">
                  Pergunte sobre prospecção, abordagens, propostas ou negociação.
                </p>
                <div className="mt-5 w-full max-w-xs xl:hidden">
                  <MascotPicker value={mascot} onChange={chooseMascot} compact />
                </div>
                <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-xl border border-line-strong bg-ink-850/60 p-3 text-left text-[13px] leading-snug text-fg-muted transition-colors hover:border-electric-400/40 hover:text-fg"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ol className="mx-auto flex max-w-2xl flex-col gap-5">
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.li
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <MessageBubble
                        message={m}
                        onRetry={m.kind === 'notice' && i === messages.length - 1 ? retry : undefined}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
                {thinking && (
                  <li className="flex items-center gap-3" aria-label="LeadIA está processando">
                    <WaveAvatar size="sm" state="thinking" />
                    <span className="flex gap-1 rounded-2xl rounded-tl-md border border-line bg-ink-850 px-4 py-3">
                      {[0, 1, 2].map((d) => (
                        <motion.span
                          key={d}
                          className="size-1.5 rounded-full bg-fg-subtle"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: d * 0.18 }}
                        />
                      ))}
                    </span>
                  </li>
                )}
                {unanswered && (
                  <li className="flex justify-center">
                    <Button variant="secondary" size="xs" onClick={retry}>
                      <RotateCcw />
                      Solicitar resposta novamente
                    </Button>
                  </li>
                )}
              </ol>
            )}
          </div>

          <form onSubmit={submit} className="border-t border-line p-3 sm:p-4">
            <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-ink-950/60 p-1.5 pl-3 transition-colors focus-within:border-electric-400/60">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                maxLength={2000}
                aria-label="Mensagem para a LeadIA"
                placeholder="Escreva sua mensagem…"
                className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm text-fg outline-none placeholder:text-fg-subtle [field-sizing:content]"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || thinking || limitReached}
                aria-label="Enviar mensagem"
              >
                <SendHorizontal />
              </Button>
            </div>
            {limitReached ? (
              <p className="mt-2 text-center text-[12px] text-amber-200/90">
                Você usou as {waveMessages.total} mensagens de hoje. A LeadIA volta à meia-noite.
              </p>
            ) : (
              <p className="mt-2 hidden text-center text-[11px] text-fg-subtle sm:block">
                Enter para enviar · Shift + Enter para nova linha
              </p>
            )}
          </form>
        </Card>

        {/* Painel lateral: espaço do mascote */}
        <Card className="hidden flex-col items-center p-6 text-center xl:flex">
          <div className="relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border border-line bg-[radial-gradient(circle_at_50%_40%,rgb(47_107_255/0.14),transparent_70%)] p-6">
            <WaveAvatar size="lg" state={thinking ? 'thinking' : 'idle'} />
            <p className="mt-6 text-sm font-medium text-fg">{mascotInfo(mascot).name}</p>
            <p className="mt-0.5 text-[12px] text-fg-subtle">{mascotInfo(mascot).personality}</p>
          </div>
          <div className="mt-4 w-full text-left">
            <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-fg-subtle uppercase">Seu parceiro</p>
            <MascotPicker value={mascot} onChange={chooseMascot} compact />
          </div>
          <div className="mt-5 w-full text-left">
            <p className="font-mono text-[10px] tracking-[0.16em] text-fg-subtle uppercase">Pode ajudar com</p>
            <ul className="mt-3 space-y-2">
              {CAPABILITIES.map((c) => (
                <li key={c} className="flex items-center gap-2 text-[13px] text-fg-muted">
                  <Check className="size-3.5 text-ice-accent" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        destructive
        title="Excluir conversa?"
        description="Todas as mensagens desta conversa serão excluídas."
        confirmLabel="Excluir"
      />
    </>
  )
}

function MessageBubble({ message, onRetry }: { message: ChatMessage; onRetry?: () => void }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (await copyToClipboard(message.content)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }
  }

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-electric-500/90 px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-white">
          {message.content}
        </div>
      </div>
    )
  }

  const notice = message.kind === 'notice'
  return (
    <div className="flex gap-3">
      <WaveAvatar size="sm" className="mt-0.5" />
      <div className="max-w-[85%] min-w-0">
        <div
          role={notice ? 'status' : undefined}
          className={cn(
            'rounded-2xl rounded-tl-md border px-4 py-3 text-sm leading-relaxed',
            notice && 'whitespace-pre-wrap',
            notice ? 'border-amber-400/25 bg-amber-400/[0.06] text-amber-100/90' : 'border-line bg-ink-850 text-fg',
          )}
        >
          {notice && (
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-amber-300 uppercase">
              <PlugZap className="size-3.5" />
              {DEMO_AI ? 'Serviço não conectado' : 'Aviso'}
            </span>
          )}
          {notice ? message.content : <Markdown text={message.content} />}
        </div>
        <div className="mt-1.5 flex items-center gap-1">
          <Button variant="ghost" size="xs" onClick={copy} aria-label="Copiar resposta">
            {copied ? <Check /> : <Copy />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
          {onRetry && (
            <Button variant="ghost" size="xs" onClick={onRetry}>
              <RotateCcw />
              Tentar novamente
            </Button>
          )}
          <span className="ml-1 text-[11px] text-fg-subtle">{formatRelative(message.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
