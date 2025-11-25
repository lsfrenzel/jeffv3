from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import sys

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERRO CRÍTICO: Variável de ambiente DATABASE_URL não configurada!")
    print("Configure DATABASE_URL antes de iniciar a aplicação.")
    sys.exit(1)

print(f"🔗 Conectando ao banco de dados...")

# Configurações para melhor compatibilidade com Railway/Postgres
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verifica conexões antes de usar
    pool_recycle=300,     # Reconecta a cada 5 minutos
    connect_args={
        "connect_timeout": 10,
        "options": "-c timezone=utc"
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

print("✅ Configuração do banco de dados concluída")
