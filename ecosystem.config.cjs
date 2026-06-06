// ecosystem.config.cjs — PM2 para Hostgator VPS / Node.js App
// Ajuste as variáveis ENV antes de usar em produção

module.exports = {
  apps: [
    {
      name: 'secretstore',
      // Com output:standalone, o entry point muda para .next/standalone/server.js
      script: '.next/standalone/server.js',
      cwd: '/home/SEU_USUARIO/public_html', // ← altere para o caminho real na Hostgator
      env: {
        NODE_ENV: 'production',
        PORT: 3000,                          // porta interna; Nginx/Apache faz proxy

        // ─── OBRIGATÓRIAS ──────────────────────────────────────────────
        DATABASE_URL: 'file:/home/SEU_USUARIO/public_html/data/production.db',
        NEXTAUTH_URL: 'https://seudominio.com.br',   // ← seu domínio real
        NEXTAUTH_SECRET: 'GERE_UMA_CHAVE_32_CHARS',  // use: openssl rand -base64 32
        NEXT_PUBLIC_SITE_URL: 'https://seudominio.com.br',
        NEXT_PUBLIC_SITE_NAME: 'Secret Store',

        // ─── OAUTH (opcional) ──────────────────────────────────────────
        GOOGLE_CLIENT_ID: '',
        GOOGLE_CLIENT_SECRET: '',
        DISCORD_CLIENT_ID: '',
        DISCORD_CLIENT_SECRET: '',

        // ─── PAGAMENTOS ────────────────────────────────────────────────
        MP_ACCESS_TOKEN: '',
        MP_PUBLIC_KEY: '',
        MP_WEBHOOK_SECRET: '',
        PAYPAL_CLIENT_ID: '',
        PAYPAL_CLIENT_SECRET: '',
        PAYPAL_WEBHOOK_ID: '',
        PAYPAL_MODE: 'live',           // 'sandbox' para testes
        PICPAY_TOKEN: '',
        PICPAY_SELLER_TOKEN: '',

        // ─── GOOGLE DRIVE ──────────────────────────────────────────────
        GOOGLE_SERVICE_ACCOUNT_EMAIL: '',
        GOOGLE_PRIVATE_KEY: '',

        // ─── EMAIL SMTP ────────────────────────────────────────────────
        EMAIL_HOST: 'mail.seudominio.com.br', // servidor SMTP da Hostgator
        EMAIL_PORT: '587',
        EMAIL_USER: 'noreply@seudominio.com.br',
        EMAIL_PASS: '',
        EMAIL_FROM: 'noreply@seudominio.com.br',

        // ─── CLOUDINARY ────────────────────────────────────────────────
        CLOUDINARY_CLOUD_NAME: '',
        CLOUDINARY_API_KEY: '',
        CLOUDINARY_API_SECRET: '',
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      error_file: '/home/SEU_USUARIO/logs/secretstore-error.log',
      out_file:   '/home/SEU_USUARIO/logs/secretstore-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
