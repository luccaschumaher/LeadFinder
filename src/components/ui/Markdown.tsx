import { Check, Copy } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { copyToClipboard } from '@/lib/utils'

/**
 * Exibe o Markdown das respostas da IA com visual do LeadFinder.
 * Tudo vira elemento React (nada de HTML cru), então o texto da IA nunca executa código.
 * Suporta: títulos (#, ##, ###), listas, listas numeradas, citações (>) como cartões de
 * script com botão de copiar, blocos de código, linha (---), **negrito**, *itálico*,
 * `código` e links http(s).
 */

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; lines: string[] }
  | { type: 'code'; text: string }
  | { type: 'rule' }
  | { type: 'paragraph'; lines: string[] }

const LIST = /^\s*([-*•]|\d+[.)])\s+(.*)$/

function parse(text: string): Block[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()
    if (!trimmed) {
      i++
      continue
    }
    if (trimmed.startsWith('```')) {
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++])
      i++
      blocks.push({ type: 'code', text: code.join('\n') })
      continue
    }
    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].replace(/#+$/, '').trim() })
      i++
      continue
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'rule' })
      i++
      continue
    }
    if (trimmed.startsWith('>')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) quote.push(lines[i++].trim().replace(/^>\s?/, ''))
      blocks.push({ type: 'quote', lines: quote })
      continue
    }
    const item = line.match(LIST)
    if (item) {
      const ordered = /\d/.test(item[1])
      const items: string[] = []
      while (i < lines.length) {
        const m = lines[i].match(LIST)
        if (m && /\d/.test(m[1]) === ordered) items.push(m[2])
        else if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length)
          items[items.length - 1] += ` ${lines[i].trim()}`
        else break
        i++
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }
    const paragraph: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !LIST.test(lines[i]) &&
      !/^(#{1,6}\s|>|```)/.test(lines[i].trim()) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    )
      paragraph.push(lines[i++].trim())
    blocks.push({ type: 'paragraph', lines: paragraph })
  }
  return blocks
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\*[^*\s][^*]*\*)/g

function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
      return (
        <strong key={i} className="font-semibold text-fg">
          {part.slice(2, -2)}
        </strong>
      )
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
      return (
        <code key={i} className="rounded bg-ink-950/70 px-1.5 py-0.5 font-mono text-[0.85em] text-electric-200">
          {part.slice(1, -1)}
        </code>
      )
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/)
    if (link)
      return (
        <a
          key={i}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-electric-300 underline-offset-2 hover:underline"
        >
          {link[1]}
        </a>
      )
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return (
        <em key={i} className="text-fg">
          {part.slice(1, -1)}
        </em>
      )
    return part
  })
}

/** Cartão de script (citação) com botão de copiar o texto puro. */
function ScriptCard({ lines }: { lines: string[] }) {
  const [copied, setCopied] = useState(false)
  const plain = lines
    .join('\n')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^"|"$/g, '')
  const copy = async () => {
    if (await copyToClipboard(plain)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }
  }
  return (
    <div className="group relative rounded-xl border border-electric-400/20 bg-electric-500/[0.06] py-3 pr-11 pl-4">
      <span aria-hidden className="absolute inset-y-3 left-0 w-[3px] rounded-full bg-electric-400/70" />
      <div className="space-y-1.5 text-fg">
        {lines.map((l, i) => (l ? <p key={i}>{inline(l)}</p> : <div key={i} className="h-1" />))}
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copiado' : 'Copiar texto'}
        title={copied ? 'Copiado' : 'Copiar texto'}
        className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-overlay/5 hover:text-fg"
      >
        {copied ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  )
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = parse(text)
  return (
    <div className={cn('space-y-3 text-sm leading-relaxed text-fg-muted', className)}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'heading':
            return b.level <= 2 ? (
              <h3 key={i} className="pt-1 text-[15px] font-semibold tracking-tight text-fg first:pt-0">
                {inline(b.text)}
              </h3>
            ) : (
              <h4 key={i} className="pt-1 text-sm font-semibold text-fg first:pt-0">
                {inline(b.text)}
              </h4>
            )
          case 'list':
            return b.ordered ? (
              <ol key={i} className="space-y-2">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-md bg-electric-500/15 text-[11px] font-semibold text-electric-200 tabular-nums">
                      {j + 1}
                    </span>
                    <span className="min-w-0">{inline(it)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={i} className="space-y-1.5">
                {b.items.map((it, j) => (
                  <li key={j} className="flex gap-2.5">
                    <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-electric-400" />
                    <span className="min-w-0">{inline(it)}</span>
                  </li>
                ))}
              </ul>
            )
          case 'quote':
            return <ScriptCard key={i} lines={b.lines} />
          case 'code':
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-xl border border-line bg-ink-950/70 p-3 font-mono text-[12.5px] whitespace-pre-wrap text-fg-muted"
              >
                {b.text}
              </pre>
            )
          case 'rule':
            return <hr key={i} className="border-line" />
          default:
            return (
              <p key={i} className="text-fg/90">
                {b.lines.map((l, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    {inline(l)}
                  </span>
                ))}
              </p>
            )
        }
      })}
    </div>
  )
}
