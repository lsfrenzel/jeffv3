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
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

try:
    with engine.connect() as conn:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        has_alembic = 'alembic_version' in tables
        has_usuarios = 'usuarios' in tables
        has_empresas = 'empresas' in tables
        
        print(f"INFO: Tabelas encontradas: {len(tables)}")
        print(f"INFO: alembic_version: {has_alembic}, usuarios: {has_usuarios}, empresas: {has_empresas}")
        
        if has_alembic:
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            version = result.scalar()
            print(f"INFO: Alembic version encontrada: {version}")
            if version:
                # Database is already migrated, just verify
                print("INFO: Banco de dados ja migrado, pulando migracao")
                with open('/tmp/skip_migration', 'w') as f:
                    f.write('skip')
            else:
                print("AVISO: Tabela alembic_version existe mas sem versao, sera atualizada")
        elif has_usuarios and has_empresas:
            # Database exists with tables but no alembic tracking
            # Need to stamp it with the correct version
            print("INFO: Banco existente sem Alembic detectado")
            print("INFO: Verificando schema atual...")
            
            # Create alembic_version table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS alembic_version (
                    version_num VARCHAR(32) NOT NULL,
                    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
                )
            """))
            conn.commit()
            
            # Check current schema to determine the right version to stamp
            # If grupos_chat exists, we're at d746a8d81c84
            has_grupos_chat = 'grupos_chat' in tables
            
            if has_grupos_chat:
                stamp_version = 'd746a8d81c84'
                print(f"INFO: Schema tem tabela 'grupos_chat', stamp: {stamp_version}")
            else:
                # Check if mensagens has tipo column
                try:
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
                        print(f"INFO: Schema sem modificacoes de chat, stamp: {stamp_version}")
                except:
                    stamp_version = 'bf387194a72b'
                    print(f"INFO: Usando stamp padrao: {stamp_version}")
            
            # Clear any existing version and insert the correct one
            conn.execute(text("DELETE FROM alembic_version"))
            conn.execute(text(f"INSERT INTO alembic_version (version_num) VALUES ('{stamp_version}')"))
            conn.commit()
            print(f"INFO: Stamp aplicado: {stamp_version}")
            
            # Skip migration since we stamped it
            with open('/tmp/skip_migration', 'w') as f:
                f.write('skip')
        else:
            print("INFO: Banco de dados vazio ou incompleto, criando tabelas...")
            # Import models and create all tables
            from backend.database import Base
            from backend.models import Usuario, Empresa, Prospeccao, Agendamento, AtribuicaoEmpresa, Notificacao, Mensagem, CronogramaProjeto, CronogramaAtividade, Stage, CompanyPipeline, CompanyStageHistory, Note, Attachment, Activity, StatusUsuario, GrupoChat, MembroGrupo, MensagemGrupo, LeituraGrupo
            
            Base.metadata.create_all(bind=engine)
            print("INFO: Tabelas criadas com sucesso")
            
            # Stamp with latest version
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS alembic_version (
                    version_num VARCHAR(32) NOT NULL,
                    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
                )
            """))
            conn.execute(text("DELETE FROM alembic_version"))
            conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('d746a8d81c84')"))
            conn.commit()
            print("INFO: Stamp aplicado: d746a8d81c84")
            
            # Skip migration since we created everything
            with open('/tmp/skip_migration', 'w') as f:
                f.write('skip')
            
except Exception as e:
    print(f"ERRO durante verificacao do banco: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("INFO: Verificacao do banco concluida")
PYEOF

# Verificar se o script Python foi bem sucedido
if [ $? -ne 0 ]; then
    echo "ERRO: Falha na verificacao do banco de dados!"
    exit 1
fi

# Executar migracoes apenas se necessario
echo ""
if [ -f /tmp/skip_migration ]; then
    echo "INFO: Pulando migracoes (banco ja esta atualizado)"
    rm -f /tmp/skip_migration
else
    echo "Executando migracoes do banco de dados..."
    python -m alembic upgrade head || {
        echo "AVISO: Migracao falhou, tentando criar tabelas diretamente..."
        python -c "
from backend.database import engine, Base
from backend.models import Usuario, Empresa, Prospeccao, Agendamento, AtribuicaoEmpresa, Notificacao, Mensagem, CronogramaProjeto, CronogramaAtividade, Stage, CompanyPipeline, CompanyStageHistory, Note, Attachment, Activity, StatusUsuario, GrupoChat, MembroGrupo, MensagemGrupo, LeituraGrupo
Base.metadata.create_all(bind=engine)
print('INFO: Tabelas criadas diretamente')
"
    }
fi

echo "INFO: Banco de dados pronto"

# Iniciar servidor
echo ""
echo "========================================="
echo "Iniciando servidor Uvicorn na porta $PORT..."
echo "========================================="

exec python -m uvicorn main:app --host 0.0.0.0 --port "$PORT" --log-level info
