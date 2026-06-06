#!/bin/bash
# =============================================================================
# deploy.sh — Script de deploy para Hostgator VPS
# Uso: bash deploy.sh
# =============================================================================

set -e  # para em caso de erro

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        SECRET STORE — Deploy Hostgator       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ─── CONFIGURAÇÕES ──────────────────────────────────────────────────────────
APP_DIR="$HOME/public_html"        # pasta raiz na Hostgator
DATA_DIR="$HOME/data"              # banco de dados fora do public_html
LOGS_DIR="$HOME/logs"
APP_NAME="secretstore"
NODE_VERSION="20"                  # versão mínima do Node.js
# ─────────────────────────────────────────────────────────────────────────────

# Cor para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

# 1. Verificar Node.js
echo "── [1/8] Verificando Node.js ──────────────────"
if ! command -v node &>/dev/null; then
  fail "Node.js não encontrado. Instale via NVM (veja o guia)."
fi
NODE_CURRENT=$(node -v | tr -d 'v' | cut -d. -f1)
if [ "$NODE_CURRENT" -lt "$NODE_VERSION" ]; then
  fail "Node.js $NODE_CURRENT encontrado. Mínimo: $NODE_VERSION. Atualize via NVM."
fi
ok "Node.js $(node -v) — OK"

# 2. Verificar PM2
echo ""
echo "── [2/8] Verificando PM2 ──────────────────────"
if ! command -v pm2 &>/dev/null; then
  warn "PM2 não encontrado. Instalando..."
  npm install -g pm2
fi
ok "PM2 $(pm2 -v) — OK"

# 3. Criar diretórios necessários
echo ""
echo "── [3/8] Criando diretórios ───────────────────"
mkdir -p "$DATA_DIR" "$LOGS_DIR"
ok "Diretórios criados: $DATA_DIR | $LOGS_DIR"

# 4. Instalar dependências
echo ""
echo "── [4/8] Instalando dependências ──────────────"
cd "$APP_DIR"
npm ci --production=false
ok "npm install concluído"

# 5. Gerar Prisma Client
echo ""
echo "── [5/8] Gerando Prisma Client ────────────────"
npx prisma generate
ok "Prisma Client gerado"

# 6. Aplicar migrations do banco
echo ""
echo "── [6/8] Aplicando migrations do banco ────────"
DATABASE_URL="file:$DATA_DIR/production.db" npx prisma migrate deploy 2>/dev/null || \
DATABASE_URL="file:$DATA_DIR/production.db" npx prisma db push --accept-data-loss
ok "Banco de dados atualizado: $DATA_DIR/production.db"

# 7. Build Next.js
echo ""
echo "── [7/8] Fazendo build do Next.js ─────────────"
npm run build
# Copiar arquivos estáticos para o diretório standalone
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
ok "Build concluído — .next/standalone pronto"

# 8. Iniciar/reiniciar com PM2
echo ""
echo "── [8/8] Iniciando aplicação com PM2 ──────────"
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
ok "PM2 iniciado: $APP_NAME"

# Resultado final
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║            DEPLOY CONCLUÍDO ✓                ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Status PM2:     pm2 status"
echo "  Logs:           pm2 logs $APP_NAME"
echo "  Reiniciar:      pm2 restart $APP_NAME"
echo "  Parar:          pm2 stop $APP_NAME"
echo ""
pm2 status
