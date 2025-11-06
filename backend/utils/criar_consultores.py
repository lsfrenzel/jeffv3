from backend.database import SessionLocal
from backend.models import Usuario
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def criar_consultores_teste():
    """Cria os consultores Gabriel e Lucas para teste"""
    db = SessionLocal()
    try:
        consultores = [
            {
                "nome": "Gabriel Silva",
                "email": "gabriel@nucleo.com",
                "senha": "gabriel123",
                "tipo": "consultor"
            },
            {
                "nome": "Lucas Oliveira",
                "email": "lucas@nucleo.com",
                "senha": "lucas123",
                "tipo": "consultor"
            }
        ]
        
        for cons_data in consultores:
            consultor_existente = db.query(Usuario).filter(
                Usuario.email == cons_data["email"]
            ).first()
            
            if not consultor_existente:
                senha_hash = pwd_context.hash(cons_data["senha"])
                novo_consultor = Usuario(
                    nome=cons_data["nome"],
                    email=cons_data["email"],
                    senha_hash=senha_hash,
                    tipo=cons_data["tipo"]
                )
                db.add(novo_consultor)
                print(f"✓ Consultor criado: {cons_data['nome']} ({cons_data['email']})")
            else:
                print(f"⏭️ Consultor já existe: {cons_data['nome']}")
        
        db.commit()
        print("\n✅ Consultores criados com sucesso!")
        
    except Exception as e:
        print(f"❌ Erro ao criar consultores: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    criar_consultores_teste()
