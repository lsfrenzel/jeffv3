from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from backend.database import Base
from datetime import datetime

class Mensagem(Base):
    __tablename__ = "mensagens"
    
    id = Column(Integer, primary_key=True, index=True)
    remetente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    destinatario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    conteudo = Column(Text, nullable=False)
    data_envio = Column(DateTime, default=datetime.utcnow, nullable=False)
    lida = Column(Boolean, default=False, nullable=False)
    data_leitura = Column(DateTime, nullable=True)
    
    remetente = relationship("Usuario", foreign_keys=[remetente_id])
    destinatario = relationship("Usuario", foreign_keys=[destinatario_id])
