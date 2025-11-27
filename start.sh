#!/bin/bash

echo "========================================="
echo "Iniciando aplicacao Nucleo 1.03"
echo "========================================="

# Ativar ambiente virtual do Nixpacks (Railway)
if [ -d "/opt/venv" ]; then
    echo "Ativando ambiente virtual Python..."
    source /opt/venv/bin/activate
fi

# Verificar DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "ERRO: DATABASE_URL nao configurada!"
    exit 1
fi
echo "DATABASE_URL: configurada"

# Definir porta
export PORT="${PORT:-8000}"
echo "PORT: $PORT"

# Iniciar servidor diretamente
echo ""
echo "========================================="
echo "Iniciando servidor Uvicorn na porta $PORT..."
echo "========================================="

exec python -m uvicorn main:app --host 0.0.0.0 --port "$PORT" --log-level info
