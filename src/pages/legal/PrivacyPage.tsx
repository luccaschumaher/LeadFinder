import { LegalLayout, LegalSection } from '@/components/legal/LegalLayout'
import { LEGAL } from '@/config/legal'

const mail = <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>

export function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Privacidade"
      title="Política de Privacidade"
      updatedAt={LEGAL.updatedAt}
      intro={
        <p>
          Esta Política explica quais dados pessoais o LeadFinder coleta, por que coleta e como você controla seus
          dados, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD). O controlador dos dados é{' '}
          {LEGAL.operator}, que pode ser contatado em {mail}.
        </p>
      }
    >
      <LegalSection title="1. Dados que coletamos">
        <ul>
          <li>
            <strong>Cadastro:</strong> nome, e-mail, senha (guardada de forma criptografada; nós não temos acesso a ela)
            e o personagem escolhido.
          </li>
          <li>
            <strong>Uso da plataforma:</strong> buscas realizadas, leads, favoritos, anotações, prompts, vendas
            registradas no Financeiro, conversas com a LeadIA e informações de uso diário (tokens e limites).
          </li>
          <li>
            <strong>Pagamento:</strong> plano contratado, situação da assinatura e o e-mail usado na compra. Os dados do
            cartão e do pagamento ficam com a Cakto; não os recebemos nem armazenamos.
          </li>
          <li>
            <strong>Dados técnicos:</strong> endereço IP, navegador e registros de acesso, necessários para segurança e
            exigidos pelo Marco Civil da Internet.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Para que usamos">
        <ul>
          <li>criar e manter sua conta e prestar o serviço contratado (execução de contrato);</li>
          <li>processar pagamentos e liberar seu plano (execução de contrato);</li>
          <li>aplicar limites, prevenir fraudes, abusos e acessos automatizados (legítimo interesse);</li>
          <li>cumprir obrigações legais, como a guarda de registros de acesso (obrigação legal);</li>
          <li>
            enviar avisos sobre sua conta e, se você permitir nas Configurações, novidades do produto (legítimo
            interesse e consentimento).
          </li>
        </ul>
        <p>Não vendemos seus dados e não os usamos para publicidade de terceiros.</p>
      </LegalSection>

      <LegalSection title="3. Com quem compartilhamos">
        <p>
          Seus dados são tratados por fornecedores que nos ajudam a operar o LeadFinder, somente para essa finalidade:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> — banco de dados e autenticação;
          </li>
          <li>
            <strong>Cloudflare</strong> — hospedagem do site e verificação anti-robô (Turnstile);
          </li>
          <li>
            <strong>Google (Gemini)</strong> — processamento das mensagens enviadas à LeadIA e dos briefings do Gerador
            de prompts;
          </li>
          <li>
            <strong>Serper</strong> — consulta das informações públicas de empresas nas buscas (recebe apenas o segmento
            e a região pesquisados);
          </li>
          <li>
            <strong>Cakto</strong> — processamento dos pagamentos.
          </li>
        </ul>
        <p>
          Alguns desses fornecedores podem armazenar dados em servidores fora do Brasil, com garantias de proteção
          compatíveis com a LGPD. Também podemos compartilhar dados quando exigido por lei ou ordem judicial.
        </p>
      </LegalSection>

      <LegalSection title="4. Dados das empresas pesquisadas">
        <p>
          As buscas exibem informações comerciais públicas de empresas (nome, endereço, telefone, site e avaliações).
          Quando você salva ou contata essas empresas, você passa a ser responsável por esse uso e deve respeitar a
          LGPD, inclusive atendendo a pedidos para não ser contatado.
        </p>
      </LegalSection>

      <LegalSection title="5. Por quanto tempo guardamos">
        <ul>
          <li>Os dados da conta e de uso ficam guardados enquanto sua conta existir.</li>
          <li>
            Após a exclusão da conta, os dados são apagados, exceto os registros de acesso, mantidos por 6 meses (Marco
            Civil da Internet), e informações que a lei obrigue a guardar por mais tempo.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Seus direitos">
        <p>Pela LGPD, você pode a qualquer momento:</p>
        <ul>
          <li>confirmar se tratamos seus dados e acessá-los;</li>
          <li>corrigir dados incompletos ou desatualizados (nome e foto podem ser alterados nas Configurações);</li>
          <li>pedir a portabilidade (há exportação de dados nas Configurações);</li>
          <li>pedir a exclusão dos seus dados e da sua conta;</li>
          <li>revogar consentimentos, como o recebimento de novidades por e-mail.</li>
        </ul>
        <p>Para exercer qualquer direito, escreva para {mail}. Respondemos em até 15 dias.</p>
      </LegalSection>

      <LegalSection title="7. Cookies e armazenamento no navegador">
        <p>
          Usamos o armazenamento local do navegador apenas para manter você conectado e lembrar suas preferências. Não
          usamos cookies de publicidade nem de rastreamento. A verificação anti-robô da Cloudflare pode processar dados
          técnicos do navegador para diferenciar pessoas de robôs.
        </p>
      </LegalSection>

      <LegalSection title="8. Segurança">
        <p>
          Adotamos medidas como conexão criptografada (HTTPS), senhas criptografadas, regras de acesso que impedem um
          usuário de ver os dados de outro e chaves de serviços guardadas apenas no servidor. Nenhum sistema é 100%
          seguro; se ocorrer um incidente que possa trazer risco a você, avisaremos você e a ANPD, conforme a lei.
        </p>
      </LegalSection>

      <LegalSection title="9. Menores de idade">
        <p>O LeadFinder é destinado a maiores de 18 anos e não coleta intencionalmente dados de menores.</p>
      </LegalSection>

      <LegalSection title="10. Alterações e contato">
        <p>
          Podemos atualizar esta Política; mudanças relevantes serão avisadas na plataforma ou por e-mail. Dúvidas,
          pedidos e reclamações sobre privacidade: {mail}. Você também pode recorrer à Autoridade Nacional de Proteção
          de Dados (ANPD).
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
