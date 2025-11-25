#!/bin/bash

# Script para iniciar a aplicação no Railway
# Executa as migrações do banco de dados e depois inicia o servidor

echo "🔄 Executando migrações do banco de dados..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Migrações concluídas com sucesso!"
else
    echo "❌ Erro ao executar migrações!"
    exit 1
fi

echo "🚀 Iniciando servidor..."
uvicorn main:app --host 0.0.0.0 --port ${PORT:-5000}
