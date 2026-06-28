'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronRight,
  Copy, ExternalLink, BookOpen, Settings, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

interface StatusData {
  checks: Record<string, boolean>
  configured: number
  total: number
  configMap: Record<string, string>
}

interface GuiaSection {
  id: string
  title: string
  icon: string
  checkKey: string
  description: string
  steps: Array<{
    title: string
    content: string
    code?: string
    link?: { label: string; url: string }
  }>
  envVars: string[]
}

const SECTIONS: GuiaSection[] = [
  {
    id: 'google-oauth',
    title: '1. Google OAuth 2.0',
    icon: '🔐',
    checkKey: 'google_oauth',
    description: 'Permite que usuários façam login com sua conta Google',
    steps: [
      {
        title: 'Acessar Google Cloud Console',
        content: 'Acesse console.cloud.google.com e faça login com sua conta Google.',
        link: { label: 'Abrir Google Cloud Console', url: 'https://console.cloud.google.com' },
      },
      {
        title: 'Criar ou Selecionar Projeto',
        content: 'Clique em "Selecionar projeto" no topo → "Novo Projeto" → dê um nome como "DarkShop" → clique em "Criar".',
      },
      {
        title: 'Ativar APIs necessárias',
        content: 'No menu lateral, vá em "APIs e Serviços" → "Biblioteca". Pesquise e ative:\n• Google+ API (ou People API)\n• Google Drive API (para entrega de arquivos)',
      },
      {
        title: 'Configurar Tela de Consentimento OAuth',
        content: 'Vá em "APIs e Serviços" → "Tela de consentimento OAuth". Selecione "Externo" → preencha nome do app, email de suporte → clique em "Salvar e Continuar".',
      },
      {
        title: 'Criar Credenciais OAuth',
        content: 'Vá em "Credenciais" → "Criar Credenciais" → "ID do cliente OAuth 2.0".\n\nTipo: Aplicativo Web\nNome: DarkShop\n\nURIs de redirecionamento autorizados:\n• http://localhost:3000/api/auth/callback/google\n• https://seudominio.com/api/auth/callback/google',
      },
      {
        title: 'Copiar as credenciais',
        content: 'Após criar, você verá o "ID do cliente" e o "Segredo do cliente". Copie ambos para o arquivo .env.local',
        code: 'GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com\nGOOGLE_CLIENT_SECRET=seu_client_secret',
      },
    ],
    envVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  },
  {
    id: 'discord-oauth',
    title: '2. Discord OAuth 2.0',
    icon: '🎮',
    checkKey: 'discord_oauth',
    description: 'Login social via Discord para gamers e comunidades alternativas',
    steps: [
      {
        title: 'Acessar Discord Developer Portal',
        content: 'Acesse discord.com/developers/applications com sua conta Discord.',
        link: { label: 'Abrir Discord Developer Portal', url: 'https://discord.com/developers/applications' },
      },
      {
        title: 'Criar Nova Aplicação',
        content: 'Clique em "New Application" → digite "DarkShop" → clique em "Create".',
      },
      {
        title: 'Configurar OAuth2',
        content: 'No menu lateral, clique em "OAuth2" → "General".\n\nEm "Redirects", adicione:\n• http://localhost:3000/api/auth/callback/discord\n• https://seudominio.com/api/auth/callback/discord\n\nClique em "Save Changes".',
      },
      {
        title: 'Obter Client ID e Secret',
        content: 'Na mesma página OAuth2, copie o "CLIENT ID". Para o secret, clique em "Reset Secret" → confirme → copie.',
        code: 'DISCORD_CLIENT_ID=seu_client_id\nDISCORD_CLIENT_SECRET=seu_client_secret',
      },
    ],
    envVars: ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET'],
  },
  {
    id: 'mercadopago',
    title: '3. Mercado Pago (PIX)',
    icon: '💳',
    checkKey: 'mercadopago',
    description: 'Pagamentos via PIX com QR Code gerado automaticamente',
    steps: [
      {
        title: 'Criar Conta Business',
        content: 'Acesse mercadopago.com.br e crie ou acesse sua conta Business (Mercado Livre Empresas).',
        link: { label: 'Acessar Mercado Pago', url: 'https://mercadopago.com.br' },
      },
      {
        title: 'Acessar Developer Panel',
        content: 'Acesse marketplace.mercadolibre.com/MPtools/portal/developers → "Suas integrações" → "Criar aplicação".',
        link: { label: 'Developer Panel', url: 'https://developers.mercadopago.com' },
      },
      {
        title: 'Criar Aplicação',
        content: 'Preencha:\n• Nome: DarkShop\n• Plataforma: OnLine\n• Produto: Cobranças\n\nClique em "Criar aplicação".',
      },
      {
        title: 'Configurar Webhook',
        content: 'Na aplicação criada, vá em "Webhooks" → adicione a URL:\n\nhttps://seudominio.com/api/webhooks/mercadopago\n\nSelecione o evento: payment',
      },
      {
        title: 'Obter Credenciais de Produção',
        content: 'Vá em "Credenciais" → "Produção" → copie o Access Token e Public Key.',
        code: 'MP_ACCESS_TOKEN=APP_USR-...\nMP_PUBLIC_KEY=APP_USR-...\nMP_WEBHOOK_SECRET=sua_assinatura_webhook',
      },
    ],
    envVars: ['MP_ACCESS_TOKEN', 'MP_PUBLIC_KEY', 'MP_WEBHOOK_SECRET'],
  },
  {
    id: 'paypal',
    title: '4. PayPal Business',
    icon: '🔵',
    checkKey: 'paypal',
    description: 'Pagamentos internacionais via PayPal com webhooks',
    steps: [
      {
        title: 'Acessar PayPal Developer',
        content: 'Acesse developer.paypal.com com sua conta PayPal Business.',
        link: { label: 'PayPal Developer', url: 'https://developer.paypal.com' },
      },
      {
        title: 'Criar Aplicação REST',
        content: 'Vá em "Apps & Credentials" → "Create App".\n• Nome: DarkShop\n• Merchant (App type)\n\nClique em "Create App".',
      },
      {
        title: 'Configurar Webhook',
        content: 'Na aplicação, em "Webhooks" → "Add Webhook".\n\nURL: https://seudominio.com/api/webhooks/paypal\n\nEventos:\n• PAYMENT.CAPTURE.COMPLETED\n• CHECKOUT.ORDER.APPROVED\n• PAYMENT.CAPTURE.DENIED',
      },
      {
        title: 'Copiar Credenciais',
        content: 'Copie o Client ID e Client Secret. O Webhook ID aparece após criar o webhook.',
        code: 'PAYPAL_CLIENT_ID=AY...\nPAYPAL_CLIENT_SECRET=EH...\nPAYPAL_WEBHOOK_ID=seu_webhook_id\nPAYPAL_MODE=sandbox',
      },
    ],
    envVars: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_WEBHOOK_ID'],
  },
  {
    id: 'picpay',
    title: '5. PicPay Business',
    icon: '💚',
    checkKey: 'picpay',
    description: 'Pagamentos via PicPay, popular no Brasil',
    steps: [
      {
        title: 'Criar Conta Business',
        content: 'Acesse lojista.picpay.com e crie ou acesse sua conta empresarial.',
        link: { label: 'PicPay Lojista', url: 'https://lojista.picpay.com' },
      },
      {
        title: 'Acessar Integrações',
        content: 'No painel do lojista, vá em "Configurações" → "Integrações" → "API".',
      },
      {
        title: 'Obter Tokens',
        content: 'Copie:\n• PicPay Token (x-picpay-token)\n• Seller Token (para validar callbacks)',
      },
      {
        title: 'Configurar Callback',
        content: 'Adicione a URL de callback:\nhttps://seudominio.com/api/webhooks/picpay',
        code: 'PICPAY_TOKEN=seu_picpay_token\nPICSELLER_TOKEN=seu_seller_token',
      },
    ],
    envVars: ['PICPAY_TOKEN', 'PICPAY_SELLER_TOKEN'],
  },
  {
    id: 'google-drive',
    title: '6. Google Drive API',
    icon: '📁',
    checkKey: 'google_drive',
    description: 'Entrega automática de arquivos e pastas — concede acesso individual a cada cliente via Drive API',
    steps: [
      {
        title: 'Entenda os 3 métodos de entrega',
        content: 'No cadastro de cada produto você escolhe como o arquivo será entregue:\n\n📎 Link Direto — envia o link por e-mail. Qualquer pessoa com o link acessa. Bom para produtos de baixo valor ou gratuitos.\n\n📁 Pasta Compartilhada — igual ao Link Direto, mas aponta para uma pasta com vários arquivos. Ideal para packs/cursos públicos.\n\n🔐 Conceder Permissão — usa a Google Drive API para compartilhar o arquivo ou pasta EXCLUSIVAMENTE com o e-mail do cliente que pagou. Quem não comprou recebe erro de acesso negado. Recomendado para produtos de alto valor.',
      },
      {
        title: 'Pré-requisito: ativar a Google Drive API no projeto',
        content: 'Acesse o Google Cloud Console. Se ainda não tem um projeto, crie um (ex: "DarkShop").\n\nNo menu lateral vá em "APIs e Serviços" → "Biblioteca" → pesquise "Google Drive API" → clique em "Ativar".\n\n⚠️ Sem essa API ativada o service account não consegue gerenciar permissões.',
        link: { label: 'Abrir Google Cloud Console', url: 'https://console.cloud.google.com' },
      },
      {
        title: 'Criar Service Account',
        content: 'No menu lateral do Cloud Console vá em "IAM & Admin" → "Contas de serviço" → "Criar conta de serviço".\n\nPreencha:\n• Nome: darkshop-drive\n• Descrição: Entrega de produtos digitais DarkShop\n\nClique em "Criar e continuar". Na tela de permissões pode clicar em "Continuar" sem selecionar nada. Depois clique em "Concluir".',
      },
      {
        title: 'Gerar chave JSON da conta de serviço',
        content: 'Na lista de contas de serviço, clique na que você criou → aba "Chaves" → "Adicionar chave" → "Criar nova chave" → JSON → "Criar".\n\nUm arquivo .json será baixado com dois campos importantes:\n• client_email — o e-mail da conta de serviço\n• private_key — a chave RSA privada\n\n🔒 GUARDE COM SEGURANÇA. Nunca commite no GitHub.',
      },
      {
        title: 'Configurar as variáveis de ambiente',
        content: 'Abra o arquivo JSON baixado e copie os dois campos:\n\n• "client_email" → vira GOOGLE_SERVICE_ACCOUNT_EMAIL\n• "private_key" → vira GOOGLE_PRIVATE_KEY\n\nAtenção com a private_key: ela tem quebras de linha reais (\\n). No arquivo .env ou no Railway, certifique-se que estão como \\n (dois caracteres) e não quebras reais:',
        code: 'GOOGLE_SERVICE_ACCOUNT_EMAIL=darkshop-drive@seu-projeto.iam.gserviceaccount.com\nGOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkq...CHAVE_COMPLETA...\\n-----END PRIVATE KEY-----\\n"',
      },
      {
        title: 'Compartilhar os arquivos/pastas com o service account',
        content: 'Este é o passo mais importante para o método "Conceder Permissão" funcionar.\n\nPara CADA arquivo ou pasta que você vai vender:\n1. Abra o Google Drive\n2. Clique com botão direito no arquivo/pasta → "Compartilhar"\n3. Cole o GOOGLE_SERVICE_ACCOUNT_EMAIL no campo de e-mail\n4. Defina a permissão como "Editor" (necessário para que o service account consiga re-compartilhar com clientes)\n5. Desmarque "Notificar pessoas" → clique em "Compartilhar"\n\n✅ Feito. O service account agora pode conceder e revogar acesso de outras pessoas neste recurso.',
      },
      {
        title: 'Configurar o produto no painel admin',
        content: 'Ao criar ou editar um produto no admin:\n\n1. Cole a URL do arquivo ou pasta no campo "Link do Drive"\n   Formatos aceitos:\n   • https://drive.google.com/file/d/ID_ARQUIVO/view  (arquivo)\n   • https://drive.google.com/drive/folders/ID_PASTA  (pasta)\n\n2. Selecione o método de entrega:\n   • "Conceder Permissão" → acesso protegido por e-mail (recomendado)\n   • "Link Direto" → link público enviado por e-mail\n   • "Pasta Compartilhada" → link de pasta pública enviado por e-mail\n\nApós pagamento confirmado, o sistema chama a Drive API, compartilha com o e-mail do cliente e depois envia o e-mail de entrega com o link.',
      },
      {
        title: 'Configurar no Railway (produção)',
        content: 'No painel do Railway, acesse seu serviço → aba "Variables" → adicione:\n\n1. GOOGLE_SERVICE_ACCOUNT_EMAIL\n   Valor: o client_email do JSON\n   Ex: darkshop-drive@seu-projeto.iam.gserviceaccount.com\n\n2. GOOGLE_PRIVATE_KEY\n   Valor: a private_key completa, com -----BEGIN/END PRIVATE KEY----- e com \\n substituindo as quebras de linha.\n\n💡 Dica: Se a chave apresentar erro de parse, tente colar sem as aspas externas — o Railway trata o valor como string automaticamente.',
      },
      {
        title: 'Verificar se está funcionando',
        content: 'Formas de confirmar que a integração está ativa:\n\n1. Painel admin → Configurações → Status das Integrações → "Google Drive" deve mostrar ✓ OK\n\n2. Nos logs do Railway após uma compra você verá:\n   [DRIVE] Permissão concedida para cliente@email.com no recurso ABC123 (arquivo)\n   ou\n   [DRIVE] Permissão concedida para cliente@email.com no recurso XYZ456 (pasta)\n\n3. No Google Drive → clique com botão direito no arquivo/pasta → "Compartilhar" → o e-mail do cliente deve aparecer na lista de pessoas com acesso.',
      },
    ],
    envVars: ['GOOGLE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_PRIVATE_KEY'],
  },
  {
    id: 'email',
    title: '7. Configuração de Email',
    icon: '📧',
    checkKey: 'email',
    description: 'Envio de emails de confirmação e entrega de produtos',
    steps: [
      {
        title: 'Opção A: Gmail com Senha de App',
        content: 'Na conta Google:\n1. Ative a Verificação em 2 etapas\n2. Acesse Conta Google → Segurança → "Senhas de app"\n3. Selecione "Email" e "Computador Windows"\n4. Copie a senha gerada de 16 caracteres',
        code: 'EMAIL_HOST=smtp.gmail.com\nEMAIL_PORT=587\nEMAIL_USER=seu@gmail.com\nEMAIL_PASS=xxxx xxxx xxxx xxxx\nEMAIL_FROM="DarkShop <noreply@darkshop.com>"',
      },
      {
        title: 'Opção B: Resend (Recomendado)',
        content: 'Acesse resend.com → crie conta → "API Keys" → "Create API Key".\nVerifique seu domínio em "Domains" para melhor deliverabilidade.',
        link: { label: 'Acessar Resend', url: 'https://resend.com' },
        code: 'EMAIL_HOST=smtp.resend.com\nEMAIL_PORT=587\nEMAIL_USER=resend\nEMAIL_PASS=re_xxxxxxxxx\nEMAIL_FROM="DarkShop <noreply@seudominio.com>"',
      },
      {
        title: 'Opção C: Mailgun',
        content: 'Acesse mailgun.com → crie conta → adicione domínio → obtenha credenciais SMTP.',
        link: { label: 'Acessar Mailgun', url: 'https://mailgun.com' },
      },
    ],
    envVars: ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'],
  },
  {
    id: 'cloudinary',
    title: '8. Cloudinary (Upload de Imagens)',
    icon: '🖼️',
    checkKey: 'cloudinary',
    description: 'Upload e otimização automática de imagens dos produtos',
    steps: [
      {
        title: 'Criar Conta Gratuita',
        content: 'Acesse cloudinary.com e crie uma conta gratuita (limite generoso de 25GB/mês).',
        link: { label: 'Criar conta Cloudinary', url: 'https://cloudinary.com' },
      },
      {
        title: 'Acessar Dashboard',
        content: 'No dashboard, na seção "Product Environment Credentials", você verá:\n• Cloud Name\n• API Key\n• API Secret',
      },
      {
        title: 'Configurar Upload Preset',
        content: 'Vá em Settings → Upload → Upload Presets → "Add upload preset".\nNome: darkshop_products\nSigning Mode: Unsigned (para upload direto do frontend)',
        code: 'CLOUDINARY_CLOUD_NAME=seu_cloud_name\nCLOUDINARY_API_KEY=123456789\nCLOUDINARY_API_SECRET=seu_api_secret',
      },
    ],
    envVars: ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'],
  },
  {
    id: 'database',
    title: '9. Banco de Dados',
    icon: '🗄️',
    checkKey: 'database',
    description: 'PostgreSQL para produção ou SQLite para desenvolvimento',
    steps: [
      {
        title: 'Desenvolvimento Local (SQLite)',
        content: 'Para desenvolvimento local, use SQLite (já configurado no .env.local):',
        code: 'DATABASE_URL="file:./dev.db"',
      },
      {
        title: 'Produção: Supabase (Recomendado)',
        content: '1. Acesse supabase.com → "New Project"\n2. Preencha nome, senha e região (São Paulo)\n3. Vá em "Settings" → "Database"\n4. Copie a "Connection string" (URI)',
        link: { label: 'Criar projeto no Supabase', url: 'https://supabase.com' },
        code: 'DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"',
      },
      {
        title: 'Produção: Railway',
        content: '1. Acesse railway.app → "New Project" → "Provision PostgreSQL"\n2. Clique no banco → "Connect" → copie a DATABASE_URL',
        link: { label: 'Criar banco no Railway', url: 'https://railway.app' },
      },
      {
        title: 'Executar Migrações',
        content: 'Após configurar a DATABASE_URL, execute as migrações:',
        code: '# Gerar cliente Prisma\nnpm run db:generate\n\n# Aplicar schema no banco\nnpm run db:push\n\n# (Opcional) Criar dados iniciais\nnpm run db:seed',
      },
    ],
    envVars: ['DATABASE_URL'],
  },
  {
    id: 'env-file',
    title: '10. Arquivo .env Completo',
    icon: '⚙️',
    checkKey: 'nextauth',
    description: 'Template completo com todas as variáveis de ambiente necessárias',
    steps: [
      {
        title: 'Gerar NEXTAUTH_SECRET',
        content: 'Execute no terminal para gerar uma chave segura:',
        code: '# Linux/Mac\nopenssl rand -base64 32\n\n# Ou use este comando Node.js\nnode -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
      },
      {
        title: 'Arquivo .env.local Completo',
        content: 'Crie/atualize o arquivo .env.local na raiz do projeto com todas as variáveis:',
        code: `# ===== NEXTAUTH =====
NEXTAUTH_URL=https://seudominio.com
NEXTAUTH_SECRET=chave_super_secreta_32_chars_minimo

# ===== DATABASE =====
DATABASE_URL="postgresql://..."

# ===== GOOGLE OAUTH =====
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ===== DISCORD OAUTH =====
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

# ===== MERCADO PAGO (PIX) =====
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
MP_WEBHOOK_SECRET=

# ===== PAYPAL =====
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
PAYPAL_MODE=sandbox

# ===== PICPAY =====
PICPAY_TOKEN=
PICPAY_SELLER_TOKEN=

# ===== GOOGLE DRIVE (método "Conceder Permissão") =====
# client_email do arquivo JSON da service account
GOOGLE_SERVICE_ACCOUNT_EMAIL=darkshop-drive@seu-projeto.iam.gserviceaccount.com
# private_key do JSON — substitua quebras de linha por \n e envolva em aspas
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n"

# ===== EMAIL =====
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=noreply@seudominio.com

# ===== CLOUDINARY =====
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ===== SITE =====
NEXT_PUBLIC_SITE_URL=https://seudominio.com
NEXT_PUBLIC_SITE_NAME=DarkShop`,
      },
    ],
    envVars: ['NEXTAUTH_SECRET', 'NEXTAUTH_URL'],
  },
  {
    id: 'deploy',
    title: '11. Checklist de Deploy',
    icon: '🚀',
    checkKey: 'site_url',
    description: 'Verificações essenciais antes de ir para produção',
    steps: [
      {
        title: 'Pré-deploy: Variáveis de Ambiente',
        content: `Verifique cada item antes do deploy:

☐ NEXTAUTH_URL = URL de produção (não localhost)
☐ NEXTAUTH_SECRET = chave aleatória segura (min 32 chars)
☐ DATABASE_URL = banco PostgreSQL de produção
☐ Todos os tokens OAuth configurados
☐ Webhooks URLs atualizadas para domínio de produção
☐ OAuth callbacks atualizados no Google/Discord console
☐ Credenciais sandbox do PayPal → produção (PAYPAL_MODE=live)
☐ SSL/HTTPS ativo no domínio`,
      },
      {
        title: 'Deploy na Vercel (Recomendado)',
        content: '1. Acesse vercel.com → "Import Project" → connect GitHub\n2. Em "Environment Variables", adicione todas as variáveis\n3. Clique em "Deploy"\n4. Aguarde o build e acesse a URL gerada',
        link: { label: 'Fazer deploy na Vercel', url: 'https://vercel.com/new' },
        code: '# Ou via CLI\nnpm i -g vercel\nvercel --prod',
      },
      {
        title: 'Após Deploy: Testes Essenciais',
        content: `☐ Login com Google funcionando
☐ Login com Discord funcionando  
☐ Cadastro por email funcionando
☐ Listagem de produtos carregando
☐ Carrinho adicionando itens
☐ Checkout gerando pedido
☐ Webhook Mercado Pago recebendo (use ngrok para testar)
☐ Email de confirmação sendo enviado
☐ Link do Drive sendo entregue após pagamento
☐ [Conceder Permissão] Logs mostram "[DRIVE] Permissão concedida para..."
☐ [Conceder Permissão] E-mail do cliente aparece no compartilhamento do Drive`,
      },
      {
        title: 'Testar Webhooks em Produção',
        content: 'Para testar webhooks localmente, use ngrok:',
        code: '# Instalar ngrok\nnpm install -g ngrok\n\n# Expor porta local\nngrok http 3000\n\n# Use a URL gerada (ex: https://abc123.ngrok.io) nos webhooks\n# POST /api/webhooks/mercadopago',
      },
    ],
    envVars: ['NEXTAUTH_URL'],
  },
  {
    id: 'diagnostico',
    title: '12. Logs e Diagnóstico',
    icon: '🔍',
    checkKey: 'database',
    description: 'Monitorar webhooks e diagnosticar problemas em tempo real',
    steps: [
      {
        title: 'Logs de Webhooks',
        content: 'Acesse /admin para ver os últimos webhooks recebidos em tempo real no painel de Dashboard.\n\nTodos os webhooks são salvos na tabela WebhookLog com:\n• Provider (mercadopago/paypal/picpay)\n• EventType\n• Status (received/processed/error)\n• Payload completo',
      },
      {
        title: 'Teste de Conexão',
        content: 'Verifique a conexão com cada serviço acessando:',
        code: '# Testar NextAuth\nGET /api/auth/providers\n\n# Testar banco de dados\nGET /api/health (implementar)',
      },
      {
        title: 'Debug de Problemas Comuns',
        content: `Problemas comuns e soluções:

🔴 "NEXTAUTH_SECRET missing" → Adicione a variável no .env.local
🔴 Login Google não funciona → Verifique URLs de callback no console
🔴 Webhook não chega → Use ngrok para testar localmente
🔴 Banco não conecta → Verifique DATABASE_URL e execute db:push
🔴 Email não envia → Verifique SMTP e senha de app do Gmail
🔴 Drive não entrega → Verifique se GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_PRIVATE_KEY estão configurados
🔴 "[DRIVE] Falha ao conceder permissão" → Service account não é Editor do arquivo/pasta. Abra o Drive, compartilhe o arquivo com o e-mail do service account como "Editor"
🔴 GOOGLE_PRIVATE_KEY inválida → Certifique-se de que quebras de linha estão como \\n (dois caracteres) e mantenha as linhas BEGIN/END PRIVATE KEY
🔴 Drive API não autorizada → Ative a "Google Drive API" no Google Cloud Console → APIs e Serviços → Biblioteca`,
      },
      {
        title: 'Suporte e Recursos',
        content: 'Documentações oficiais para referência:',
        link: { label: 'NextAuth.js Docs', url: 'https://next-auth.js.org' },
      },
    ],
    envVars: [],
  },
]

