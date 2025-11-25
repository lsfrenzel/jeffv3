#!/bin/bash
set -e

echo "========================================="
echo "Iniciando aplicacao Nucleo 1.03"
echo "========================================="

# Ativar ambiente virtual do Nixpacks (Railway)
if [ -d "/opt/venv" ]; then
    echo "Ativando ambiente virtual Python..."
    source /opt/venv/bin/activate
    echo "Python: $(which python)"
    echo "Pip: $(which pip)"
fi

# Verificar DATABASE_URL
echo ""
echo "Verificando variaveis de ambiente..."
if [ -z "$DATABASE_URL" ]; then
    echo "ERRO: DATABASE_URL nao configurada!"
    exit 1
fi
echo "DATABASE_URL: configurada"

# Gerar SESSION_SECRET se nao existir
if [ -z "$SESSION_SECRET" ]; then
    export SESSION_SECRET=$(python -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || echo "fallback-secret-key-change-in-production")
    echo "SESSION_SECRET: gerada automaticamente"
else
    echo "SESSION_SECRET: configurada"
fi

# Definir porta
export PORT="${PORT:-8000}"
echo "PORT: $PORT"

# Executar migracoes
echo ""
echo "Executando migracoes do banco de dados..."
python -m alembic upgrade head || echo "Migracoes falharam (tabelas podem ja existir)"

# Iniciar servidor
echo ""
echo "========================================="
echo "Iniciando servidor Uvicorn na porta $PORT..."
echo "========================================="

exec python -m uvicorn main:app --host 0.0.0.0 --port "$PORT" --log-level info
