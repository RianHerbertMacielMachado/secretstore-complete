#!/bin/sh
set -e

# Desbloqueia migrations "failed" que possam estar travadas no banco (P3009).
# Foram criadas por tentativas de sanitização de null bytes — agora removidas.
# O comando é seguro: não falha se a migration não existir no histórico.
node node_modules/prisma/build/index.js migrate resolve \
  --rolled-back 20260823170000_sanitize_null_bytes 2>/dev/null || true

node node_modules/prisma/build/index.js migrate resolve \
  --rolled-back 20260823180000_sanitize_null_bytes 2>/dev/null || true

# Aplica quaisquer migrations pendentes legítimas
node node_modules/prisma/build/index.js migrate deploy

# Inicia o servidor Next.js
exec env HOSTNAME="0.0.0.0" node server.js
