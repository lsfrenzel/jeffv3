from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import Usuario, TipoUsuario
from backend.schemas.usuarios import UsuarioCriar, UsuarioResposta
from backend.auth.security import obter_usuario_admin, obter_hash_senha

router = APIRouter(prefix="/api/admin", tags=["Administração"])

@router.get("/usuarios", response_model=List[UsuarioResposta])
def listar_usuarios(
    db: Session = Depends(get_db),
    admin: Usuario = Depends(obter_usuario_admin)
):
    usuarios = db.query(Usuario).all()
    return usuarios

@router.post("/usuarios", response_model=UsuarioResposta)
def criar_usuario(
    usuario: UsuarioCriar,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(obter_usuario_admin)
):
    db_usuario = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if db_usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    novo_usuario = Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=obter_hash_senha(usuario.senha),
        tipo=usuario.tipo if usuario.tipo else TipoUsuario.consultor
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario

@router.delete("/usuarios/{usuario_id}")
def deletar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(obter_usuario_admin)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    if usuario.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você não pode deletar sua própria conta"
        )
    
    db.delete(usuario)
    db.commit()
    return {"message": "Usuário deletado com sucesso"}

@router.put("/usuarios/{usuario_id}/tipo")
def atualizar_tipo_usuario(
    usuario_id: int,
    tipo: str,
    db: Session = Depends(get_db),
    admin: Usuario = Depends(obter_usuario_admin)
):
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    if tipo not in [TipoUsuario.admin.value, TipoUsuario.consultor.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de usuário inválido"
        )
    
    usuario.tipo = tipo
    db.commit()
    db.refresh(usuario)
    return usuario
