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
        NEXTAUTH_URL: 'http://localhost:3000',
        NEXTAUTH_SECRET: 'darkshop_secret_key_change_in_production_32chars',
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
    },
  ],
}
