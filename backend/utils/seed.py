from sqlalchemy.orm import Session
from backend.models import Usuario, TipoUsuario
from backend.auth.security import obter_hash_senha
import os

def criar_usuario_admin_padrao(db: Session):
    admin_email = os.getenv("ADMIN_EMAIL", "admin@admin.com")
    admin_senha = os.getenv("ADMIN_PASSWORD", "admin123")
    admin_nome = os.getenv("ADMIN_NAME", "Administrador")
    
    usuario_existente = db.query(Usuario).filter(Usuario.email == admin_email).first()
    
    if not usuario_existente:
        admin_usuario = Usuario(
            nome=admin_nome,
            email=admin_email,
            senha_hash=obter_hash_senha(admin_senha),
            tipo=TipoUsuario.admin
        )
        db.add(admin_usuario)
        db.commit()
        db.refresh(admin_usuario)
        print(f"✓ Usuário admin criado: {admin_email}")
        return admin_usuario
    else:
        print(f"✓ Usuário admin já existe: {admin_email}")
        return usuario_existente
