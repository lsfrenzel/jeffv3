from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from backend.database import get_db
from backend.models import Empresa, Prospeccao, Agendamento, Usuario, StatusAgendamento
from backend.auth.security import obter_usuario_atual

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def obter_estatisticas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    hoje = datetime.now().date()
    hoje_inicio = datetime.combine(hoje, datetime.min.time())
    hoje_fim = datetime.combine(hoje, datetime.max.time())
    
    if usuario.tipo == "admin":
        total_empresas = db.query(func.count(Empresa.id)).scalar()
        total_prospeccoes = db.query(func.count(Prospeccao.id)).scalar()
        
        prospeccoes_query = db.query(Prospeccao)
        agendamentos_query = db.query(Agendamento)
        empresas_query = db.query(Empresa)
    else:
        from backend.models import AtribuicaoEmpresa
        empresas_atribuidas_ids = db.query(AtribuicaoEmpresa.empresa_id).filter(
            AtribuicaoEmpresa.consultor_id == usuario.id
        ).all()
        empresas_ids = [emp[0] for emp in empresas_atribuidas_ids]
        
        total_empresas = len(empresas_ids)
        total_prospeccoes = db.query(func.count(Prospeccao.id)).filter(
            Prospeccao.consultor_id == usuario.id
        ).scalar()
        
        prospeccoes_query = db.query(Prospeccao).filter(Prospeccao.consultor_id == usuario.id)
        agendamentos_query = db.query(Agendamento).join(Prospeccao).filter(
            Prospeccao.consultor_id == usuario.id
        )
        empresas_query = db.query(Empresa).filter(Empresa.id.in_(empresas_ids)) if empresas_ids else None
    
    prospeccoes_por_resultado = {}
    if prospeccoes_query:
        resultados = db.query(
            Prospeccao.resultado,
            func.count(Prospeccao.id)
        ).filter(Prospeccao.resultado.isnot(None))
        
        if usuario.tipo != "admin":
            resultados = resultados.filter(Prospeccao.consultor_id == usuario.id)
        
        resultados = resultados.group_by(Prospeccao.resultado).all()
        
        for resultado, count in resultados:
            prospeccoes_por_resultado[resultado] = count
    
    agendamentos_pendentes = agendamentos_query.filter(
        Agendamento.status == StatusAgendamento.pendente
    )
    
    vencidos = agendamentos_pendentes.filter(Agendamento.data_agendada < hoje_inicio).all()
    hoje_agendamentos = agendamentos_pendentes.filter(
        Agendamento.data_agendada >= hoje_inicio,
        Agendamento.data_agendada <= hoje_fim
    ).all()
    futuros = agendamentos_pendentes.filter(Agendamento.data_agendada > hoje_fim).all()
    
    total_agendamentos = len(vencidos) + len(hoje_agendamentos) + len(futuros)
    
    empresas_por_estado = {}
    if empresas_query:
        estados = db.query(
            Empresa.estado,
            func.count(Empresa.id)
        ).filter(Empresa.estado.isnot(None))
        
        if usuario.tipo != "admin" and empresas_ids:
            estados = estados.filter(Empresa.id.in_(empresas_ids))
        
        estados = estados.group_by(Empresa.estado).all()
        
        for estado, count in estados:
            empresas_por_estado[estado] = count
    
    empresas_por_estado = dict(sorted(empresas_por_estado.items(), key=lambda x: x[1], reverse=True))
    
    return {
        "total_empresas": total_empresas,
        "total_prospeccoes": total_prospeccoes,
        "total_agendamentos": total_agendamentos,
        "prospeccoes_por_resultado": prospeccoes_por_resultado,
        "agendamentos_por_status": {
            "vencidos": len(vencidos),
            "hoje": len(hoje_agendamentos),
            "futuros": len(futuros)
        },
        "empresas_por_estado": empresas_por_estado,
        "alertas": {
            "vencidos": [{"id": a.id, "prospeccao_id": a.prospeccao_id, "data_agendada": a.data_agendada, "observacoes": a.observacoes} for a in vencidos],
            "hoje": [{"id": a.id, "prospeccao_id": a.prospeccao_id, "data_agendada": a.data_agendada, "observacoes": a.observacoes} for a in hoje_agendamentos],
            "futuros": [{"id": a.id, "prospeccao_id": a.prospeccao_id, "data_agendada": a.data_agendada, "observacoes": a.observacoes} for a in futuros]
        }
    }
