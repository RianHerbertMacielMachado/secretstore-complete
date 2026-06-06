module.exports = {
  apps: [
    {
      name: 'darkshop',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: 'file:./dev.db',
        NEXTAUTH_URL: 'https://3000-iiepfgb47e8qsponetvzl-583b4d74.sandbox.novita.ai',
        NEXTAUTH_SECRET: 'darkshop_secret_key_change_in_production_32_chars_min',
        NEXT_PUBLIC_SITE_URL: 'https://3000-iiepfgb47e8qsponetvzl-583b4d74.sandbox.novita.ai',
        NEXT_PUBLIC_SITE_NAME: 'DarkShop',
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
    },
  ],
}
