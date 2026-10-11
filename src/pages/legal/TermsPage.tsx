import { Link } from 'react-router'
import { LegalLayout, LegalSection } from '@/components/legal/LegalLayout'
import { LEGAL } from '@/config/legal'
import { PLANS } from '@/config/plans'
import { ROUTES } from '@/config/routes'

const mail = <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>

export function TermsPage() {
  const paid = PLANS.filter((p) => p.checkoutUrl)
  return (
    <LegalLayout
      eyebrow="Termos"
      title="Termos de Uso"
      updatedAt={LEGAL.updatedAt}
      intro={
        <p>
          Estes Termos regem o uso do LeadFinder, plataforma operada por {LEGAL.operator}. Ao criar uma conta ou usar o
          serviço, você declara que leu e concorda com eles e com a nossa{' '}
          <Link to={ROUTES.privacy} className="text-electric-300 hover:underline">
            Política de Privacidade
          </Link>
          . Se não concordar, não utilize a plataforma.
        </p>
      }
    >
      <LegalSection title="1. O que é o LeadFinder">
        <p>
          O LeadFinder é uma ferramenta de apoio à prospecção comercial para profissionais que vendem sites e serviços
          digitais. Ele permite buscar empresas a partir de informações comerciais públicas, organizar leads, controlar
          vendas e usar recursos de inteligência artificial (Gerador de prompts para sites e LeadIA).
        </p>
        <p>
          O LeadFinder é uma ferramenta: o resultado das suas vendas depende do seu trabalho. Não garantimos quantidade
          de clientes, fechamentos ou faturamento.
        </p>
      </LegalSection>

      <LegalSection title="2. Conta">
        <ul>
          <li>Você precisa ter pelo menos 18 anos e informar dados verdadeiros no cadastro.</li>
          <li>
            A conta é pessoal. Você é responsável por manter sua senha em segredo e por tudo o que for feito com ela.
          </li>
          <li>É proibido criar várias contas para burlar limites do plano gratuito ou dos planos pagos.</li>
          <li>Avise-nos imediatamente em {mail} se suspeitar de uso indevido da sua conta.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Planos, tokens e limites">
        <ul>
          <li>
            O plano Free é gratuito. Os planos pagos são{' '}
            {paid.map((p, i) => (
              <span key={p.id}>
                {p.name} ({p.priceLabel}){i < paid.length - 2 ? ', ' : i === paid.length - 2 ? ' e ' : ''}
              </span>
            ))}
            , com os recursos e limites descritos na página de planos.
          </li>
          <li>
            Cada empresa exibida em uma busca consome 1 token. Os tokens renovam diariamente à meia-noite (horário de
            Brasília), não acumulam de um dia para o outro, não podem ser transferidos e não têm valor em dinheiro.
          </li>
          <li>
            Os recursos possuem limites diários (buscas, gerações de prompt e mensagens da LeadIA) para garantir a
            qualidade do serviço para todos.
          </li>
          <li>
            Podemos alterar planos, preços e limites. Mudanças de preço não afetam o período já pago e serão comunicadas
            com antecedência.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Pagamento, renovação e cancelamento">
        <ul>
          <li>Os pagamentos são processados pela Cakto. O LeadFinder não recebe nem armazena dados do seu cartão.</li>
          <li>
            As assinaturas são mensais e renovam automaticamente até que você cancele. O plano é liberado assim que o
            pagamento é aprovado.
          </li>
          <li>
            Você pode cancelar a qualquer momento pelo link enviado pela Cakto no e-mail da compra, ou pedindo ajuda em{' '}
            {mail}. Após o cancelamento, você mantém o plano até o fim do período já pago e depois volta ao Free.
          </li>
          <li>
            <strong>Direito de arrependimento:</strong> conforme o art. 49 do Código de Defesa do Consumidor, você pode
            desistir da primeira contratação em até 7 dias após o pagamento e receber o valor integral de volta.
          </li>
          <li>Em caso de reembolso ou contestação do pagamento (chargeback), o acesso ao plano é encerrado.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Uso permitido e proibido">
        <p>Você se compromete a usar o LeadFinder de forma ética e dentro da lei. É proibido:</p>
        <ul>
          <li>
            enviar spam, disparos em massa ou mensagens insistentes às empresas encontradas, ou contatá-las depois de um
            pedido para não ser contatado;
          </li>
          <li>vender, redistribuir ou publicar as listas de empresas obtidas na plataforma;</li>
          <li>usar robôs, scripts ou qualquer automação para acessar o serviço ou contornar limites e travas;</li>
          <li>tentar invadir, sobrecarregar ou explorar falhas da plataforma;</li>
          <li>
            usar a plataforma para fraudes, golpes, conteúdo ilegal ou para se passar por outra pessoa ou empresa.
          </li>
        </ul>
        <p>
          Ao contatar empresas, você é o responsável pelo cumprimento da Lei Geral de Proteção de Dados (LGPD) e das
          regras dos canais usados (como o WhatsApp). O descumprimento destes Termos pode levar à suspensão ou ao
          encerramento da conta, sem reembolso do período em curso quando houver violação grave.
        </p>
      </LegalSection>

      <LegalSection title="6. Dados das empresas">
        <p>
          As informações exibidas nas buscas (nome, endereço, telefone, site, nota e avaliações) são dados comerciais
          públicos obtidos de serviços de mapas e busca. Elas podem estar desatualizadas ou incompletas, e não
          garantimos sua exatidão. Confira os dados antes de usá-los.
        </p>
      </LegalSection>

      <LegalSection title="7. Inteligência artificial">
        <ul>
          <li>
            O Gerador de prompts e a LeadIA usam inteligência artificial e podem produzir respostas imprecisas ou
            incompletas. Revise todo conteúdo antes de usá-lo ou enviá-lo a clientes.
          </li>
          <li>
            As orientações da LeadIA são sugestões comerciais e não substituem aconselhamento jurídico, contábil ou
            financeiro profissional.
          </li>
          <li>O conteúdo que você gera é seu e pode ser usado livremente nos seus projetos.</li>
          <li>Não envie à IA dados sensíveis, senhas ou informações confidenciais de terceiros.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Disponibilidade e responsabilidade">
        <p>
          Trabalhamos para manter o LeadFinder sempre no ar, mas o serviço pode passar por manutenções, falhas ou
          indisponibilidade de fornecedores. Na máxima extensão permitida pela lei, não nos responsabilizamos por lucros
          cessantes, perda de negócios ou danos indiretos decorrentes do uso da plataforma.
        </p>
      </LegalSection>

      <LegalSection title="9. Encerramento">
        <p>
          Você pode deixar de usar o LeadFinder e pedir a exclusão da sua conta a qualquer momento em {mail}. Podemos
          encerrar contas que violem estes Termos.
        </p>
      </LegalSection>

      <LegalSection title="10. Alterações e lei aplicável">
        <p>
          Podemos atualizar estes Termos. Mudanças relevantes serão avisadas na plataforma ou por e-mail; continuar
          usando o serviço depois disso significa concordar com a nova versão. Estes Termos seguem as leis brasileiras,
          e fica eleito o foro do domicílio do usuário, conforme o Código de Defesa do Consumidor.
        </p>
      </LegalSection>

      <LegalSection title="11. Contato">
        <p>Dúvidas sobre estes Termos: {mail}.</p>
      </LegalSection>
    </LegalLayout>
  )
}
