# ============================================================
# Stage 1: deps — instala TODAS as dependências (incluindo dev)
# ============================================================
FROM node:18-alpine AS deps

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copia apenas os arquivos de dependências
COPY package.json package-lock.json ./

# Instala tudo do zero — sem cache externo, sem postinstall problems
RUN npm ci --legacy-peer-deps

# ============================================================
# Stage 2: builder — gera Prisma Client e faz o build Next.js
# ============================================================
FROM node:18-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copia node_modules já instalados do stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copia o restante do código
COPY . .

# Gera o Prisma Client (node_modules já existe, prisma/build/index.js presente)
RUN node node_modules/prisma/build/index.js generate

# Build do Next.js
RUN npm run build

# ============================================================
# Stage 3: runner — imagem final mínima para produção
# ============================================================
FROM node:18-alpine AS runner

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cria usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os arquivos necessários para rodar em produção
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copia o output standalone do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Resolve qualquer migration "failed" que possa estar travada no banco (P3009),
# depois aplica as migrations pendentes e inicia o servidor.
# O --resolve rolled-back é idempotente: não faz nada se não houver migration failed.
CMD node node_modules/prisma/build/index.js migrate resolve --rolled-back 20260823170000_sanitize_null_bytes 2>/dev/null || true && \
    node node_modules/prisma/build/index.js migrate deploy && \
    HOSTNAME="0.0.0.0" node server.js
