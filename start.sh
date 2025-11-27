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

# Verificar e preparar banco de dados
echo ""
echo "Verificando estado do banco de dados..."

python << 'PYEOF'
import os
import sys
from sqlalchemy import create_engine, text, inspect

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        has_alembic = 'alembic_version' in tables
        has_usuarios = 'usuarios' in tables
        
        if has_alembic:
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            version = result.scalar()
            print(f"INFO: Alembic version encontrada: {version}")
            if not version:
                print("AVISO: Tabela alembic_version existe mas sem versao")
        elif has_usuarios:
            # Database exists from before Alembic was introduced
            # Need to stamp it with the correct version
            print("INFO: Banco existente sem Alembic detectado")
            print("INFO: Aplicando stamp da versao atual...")
            
            # Create alembic_version table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS alembic_version (
                    version_num VARCHAR(32) NOT NULL,
                    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
                )
            """))
            
            # Check current schema to determine the right version to stamp
            # If mensagens has 'tipo' column, we're at d746a8d81c84
            # Otherwise we're at bf387194a72b
            result = conn.execute(text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'mensagens' AND column_name = 'tipo'
            """))
            has_tipo_column = result.fetchone() is not None
            
            if has_tipo_column:
                stamp_version = 'd746a8d81c84'
                print(f"INFO: Schema tem coluna 'tipo' em mensagens, stamp: {stamp_version}")
            else:
                stamp_version = 'bf387194a72b'
                print(f"INFO: Schema nao tem coluna 'tipo' em mensagens, stamp: {stamp_version}")
            
            # Clear any existing version and insert the correct one
            conn.execute(text("DELETE FROM alembic_version"))
            conn.execute(text(f"INSERT INTO alembic_version (version_num) VALUES ('{stamp_version}')"))
            conn.commit()
            print(f"INFO: Stamp aplicado: {stamp_version}")
        else:
            print("INFO: Banco de dados vazio, migracao completa sera executada")
            
except Exception as e:
    print(f"ERRO durante verificacao do banco: {e}")
    sys.exit(1)

print("INFO: Verificacao do banco concluida")
PYEOF

# Verificar se o script Python foi bem sucedido
if [ $? -ne 0 ]; then
    echo "ERRO: Falha na verificacao do banco de dados!"
    exit 1
fi

# Executar migracoes - deve ter sucesso
echo ""
echo "Executando migracoes do banco de dados..."
python -m alembic upgrade head

if [ $? -ne 0 ]; then
    echo "ERRO: Falha nas migracoes do banco de dados!"
    exit 1
fi

echo "INFO: Migracoes executadas com sucesso"

# Iniciar servidor
echo ""
echo "========================================="
echo "Iniciando servidor Uvicorn na porta $PORT..."
echo "========================================="

exec python -m uvicorn main:app --host 0.0.0.0 --port "$PORT" --log-level info
