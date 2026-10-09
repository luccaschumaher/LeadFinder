import { Blink, Cheeks, Eye, Gloss, Mouth, Shade } from './parts'
import { anim, origin, type CharacterProps } from './utils'

/*
 * Personagens do LeadFinder, desenhados em SVG num viewBox de 120×120.
 * O volume vem de gradientes radiais com luz no canto superior esquerdo,
 * brilhos especulares e uma sombra no chão (aplicada pelo componente Mascot).
 */

/* ---------------- Robô · Bit ---------------- */
export function Robot({ uid, look, mood, animated }: CharacterProps) {
  const ex = look.x * 3.5
  const ey = look.y * 2.5
  return (
    <>
      <defs>
        <Shade id={`${uid}-metal`} light="#FFFFFF" mid="#C9D5E8" dark="#7486A6" />
        <radialGradient id={`${uid}-glow`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#E0F2FF" />
          <stop offset="0.5" stopColor="#7CC4FF" />
          <stop offset="1" stopColor="#2F6BFF" />
        </radialGradient>
        <linearGradient id={`${uid}-screen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#13213A" />
          <stop offset="1" stopColor="#080E1A" />
        </linearGradient>
      </defs>
      {/* antena */}
      <line x1="60" y1="25" x2="60" y2="14" stroke="#8A9BB8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="11" r="5.5" fill={`url(#${uid}-glow)`} className={anim(animated, 'animate-mascot-glow')} />
      {/* orelhas */}
      <rect x="17" y="44" width="11" height="21" rx="5.5" fill={`url(#${uid}-metal)`} />
      <rect x="92" y="44" width="11" height="21" rx="5.5" fill={`url(#${uid}-metal)`} />
      {/* corpo */}
      <rect x="37" y="82" width="46" height="25" rx="12.5" fill={`url(#${uid}-metal)`} />
      <circle cx="60" cy="94.5" r="5" fill={`url(#${uid}-glow)`} className={anim(animated, 'animate-mascot-glow')} />
      {/* cabeça */}
      <rect x="23" y="22" width="74" height="62" rx="25" fill={`url(#${uid}-metal)`} />
      <Gloss cx={42} cy={31} rx={14} ry={5.5} opacity={0.75} />
      {/* tela */}
      <rect x="32" y="33" width="56" height="40" rx="16" fill={`url(#${uid}-screen)`} />
      <rect x="32.5" y="33.5" width="55" height="39" rx="15.5" fill="none" stroke="#5B91FF" strokeOpacity="0.45" />
      <g style={{ transform: `translate(${ex}px, ${ey}px)`, transition: 'transform 140ms ease-out' }}>
        <Blink animated={animated}>
          <rect x="41.5" y="44" width="9.5" height="13" rx="4.75" fill="#9BDCFF" />
          <rect x="44" y="46" width="3" height="4" rx="1.5" fill="#fff" opacity="0.8" />
        </Blink>
        <Blink animated={animated}>
          <rect x="69" y="44" width="9.5" height="13" rx="4.75" fill="#9BDCFF" />
          <rect x="71.5" y="46" width="3" height="4" rx="1.5" fill="#fff" opacity="0.8" />
        </Blink>
      </g>
      <Cheeks y={64} left={42} right={78} opacity={0.55} />
      <Mouth cx={60} cy={63} mood={mood} animated={animated} color="#9BDCFF" width={11} />
    </>
  )
}

/* ---------------- Dragão · Faísca ---------------- */
export function Dragon({ uid, look, mood, animated }: CharacterProps) {
  return (
    <>
      <defs>
        <Shade id={`${uid}-skin`} light="#C8FFF3" mid="#3DD9C1" dark="#0E7C70" />
        <Shade id={`${uid}-wing`} light="#E6DDFF" mid="#A78BFA" dark="#6D3FE0" />
        <Shade id={`${uid}-horn`} light="#FFF7D6" mid="#FDE68A" dark="#E0A93B" />
      </defs>
      {/* asas */}
      <g className={anim(animated, 'animate-mascot-flap-l')} style={origin(38, 62)}>
        <path d="M38 62 C 20 42, 4 46, 6 64 C 14 59, 20 66, 26 64 C 28 70, 33 70, 38 70 Z" fill={`url(#${uid}-wing)`} />
      </g>
      <g className={anim(animated, 'animate-mascot-flap-r')} style={origin(82, 62)}>
        <path
          d="M82 62 C 100 42, 116 46, 114 64 C 106 59, 100 66, 94 64 C 92 70, 87 70, 82 70 Z"
          fill={`url(#${uid}-wing)`}
        />
      </g>
      {/* corpo e barriga */}
      <ellipse cx="60" cy="96" rx="23" ry="14" fill={`url(#${uid}-skin)`} />
      <ellipse cx="60" cy="99" rx="13" ry="8.5" fill="#FFF3C4" opacity="0.95" />
      {/* chifres */}
      <path d="M41 32 C 36 22, 38 14, 45 11 C 44 18, 46 24, 50 29 Z" fill={`url(#${uid}-horn)`} />
      <path d="M79 32 C 84 22, 82 14, 75 11 C 76 18, 74 24, 70 29 Z" fill={`url(#${uid}-horn)`} />
      {/* cabeça */}
      <ellipse cx="60" cy="56" rx="35" ry="31" fill={`url(#${uid}-skin)`} />
      <path d="M53 27 l3.5 -8 l3.5 8 Z M60 26 l3.5 -9 l3.5 9 Z" fill={`url(#${uid}-horn)`} />
      <Gloss cx={45} cy={37} rx={12} ry={6} opacity={0.5} />
      {/* focinho */}
      <ellipse cx="60" cy="70" rx="18" ry="11.5" fill="#D9FFF6" />
      <circle cx="54.5" cy="67.5" r="1.7" fill="#0E7C70" />
      <circle cx="65.5" cy="67.5" r="1.7" fill="#0E7C70" />
      <Eye cx={45} cy={51} r={9.5} look={look} animated={animated} />
      <Eye cx={75} cy={51} r={9.5} look={look} animated={animated} />
      <Cheeks y={64} left={34} right={86} color="#FB7185" opacity={0.45} />
      <Mouth cx={60} cy={76} mood={mood} animated={animated} color="#0E5E55" width={13} />
      {mood === 'idle' && <path d="M64.5 76.6 l1.6 3.2 l1.6 -3.6 Z" fill="#fff" />}
    </>
  )
}

/* ---------------- Alienígena · Zuni ---------------- */
export function Alien({ uid, look, mood, animated }: CharacterProps) {
  const hx = look.x * 3
  const hy = look.y * 2.5
  return (
    <>
      <defs>
        <Shade id={`${uid}-skin`} light="#F0FFD9" mid="#9BE27A" dark="#3E9446" />
        <Shade id={`${uid}-suit`} light="#C7DBFF" mid="#5B91FF" dark="#1E46C8" />
        <Shade id={`${uid}-bulb`} light="#FFF0FF" mid="#F0ABFC" dark="#C2489E" />
      </defs>
      {/* antenas */}
      <g className={anim(animated, 'animate-mascot-sway')} style={origin(60, 30)}>
        <path d="M49 29 Q 43 17 38 13" stroke="#4E9E50" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="37" cy="11.5" r="5" fill={`url(#${uid}-bulb)`} />
        <path d="M71 29 Q 77 17 82 13" stroke="#4E9E50" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="83" cy="11.5" r="5" fill={`url(#${uid}-bulb)`} />
      </g>
      {/* traje */}
      <path d="M41 108 C 41 92, 48 84, 60 84 C 72 84, 79 92, 79 108 Z" fill={`url(#${uid}-suit)`} />
      <ellipse cx="60" cy="86" rx="14" ry="4" fill="#DCE8FF" />
      <circle cx="60" cy="97" r="3.5" fill="#FDE68A" />
      {/* cabeça */}
      <path
        d="M60 19 C 88 19, 99 40, 93 60 C 88 76, 75 86, 60 86 C 45 86, 32 76, 27 60 C 21 40, 32 19, 60 19 Z"
        fill={`url(#${uid}-skin)`}
      />
      <Gloss cx={44} cy={31} rx={14} ry={6.5} rotate={-22} opacity={0.55} />
      {/* olhos grandes e brilhantes */}
      <Blink animated={animated}>
        <ellipse cx="45" cy="54" rx="11" ry="13.5" fill="#141A2E" transform="rotate(-20 45 54)" />
        <g style={{ transform: `translate(${hx}px, ${hy}px)`, transition: 'transform 140ms ease-out' }}>
          <ellipse cx="47.5" cy="49" rx="3.6" ry="4.6" fill="#fff" />
          <circle cx="42" cy="59" r="1.8" fill="#fff" opacity="0.7" />
        </g>
      </Blink>
      <Blink animated={animated}>
        <ellipse cx="75" cy="54" rx="11" ry="13.5" fill="#141A2E" transform="rotate(20 75 54)" />
        <g style={{ transform: `translate(${hx}px, ${hy}px)`, transition: 'transform 140ms ease-out' }}>
          <ellipse cx="77.5" cy="49" rx="3.6" ry="4.6" fill="#fff" />
          <circle cx="72" cy="59" r="1.8" fill="#fff" opacity="0.7" />
        </g>
      </Blink>
      <Cheeks y={68} left={36} right={84} color="#FF8FB1" opacity={0.45} />
      <Mouth cx={60} cy={73} mood={mood} animated={animated} color="#2F6B33" width={10} />
    </>
  )
}

/* ---------------- Cachorrinho · Pipoca ---------------- */
export function Puppy({ uid, look, mood, animated }: CharacterProps) {
  const hx = look.x * 2.2
  const hy = look.y * 1.8
  return (
    <>
      <defs>
        <Shade id={`${uid}-fur`} light="#FFF1DE" mid="#F5BE85" dark="#C9813F" />
        <Shade id={`${uid}-ear`} light="#B98058" mid="#8B5A3A" dark="#5A3620" />
      </defs>
      {/* corpo e patinhas */}
      <ellipse cx="60" cy="97" rx="23" ry="14" fill={`url(#${uid}-fur)`} />
      <ellipse cx="49" cy="108" rx="7.5" ry="4.2" fill="#FFF3E3" />
      <ellipse cx="71" cy="108" rx="7.5" ry="4.2" fill="#FFF3E3" />
      {/* cabeça */}
      <ellipse cx="60" cy="56" rx="34" ry="30.5" fill={`url(#${uid}-fur)`} />
      <ellipse cx="75" cy="49" rx="11" ry="10" fill="#E39A55" opacity="0.75" />
      <Gloss cx={44} cy={36} rx={12} ry={6} opacity={0.5} />
      {/* orelhas caídas */}
      <g className={anim(animated, 'animate-mascot-ear-l')} style={origin(33, 34)}>
        <path
          d="M34 33 C 19 33, 12 52, 16 68 C 20 77, 29 73, 31 63 C 33 52, 38 42, 34 33 Z"
          fill={`url(#${uid}-ear)`}
        />
      </g>
      <g className={anim(animated, 'animate-mascot-ear-r')} style={origin(87, 34)}>
        <path
          d="M86 33 C 101 33, 108 52, 104 68 C 100 77, 91 73, 89 63 C 87 52, 82 42, 86 33 Z"
          fill={`url(#${uid}-ear)`}
        />
      </g>
      {/* focinho */}
      <ellipse cx="60" cy="70" rx="16.5" ry="12" fill="#FFF6EA" />
      {/* olhos */}
      <Blink animated={animated}>
        <circle cx="46" cy="52" r="6.2" fill="#2A1A12" />
        <circle cx={48 + hx} cy={50 + hy} r="2.2" fill="#fff" />
      </Blink>
      <Blink animated={animated}>
        <circle cx="74" cy="52" r="6.2" fill="#2A1A12" />
        <circle cx={76 + hx} cy={50 + hy} r="2.2" fill="#fff" />
      </Blink>
      {/* nariz */}
      <path d="M53.5 64 q6.5 -4 13 0 q-2 6.5 -6.5 6.5 q-4.5 0 -6.5 -6.5 Z" fill="#2A1A12" />
      <ellipse cx="57.5" cy="64.6" rx="2.2" ry="1.1" fill="#fff" opacity="0.6" />
      <path
        d="M60 70.5 v2.5 M60 73 q-4 4 -8 1 M60 73 q4 4 8 1"
        stroke="#7A4A2A"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {mood !== 'thinking' && (
        <path
          d="M57 75.5 q3 8 6 0 Z"
          fill="#FB7185"
          className={mood === 'talking' ? anim(animated, 'mascot-part animate-mascot-talk') : undefined}
        />
      )}
      <Cheeks y={65} left={36} right={84} color="#FB7185" opacity={0.4} />
    </>
  )
}
