from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import Prospeccao, Usuario, Empresa, Agendamento
from backend.models.agendamentos import StatusAgendamento
from backend.schemas.prospeccoes import ProspeccaoCriar, ProspeccaoResposta
from backend.auth.security import obter_usuario_atual, obter_usuario_admin
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from io import BytesIO
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/prospeccoes", tags=["Prospecções"])

@router.post("/", response_model=ProspeccaoResposta)
def criar_prospeccao(
    prospeccao: ProspeccaoCriar,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    empresa = db.query(Empresa).filter(Empresa.id == prospeccao.empresa_id).first()
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    consultor = db.query(Usuario).filter(Usuario.id == prospeccao.consultor_id).first()
    if not consultor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultor não encontrado"
        )
    
    if usuario.tipo != "admin" and usuario.id != prospeccao.consultor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode criar prospecções para si mesmo"
        )
    
    nova_prospeccao = Prospeccao(**prospeccao.model_dump())
    db.add(nova_prospeccao)
    db.commit()
    db.refresh(nova_prospeccao)
    return nova_prospeccao

@router.get("/", response_model=List[ProspeccaoResposta])
def listar_prospeccoes(
    skip: int = 0,
    limit: int = 100,
    empresa_id: int = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    query = db.query(Prospeccao)
    
    if usuario.tipo != "admin":
        query = query.filter(Prospeccao.consultor_id == usuario.id)
    
    if empresa_id:
        query = query.filter(Prospeccao.empresa_id == empresa_id)
    
    prospeccoes = query.offset(skip).limit(limit).all()
    return prospeccoes

@router.get("/{prospeccao_id}", response_model=ProspeccaoResposta)
def obter_prospeccao(
    prospeccao_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    prospeccao = db.query(Prospeccao).filter(Prospeccao.id == prospeccao_id).first()
    if not prospeccao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prospecção não encontrada"
        )
    
    if usuario.tipo != "admin" and prospeccao.consultor_id != usuario.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar esta prospecção"
        )
    
    return prospeccao

@router.post("/com-agendamento")
def criar_prospeccao_com_agendamento(
    prospeccao: ProspeccaoCriar,
    agendar_proxima: bool = False,
    data_proxima_ligacao: str = None,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    empresa = db.query(Empresa).filter(Empresa.id == prospeccao.empresa_id).first()
    if not empresa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa não encontrada"
        )
    
    consultor = db.query(Usuario).filter(Usuario.id == prospeccao.consultor_id).first()
    if not consultor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultor não encontrado"
        )
    
    if usuario.tipo != "admin" and usuario.id != prospeccao.consultor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você só pode criar prospecções para si mesmo"
        )
    
    nova_prospeccao = Prospeccao(**prospeccao.model_dump())
    db.add(nova_prospeccao)
    db.flush()
    
    if agendar_proxima and data_proxima_ligacao:
        try:
            data_proxima = datetime.strptime(data_proxima_ligacao, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Data inválida. Use o formato YYYY-MM-DD"
            )
        
        novo_agendamento = Agendamento(
            prospeccao_id=nova_prospeccao.id,
            data_agendada=data_proxima,
            status=StatusAgendamento.pendente,
            observacoes=f"Retorno da prospecção anterior - {prospeccao.resultado}"
        )
        db.add(novo_agendamento)
    
    db.commit()
    db.refresh(nova_prospeccao)
    
    agendamento_realmente_criado = bool(agendar_proxima and data_proxima_ligacao)
    
    return {
        "prospeccao": nova_prospeccao,
        "agendamento_criado": agendamento_realmente_criado,
        "message": "Prospecção criada com sucesso" + (" e próxima ligação agendada" if agendamento_realmente_criado else "")
    }

@router.get("/export-pdf/{prospeccao_id}")
def exportar_prospeccao_pdf(
    prospeccao_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(obter_usuario_atual)
):
    prospeccao = db.query(Prospeccao).filter(Prospeccao.id == prospeccao_id).first()
    if not prospeccao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prospecção não encontrada"
        )
    
    if usuario.tipo != "admin" and prospeccao.consultor_id != usuario.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar esta prospecção"
        )
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    elements.append(Paragraph(f"Relatório de Prospecção #{prospeccao.id}", styles['Title']))
    elements.append(Spacer(1, 12))
    
    empresa_info = [
        ['Empresa:', prospeccao.empresa.empresa],
        ['CNPJ:', prospeccao.empresa.cnpj or 'N/A'],
        ['Município:', prospeccao.empresa.municipio or 'N/A'],
        ['Estado:', prospeccao.empresa.estado or 'N/A'],
    ]
    
    empresa_table = Table(empresa_info, colWidths=[150, 350])
    empresa_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.grey),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(empresa_table)
    elements.append(Spacer(1, 12))
    
    elements.append(Paragraph("Detalhes da Prospecção", styles['Heading2']))
    elements.append(Spacer(1, 6))
    
    prospeccao_info = [
        ['Consultor:', prospeccao.consultor.nome],
        ['Data da Ligação:', str(prospeccao.data_ligacao) if prospeccao.data_ligacao else 'N/A'],
        ['Hora:', str(prospeccao.hora_ligacao) if prospeccao.hora_ligacao else 'N/A'],
        ['Resultado:', prospeccao.resultado or 'N/A'],
    ]
    
    prospeccao_table = Table(prospeccao_info, colWidths=[150, 350])
    prospeccao_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.grey),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(prospeccao_table)
    elements.append(Spacer(1, 12))
    
    elements.append(Paragraph("Interesses do Cliente", styles['Heading2']))
    elements.append(Spacer(1, 6))
    
    interesses = [
        ['Treinamento:', 'Sim' if prospeccao.interesse_treinamento else 'Não'],
        ['Consultoria:', 'Sim' if prospeccao.interesse_consultoria else 'Não'],
        ['Certificação:', 'Sim' if prospeccao.interesse_certificacao else 'Não'],
        ['Eventos:', 'Sim' if prospeccao.interesse_eventos else 'Não'],
        ['Produtos:', 'Sim' if prospeccao.interesse_produtos else 'Não'],
    ]
    
    interesse_table = Table(interesses, colWidths=[150, 350])
    interesse_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(interesse_table)
    elements.append(Spacer(1, 12))
    
    if prospeccao.outros_interesses:
        elements.append(Paragraph("Outros Interesses:", styles['Heading3']))
        elements.append(Paragraph(prospeccao.outros_interesses, styles['Normal']))
        elements.append(Spacer(1, 12))
    
    if prospeccao.observacoes:
        elements.append(Paragraph("Observações:", styles['Heading3']))
        elements.append(Paragraph(prospeccao.observacoes, styles['Normal']))
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=prospeccao_{prospeccao_id}.pdf"
        }
    )
