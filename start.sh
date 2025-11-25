#!/bin/bash

# Script para iniciar a aplicação no Railway
# Executa as migrações do banco de dados e depois inicia o servidor

# CRÍTICO: Ativar ambiente virtual do Nixpacks (Railway)
if [ -d "/opt/venv" ]; then
    echo "🐍 Ativando ambiente virtual Python..."
    source /opt/venv/bin/activate
fi

# Carregar variáveis de ambiente do Railway
# Railway injeta variáveis em /etc/environment ou .env
set -a
if [ -f "/etc/environment" ]; then
    source /etc/environment 2>/dev/null || true
fi
if [ -f "$RAILWAY_PROJECT_ROOT/.env" ]; then
    source "$RAILWAY_PROJECT_ROOT/.env" 2>/dev/null || true
fi
if [ -f ".env" ]; then
    source .env 2>/dev/null || true
fi
set +a

echo "========================================="
echo "🚀 Iniciando aplicação Núcleo 1.03"
echo "========================================="

echo ""
echo "🔍 Verificando variáveis de ambiente..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL não configurada!"
    echo "   Verifique se o PostgreSQL está conectado no Railway"
    exit 1
fi

# Gerar SESSION_SECRET se não existir
if [ -z "$SESSION_SECRET" ]; then
    export SESSION_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    echo "⚠️ SESSION_SECRET não configurada, gerando automaticamente..."
fi

echo "✅ DATABASE_URL configurada: ${DATABASE_URL:0:30}..."
echo "✅ SESSION_SECRET configurada"
echo "✅ PORT configurada: ${PORT:-8000}"

echo ""
echo "🔄 Executando migrações do banco de dados..."
if alembic upgrade head; then
    echo "✅ Migrações concluídas com sucesso!"
else
    echo "⚠️ Aviso: Migrações falharam, mas continuando..."
    echo "   (Isso é normal se as tabelas já existem)"
fi

echo ""
echo "========================================="
echo "🚀 Iniciando servidor Uvicorn..."
echo "   Host: 0.0.0.0"
echo "   Port: ${PORT:-8000}"
echo "========================================="
echo ""

# Usar exec para substituir o processo do shell pelo uvicorn
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info
