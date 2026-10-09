import type { PromptCategory } from '@/types'

export const PROMPT_CATEGORIES: { id: PromptCategory; label: string }[] = [
  { id: 'first-contact', label: 'Primeiro contato' },
  { id: 'follow-up', label: 'Follow-up' },
  { id: 'proposal', label: 'Proposta' },
  { id: 'objections', label: 'Objeções' },
  { id: 'sites', label: 'Criação de sites' },
  { id: 'other', label: 'Outros' },
]

export const categoryLabel = (id: PromptCategory) => PROMPT_CATEGORIES.find((c) => c.id === id)?.label ?? id

/**
 * Modelos oficiais do LeadFinder: disponíveis em todos os planos, somente leitura
 * e não contam no limite de prompts personalizados.
 */
export const PROMPT_TEMPLATES: { id: string; title: string; category: PromptCategory; content: string }[] = [
  {
    id: 'tpl-first-whatsapp',
    title: 'Primeiro contato pelo WhatsApp',
    category: 'first-contact',
    content:
      'Escreva uma mensagem curta e cordial de primeiro contato pelo WhatsApp para {{empresa}}, do segmento {{segmento}}, em {{cidade}}. Apresente-me como desenvolvedor de sites, cite um benefício concreto de ter um site para esse tipo de negócio e termine com uma pergunta aberta. Máximo de 4 linhas, sem parecer propaganda.',
  },
  {
    id: 'tpl-first-email',
    title: 'Primeiro contato por e-mail',
    category: 'first-contact',
    content:
      'Crie um e-mail de prospecção para {{empresa}} ({{segmento}}, {{cidade}}). Assunto curto e específico. No corpo: uma observação sobre a presença digital atual da empresa, como um site ajudaria a atrair clientes da região e um convite para uma conversa de 15 minutos. Tom profissional e direto.',
  },
  {
    id: 'tpl-follow-3days',
    title: 'Retorno após 3 dias sem resposta',
    category: 'follow-up',
    content:
      'Escreva um follow-up educado para {{empresa}}, que não respondeu minha mensagem de 3 dias atrás sobre a criação de um site. Retome o assunto em uma frase, acrescente um argumento novo relacionado ao segmento {{segmento}} e facilite a resposta com uma pergunta de sim ou não.',
  },
  {
    id: 'tpl-proposal',
    title: 'Estrutura de proposta comercial',
    category: 'proposal',
    content:
      'Monte a estrutura de uma proposta comercial de site para {{empresa}}, do segmento {{segmento}}. Inclua: diagnóstico da situação atual, objetivos do site, páginas e funcionalidades sugeridas, prazo estimado, investimento (deixe o valor em aberto) e próximos passos. Linguagem clara para um dono de pequeno negócio.',
  },
  {
    id: 'tpl-objection-price',
    title: 'Responder "está caro"',
    category: 'objections',
    content:
      'O cliente {{empresa}} disse que o site está caro. Sugira três respostas diferentes, sem desconto imediato, que mostrem o retorno do investimento para um negócio do segmento {{segmento}} e proponham alternativas, como começar com uma versão menor.',
  },
  {
    id: 'tpl-objection-instagram',
    title: 'Responder "já tenho Instagram"',
    category: 'objections',
    content:
      'O cliente {{empresa}} respondeu que já tem Instagram e não precisa de site. Escreva uma resposta respeitosa explicando como site e redes sociais se complementam, citando busca no Google, credibilidade e independência de algoritmo. Máximo de 5 linhas.',
  },
]
