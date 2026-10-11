import { useEffect, useRef, useState } from 'react'
import { date, int } from '../lib/format'

interface Point {
  day: string
  value: number
}

/**
 * Barras diárias de UMA métrica (sem legenda: o título nomeia a série).
 * Barras finas com topo arredondado presas à base, grade discreta e tooltip por dia.
 */
export function BarChart({
  data,
  format = int,
  label,
}: {
  data: Point[]
  format?: (v: number) => string
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const height = 200
  const pad = { top: 12, right: 8, bottom: 24, left: 44 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const max = Math.max(1, ...data.map((d) => d.value))
  const niceMax = (() => {
    const p = 10 ** Math.floor(Math.log10(max))
    return Math.ceil(max / p) * p
  })()
  const slot = innerW / Math.max(1, data.length)
  const gap = 2
  const barW = Math.max(2, Math.min(28, slot - gap))
  const y = (v: number) => pad.top + innerH - (v / niceMax) * innerH
  const ticks = [0, niceMax / 2, niceMax]
  const labelEvery = Math.ceil(data.length / 6)
  const h = hover !== null ? data[hover] : null

  return (
    <div ref={ref} className="relative w-full">
      <svg width={width} height={height} role="img" aria-label={label} className="block">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="rgb(255 255 255 / 0.06)" />
            <text
              x={pad.left - 8}
              y={y(t)}
              dy="0.32em"
              textAnchor="end"
              className="fill-fg-subtle text-[10px] tabular-nums"
            >
              {format(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + i * slot + (slot - barW) / 2
          const top = y(d.value)
          const bh = pad.top + innerH - top
          const r = Math.min(4, barW / 2, bh)
          return (
            <g key={d.day}>
              {d.value > 0 && (
                <path
                  d={`M${x},${pad.top + innerH} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${pad.top + innerH} Z`}
                  className={hover === null || hover === i ? 'fill-electric-400' : 'fill-electric-400/40'}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={height - 6} textAnchor="middle" className="fill-fg-subtle text-[10px]">
                  {date(d.day).slice(0, 5)}
                </text>
              )}
              {/* área de toque maior que a barra */}
              <rect
                x={pad.left + i * slot}
                y={pad.top}
                width={slot}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onTouchStart={() => setHover(i)}
              />
            </g>
          )
        })}
        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={pad.top + innerH}
          y2={pad.top + innerH}
          stroke="rgb(255 255 255 / 0.12)"
        />
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 rounded-lg border border-line-strong bg-ink-800 px-2.5 py-1.5 text-[12px] shadow-lg"
          style={{ left: Math.min(width - 140, Math.max(0, pad.left + hover * slot + slot / 2 - 60)) }}
        >
          <p className="text-fg-subtle">{date(h.day)}</p>
          <p className="font-semibold text-fg tabular-nums">{format(h.value)}</p>
        </div>
      )}
    </div>
  )
}
