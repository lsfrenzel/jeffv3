from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import date, datetime
from backend.database import get_db
from backend.models import CronogramaProjeto, CronogramaAtividade, Usuario, Empresa
from backend.schemas.cronograma import (
    CronogramaProjetoCriar, CronogramaProjetoResposta, CronogramaProjetoAtualizar,
    CronogramaAtividadeCriar, CronogramaAtividadeResposta, CronogramaAtividadeAtualizar,
    TimelineItem
)
from backend.auth.security import obter_usuario_atual

router = APIRouter(prefix="/api/cronograma", tags=["Cronograma"])


@router.get("/projetos", response_model=List[CronogramaProjetoResposta])
def listar_projetos(
    consultor_id: Optional[int] = None,
    empresa_id: Optional[int] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    query = db.query(CronogramaProjeto)
    
    if consultor_id:
        query = query.filter(CronogramaProjeto.consultor_id == consultor_id)
    
    if empresa_id:
        query = query.filter(CronogramaProjeto.empresa_id == empresa_id)
    
    if data_inicio:
        query = query.filter(CronogramaProjeto.data_inicio >= data_inicio)
    
    if data_fim:
        query = query.filter(CronogramaProjeto.data_termino <= data_fim)
    
    if status:
        query = query.filter(CronogramaProjeto.status == status)
    
    total = query.count()
    skip = (page - 1) * page_size
    projetos = query.order_by(CronogramaProjeto.data_inicio.desc()).offset(skip).limit(page_size).all()
    
    return projetos


@router.get("/projetos/{projeto_id}", response_model=CronogramaProjetoResposta)
def obter_projeto(
    projeto_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    projeto = db.query(CronogramaProjeto).filter(CronogramaProjeto.id == projeto_id).first()
    
    if not projeto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado"
        )
    
    return projeto


@router.post("/projetos", response_model=CronogramaProjetoResposta, status_code=status.HTTP_201_CREATED)
def criar_projeto(
    projeto: CronogramaProjetoCriar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    novo_projeto = CronogramaProjeto(**projeto.model_dump())
    
    db.add(novo_projeto)
    db.commit()
    db.refresh(novo_projeto)
    
    return novo_projeto


@router.put("/projetos/{projeto_id}", response_model=CronogramaProjetoResposta)
def atualizar_projeto(
    projeto_id: int,
    dados: CronogramaProjetoAtualizar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    projeto = db.query(CronogramaProjeto).filter(CronogramaProjeto.id == projeto_id).first()
    
    if not projeto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado"
        )
    
    dados_atualizacao = dados.model_dump(exclude_unset=True)
    for campo, valor in dados_atualizacao.items():
        setattr(projeto, campo, valor)
    
    projeto.data_atualizacao = datetime.utcnow()
    db.commit()
    db.refresh(projeto)
    
    return projeto


@router.delete("/projetos/{projeto_id}")
def deletar_projeto(
    projeto_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    projeto = db.query(CronogramaProjeto).filter(CronogramaProjeto.id == projeto_id).first()
    
    if not projeto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado"
        )
    
    db.delete(projeto)
    db.commit()
    
    return {"message": "Projeto deletado com sucesso"}


@router.get("/atividades", response_model=List[CronogramaAtividadeResposta])
def listar_atividades(
    projeto_id: Optional[int] = None,
    responsavel_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    query = db.query(CronogramaAtividade)
    
    if projeto_id:
        query = query.filter(CronogramaAtividade.projeto_id == projeto_id)
    
    if responsavel_id:
        query = query.filter(CronogramaAtividade.responsavel_id == responsavel_id)
    
    if status:
        query = query.filter(CronogramaAtividade.status == status)
    
    atividades = query.order_by(CronogramaAtividade.data_inicio).all()
    
    return atividades


@router.post("/atividades", response_model=CronogramaAtividadeResposta, status_code=status.HTTP_201_CREATED)
def criar_atividade(
    atividade: CronogramaAtividadeCriar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    projeto = db.query(CronogramaProjeto).filter(CronogramaProjeto.id == atividade.projeto_id).first()
    if not projeto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projeto não encontrado"
        )
    
    nova_atividade = CronogramaAtividade(**atividade.model_dump())
    
    db.add(nova_atividade)
    db.commit()
    db.refresh(nova_atividade)
    
    return nova_atividade


@router.put("/atividades/{atividade_id}", response_model=CronogramaAtividadeResposta)
def atualizar_atividade(
    atividade_id: int,
    dados: CronogramaAtividadeAtualizar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    atividade = db.query(CronogramaAtividade).filter(CronogramaAtividade.id == atividade_id).first()
    
    if not atividade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Atividade não encontrada"
        )
    
    dados_atualizacao = dados.model_dump(exclude_unset=True)
    for campo, valor in dados_atualizacao.items():
        setattr(atividade, campo, valor)
    
    atividade.data_atualizacao = datetime.utcnow()
    db.commit()
    db.refresh(atividade)
    
    return atividade


@router.delete("/atividades/{atividade_id}")
def deletar_atividade(
    atividade_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    atividade = db.query(CronogramaAtividade).filter(CronogramaAtividade.id == atividade_id).first()
    
    if not atividade:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Atividade não encontrada"
        )
    
    db.delete(atividade)
    db.commit()
    
    return {"message": "Atividade deletada com sucesso"}


@router.get("/timeline", response_model=List[TimelineItem])
def obter_timeline(
    consultor_id: Optional[int] = None,
    empresa_id: Optional[int] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    query = db.query(CronogramaProjeto).options(
        joinedload(CronogramaProjeto.empresa),
        joinedload(CronogramaProjeto.consultor)
    )
    
    if consultor_id:
        query = query.filter(CronogramaProjeto.consultor_id == consultor_id)
    
    if empresa_id:
        query = query.filter(CronogramaProjeto.empresa_id == empresa_id)
    
    if data_inicio:
        query = query.filter(CronogramaProjeto.data_termino >= data_inicio)
    
    if data_fim:
        query = query.filter(CronogramaProjeto.data_inicio <= data_fim)
    
    projetos = query.order_by(CronogramaProjeto.data_inicio).all()
    
    timeline = []
    for projeto in projetos:
        empresa_nome = projeto.empresa.empresa if projeto.empresa else projeto.sigla
        consultor_nome = projeto.consultor.nome if projeto.consultor else projeto.consultor_nome
        
        if projeto.data_inicio and projeto.data_termino:
            dias_totais = (projeto.data_termino - projeto.data_inicio).days
            dias_passados = (date.today() - projeto.data_inicio).days
            progresso = min(100, max(0, (dias_passados / dias_totais * 100) if dias_totais > 0 else 0))
            
            timeline.append(TimelineItem(
                id=projeto.id,
                titulo=f"{projeto.proposta or 'Sem proposta'} - {empresa_nome or 'Sem empresa'}",
                tipo="projeto",
                data_inicio=projeto.data_inicio,
                data_fim=projeto.data_termino,
                consultor_nome=consultor_nome,
                empresa_nome=empresa_nome,
                status=projeto.status.value,
                progresso=round(progresso, 1)
            ))
    
    return timeline
