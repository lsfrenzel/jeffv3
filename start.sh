#!/bin/bash

# Script para iniciar a aplicação no Railway
# Executa as migrações do banco de dados e depois inicia o servidor

set -e  # Exit on any error

echo "🔍 Verificando variáveis de ambiente..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não configurada!"
    exit 1
fi

echo "✅ DATABASE_URL configurada"

echo "🔄 Executando migrações do banco de dados..."
alembic upgrade head || {
    echo "❌ Erro ao executar migrações!"
    echo "Tentando continuar mesmo assim..."
}

echo "✅ Migrações processadas"

echo "🚀 Iniciando servidor na porta ${PORT:-8000}..."
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1
