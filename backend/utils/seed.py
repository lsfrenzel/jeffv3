from sqlalchemy.orm import Session
from backend.models import Usuario, TipoUsuario
from backend.models.empresas import Empresa
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

def criar_consultores_padrao(db: Session):
    """Cria consultores Gabriel e Lucas para teste"""
    consultores = [
        {
            "nome": "Gabriel Silva",
            "email": "gabriel@nucleo.com",
            "senha": "gabriel123",
            "tipo": TipoUsuario.consultor
        },
        {
            "nome": "Lucas Oliveira",
            "email": "lucas@nucleo.com",
            "senha": "lucas123",
            "tipo": TipoUsuario.consultor
        }
    ]
    
    consultores_criados = 0
    for cons_data in consultores:
        consultor_existente = db.query(Usuario).filter(Usuario.email == cons_data["email"]).first()
        
        if not consultor_existente:
            novo_consultor = Usuario(
                nome=cons_data["nome"],
                email=cons_data["email"],
                senha_hash=obter_hash_senha(cons_data["senha"]),
                tipo=cons_data["tipo"]
            )
            db.add(novo_consultor)
            consultores_criados += 1
    
    if consultores_criados > 0:
        db.commit()
        print(f"✓ {consultores_criados} consultores criados")
    else:
        print(f"✓ Consultores já existem no banco")

def criar_empresas_padrao(db: Session):
    """Cria empresas padrão que permanecerão fixas no banco"""
    empresas_padrao = [
        {
            "empresa": "Petrobras S.A.",
            "cnpj": "33000167000101",
            "sigla": "PETRO",
            "porte": "Grande",
            "municipio": "Rio de Janeiro",
            "estado": "RJ",
            "pais": "Brasil",
            "area": "Petróleo e Gás",
            "tipo_empresa": "S.A.",
            "numero_funcionarios": 45000
        },
        {
            "empresa": "Vale S.A.",
            "cnpj": "33592510000154",
            "sigla": "VALE",
            "porte": "Grande",
            "municipio": "Rio de Janeiro",
            "estado": "RJ",
            "pais": "Brasil",
            "area": "Mineração",
            "tipo_empresa": "S.A.",
            "numero_funcionarios": 70000
        },
        {
            "empresa": "Banco do Brasil S.A.",
            "cnpj": "00000000000191",
            "sigla": "BB",
            "porte": "Grande",
            "municipio": "Brasília",
            "estado": "DF",
            "pais": "Brasil",
            "area": "Financeiro",
            "tipo_empresa": "S.A.",
            "numero_funcionarios": 90000
        },
        {
            "empresa": "Bradesco S.A.",
            "cnpj": "60746948000112",
            "sigla": "BRADESCO",
            "porte": "Grande",
            "municipio": "Osasco",
            "estado": "SP",
            "pais": "Brasil",
            "area": "Financeiro",
            "tipo_empresa": "S.A.",
            "numero_funcionarios": 85000
        },
        {
            "empresa": "Ambev S.A.",
            "cnpj": "07526557000100",
            "sigla": "AMBEV",
            "porte": "Grande",
            "municipio": "São Paulo",
            "estado": "SP",
            "pais": "Brasil",
            "area": "Bebidas",
            "tipo_empresa": "S.A.",
            "numero_funcionarios": 32000
        }
    ]
    
    empresas_criadas = 0
    for empresa_data in empresas_padrao:
        empresa_existente = db.query(Empresa).filter(Empresa.cnpj == empresa_data["cnpj"]).first()
        
        if not empresa_existente:
            nova_empresa = Empresa(**empresa_data)
            db.add(nova_empresa)
            empresas_criadas += 1
    
    if empresas_criadas > 0:
        db.commit()
        print(f"✓ {empresas_criadas} empresas padrão criadas")
    else:
        print(f"✓ Empresas padrão já existem no banco")
