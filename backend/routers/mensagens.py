from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func
from typing import List
from datetime import datetime
from backend.database import get_db
from backend.models.mensagens import Mensagem
from backend.models import Usuario
from backend.schemas.mensagens import MensagemCriar, MensagemResposta, ConversaResumo, UsuarioSimples
from backend.auth.security import obter_usuario_atual

router = APIRouter(prefix="/api/mensagens", tags=["Mensagens"])

@router.post("/", response_model=MensagemResposta)
def enviar_mensagem(
    mensagem: MensagemCriar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    destinatario = db.query(Usuario).filter(Usuario.id == mensagem.destinatario_id).first()
    if not destinatario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destinatário não encontrado"
        )
    
    nova_mensagem = Mensagem(
        remetente_id=usuario.id,
        destinatario_id=mensagem.destinatario_id,
        conteudo=mensagem.conteudo
    )
    
    db.add(nova_mensagem)
    db.commit()
    db.refresh(nova_mensagem)
    
    mensagem_completa = db.query(Mensagem).options(
        joinedload(Mensagem.remetente),
        joinedload(Mensagem.destinatario)
    ).filter(Mensagem.id == nova_mensagem.id).first()
    
    return mensagem_completa

@router.get("/conversas", response_model=List[ConversaResumo])
def listar_conversas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    todas_mensagens = db.query(Mensagem).options(
        joinedload(Mensagem.remetente),
        joinedload(Mensagem.destinatario)
    ).filter(
        or_(
            Mensagem.remetente_id == usuario.id,
            Mensagem.destinatario_id == usuario.id
        )
    ).order_by(Mensagem.data_envio.desc()).all()
    
    conversas_dict = {}
    
    for msg in todas_mensagens:
        outro_usuario_id = msg.destinatario_id if msg.remetente_id == usuario.id else msg.remetente_id
        
        if outro_usuario_id not in conversas_dict:
            outro_usuario = msg.destinatario if msg.remetente_id == usuario.id else msg.remetente
            
            nao_lidas = db.query(Mensagem).filter(
                and_(
                    Mensagem.remetente_id == outro_usuario_id,
                    Mensagem.destinatario_id == usuario.id,
                    Mensagem.lida == False
                )
            ).count()
            
            conversas_dict[outro_usuario_id] = ConversaResumo(
                usuario=UsuarioSimples.model_validate(outro_usuario),
                ultima_mensagem=msg.conteudo,
                data_ultima_mensagem=msg.data_envio,
                mensagens_nao_lidas=nao_lidas
            )
    
    conversas = list(conversas_dict.values())
    return sorted(conversas, key=lambda x: x.data_ultima_mensagem or datetime.min, reverse=True)

@router.get("/conversa/{usuario_id}", response_model=List[MensagemResposta])
def obter_conversa(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    mensagens = db.query(Mensagem).options(
        joinedload(Mensagem.remetente),
        joinedload(Mensagem.destinatario)
    ).filter(
        or_(
            and_(Mensagem.remetente_id == usuario.id, Mensagem.destinatario_id == usuario_id),
            and_(Mensagem.remetente_id == usuario_id, Mensagem.destinatario_id == usuario.id)
        )
    ).order_by(Mensagem.data_envio.asc()).all()
    
    db.query(Mensagem).filter(
        and_(
            Mensagem.remetente_id == usuario_id,
            Mensagem.destinatario_id == usuario.id,
            Mensagem.lida == False
        )
    ).update({Mensagem.lida: True, Mensagem.data_leitura: datetime.utcnow()})
    db.commit()
    
    return mensagens

@router.get("/nao-lidas/contagem")
def contar_nao_lidas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    count = db.query(Mensagem).filter(
        and_(
            Mensagem.destinatario_id == usuario.id,
            Mensagem.lida == False
        )
    ).count()
    
    return {"count": count}

@router.put("/{mensagem_id}/marcar-lida")
def marcar_como_lida(
    mensagem_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    mensagem = db.query(Mensagem).filter(
        Mensagem.id == mensagem_id,
        Mensagem.destinatario_id == usuario.id
    ).first()
    
    if not mensagem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mensagem não encontrada"
        )
    
    mensagem.lida = True
    mensagem.data_leitura = datetime.utcnow()
    db.commit()
    
    return {"message": "Mensagem marcada como lida"}
