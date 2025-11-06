from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, Time, Text, Boolean
from sqlalchemy.orm import relationship
from backend.database import Base
from datetime import datetime

class Prospeccao(Base):
    __tablename__ = "prospeccoes"

    id = Column(Integer, primary_key=True, index=True)
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=False)
    consultor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    data_ligacao = Column(Date)
    hora_ligacao = Column(Time)
    resultado = Column(String(100))
    observacoes = Column(Text)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    
    nome_contato = Column(String(200))
    telefone_contato = Column(String(50))
    email_contato = Column(String(200))
    cargo_contato = Column(String(200))
    
    interesse_treinamento = Column(Boolean, default=False)
    interesse_consultoria = Column(Boolean, default=False)
    interesse_certificacao = Column(Boolean, default=False)
    interesse_eventos = Column(Boolean, default=False)
    interesse_produtos = Column(Boolean, default=False)
    interesse_seguranca = Column(Boolean, default=False)
    interesse_meio_ambiente = Column(Boolean, default=False)
    outros_interesses = Column(Text)
    
    potencial_negocio = Column(String(50))
    status_follow_up = Column(String(100))

    empresa = relationship("Empresa", back_populates="prospeccoes")
    consultor = relationship("Usuario")
    agendamentos = relationship("Agendamento", back_populates="prospeccao")