function StatusIcon({ configured }: { configured: boolean | undefined }) {
  if (configured === undefined) return <AlertCircle size={18} className="text-white/30" />
  if (configured) return <CheckCircle size={18} className="text-green-400" />
  return <XCircle size={18} className="text-red-400" />
}

function CodeBlock({ code }: { code: string }) {
  const copyCode = () => {
    navigator.clipboard.writeText(code)
    toast.success('Código copiado!')
  }
  return (
    <div className="relative mt-3">
      <pre className="bg-black/60 border border-white/10 rounded-lg p-4 text-xs font-mono text-green-400 overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
      <button
        onClick={copyCode}
        className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white/60 hover:text-white transition-all"
        title="Copiar"
      >
        <Copy size={14} />
      </button>
    </div>
  )
}

function GuiaSection({
  section,
  isConfigured,
}: {
  section: GuiaSection
  isConfigured: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#0d0d0d] border rounded-xl overflow-hidden transition-all duration-200 ${
        isConfigured ? 'border-green-500/20' : 'border-white/10 hover:border-neon-pink/30'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-5 text-left"
      >
        <span className="text-2xl flex-shrink-0">{section.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-white text-sm sm:text-base">{section.title}</h3>
            {isConfigured ? (
              <span className="badge-green text-xs">✓ Configurado</span>
            ) : (
              <span className="badge-red text-xs">Pendente</span>
            )}
          </div>
          <p className="text-xs text-white/40 mt-0.5 truncate">{section.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusIcon configured={isConfigured} />
          {isOpen ? <ChevronDown size={16} className="text-white/40" /> : <ChevronRight size={16} className="text-white/40" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 border-t border-white/10">
              {/* Variáveis necessárias */}
              {section.envVars.length > 0 && (
                <div className="mt-4 mb-5">
                  <p className="text-xs text-white/40 mb-2">Variáveis necessárias:</p>
                  <div className="flex flex-wrap gap-2">
                    {section.envVars.map((v) => (
                      <code key={v} className="px-2 py-1 bg-neon-pink/10 border border-neon-pink/20 rounded text-neon-pink text-xs font-mono">
                        {v}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="space-y-6">
                {section.steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 bg-neon-pink/10 border border-neon-pink/30 rounded-full flex items-center justify-center text-neon-pink text-xs font-bold mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white mb-1">{step.title}</h4>
                      <p className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{step.content}</p>
                      {step.link && (
                        <a
                          href={step.link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-2 text-xs text-neon-pink hover:text-neon-rose transition-colors"
                        >
                          <ExternalLink size={12} />
                          {step.link.label}
                        </a>
                      )}
                      {step.code && <CodeBlock code={step.code} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function GuiaConfiguracaoClient({
  status,
  siteUrl,
}: {
  status: StatusData
  siteUrl: string
}) {
  const { checks, configured, total } = status
  const percentage = Math.round((configured / total) * 100)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-neon-pink/10 border border-neon-pink/30 rounded-xl flex items-center justify-center">
            <BookOpen size={20} className="text-neon-pink" />
          </div>
          <div>
            <h1 className="font-gothic text-2xl font-bold text-white">Guia de Configuração</h1>
            <p className="text-white/40 text-sm">Configure todas as integrações da sua loja</p>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-[#0d0d0d] border border-neon-pink/20 rounded-xl p-6" style={{
        boxShadow: '0 0 20px rgba(255,0,127,0.05)'
      }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white font-semibold">Progresso de Configuração</p>
            <p className="text-white/40 text-sm">{configured} de {total} seções configuradas</p>
          </div>
          <div className="text-4xl font-bold text-neon-pink font-gothic">{percentage}%</div>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #ff007f, #ff1493, #ff69b4)' }}
          />
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { key: 'google_oauth', label: 'Google OAuth' },
            { key: 'discord_oauth', label: 'Discord' },
            { key: 'mercadopago', label: 'Mercado Pago' },
            { key: 'paypal', label: 'PayPal' },
            { key: 'picpay', label: 'PicPay' },
            { key: 'google_drive', label: 'Google Drive' },
            { key: 'email', label: 'Email' },
            { key: 'database', label: 'Banco de Dados' },
          ].map((item) => (
            <div key={item.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              checks[item.key] ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/3 border border-white/10'
            }`}>
              {checks[item.key] ? (
                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
              ) : (
                <XCircle size={14} className="text-red-400/60 flex-shrink-0" />
              )}
              <span className="text-xs text-white/70 truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info sobre URL do site */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <Zap size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-white/80">URL do seu site detectada:</p>
          <code className="text-xs text-blue-400 font-mono">{siteUrl}</code>
          <p className="text-xs text-white/40 mt-1">Use esta URL ao configurar webhooks e callbacks OAuth</p>
        </div>
      </div>

      {/* Seções do Guia */}
      <div className="space-y-3">
        {SECTIONS.map((section) => (
          <GuiaSection
            key={section.id}
            section={section}
            isConfigured={checks[section.checkKey] ?? false}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="bg-[#0d0d0d] border border-white/10 rounded-xl p-6 text-center">
        <p className="text-white/40 text-sm">
          Precisa de ajuda? Consulte a{' '}
          <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer" className="text-neon-pink hover:text-neon-rose transition-colors">
            documentação do Next.js
          </a>
          {' '}e{' '}
          <a href="https://next-auth.js.org" target="_blank" rel="noopener noreferrer" className="text-neon-pink hover:text-neon-rose transition-colors">
            NextAuth.js
          </a>
        </p>
      </div>
    </div>
  )
}
