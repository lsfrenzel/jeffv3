#!/bin/bash

# Script para iniciar a aplicação no Railway
# Executa as migrações do banco de dados e depois inicia o servidor

echo "========================================="
echo "🚀 Iniciando aplicação Núcleo 1.03"
echo "========================================="

echo ""
echo "🔍 Verificando variáveis de ambiente..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL não configurada!"
    exit 1
fi

echo "✅ DATABASE_URL configurada: ${DATABASE_URL:0:30}..."
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
