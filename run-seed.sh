#!/bin/bash

# Script para criar admin e dados iniciais no Railway
# Uso: ./run-seed.sh

echo "🌱 Criando usuário admin e dados iniciais..."
echo ""

# Opção 1: Via Railway CLI (Recomendado)
if command -v railway &> /dev/null; then
    echo "✅ Railway CLI encontrado"
    echo "Executando seed via Railway..."
    railway run psql -f create-admin.sql
else
    echo "❌ Railway CLI não encontrado"
    echo ""
    echo "Instale com: npm install -g @railway/cli"
    echo "Depois execute: railway login"
    echo ""
    echo "Ou execute manualmente:"
    echo "  railway connect Postgres"
    echo "  Depois copie e cole o conteúdo de create-admin.sql"
    exit 1
fi

echo ""
echo "✅ Seed concluído!"
echo ""
echo "Credenciais de admin:"
echo "  Email: admin@darkshop.com"
echo "  Senha: admin123"
echo ""
echo "⚠️  IMPORTANTE: Mude a senha após o primeiro login!"

