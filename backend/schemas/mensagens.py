from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MensagemBase(BaseModel):
    destinatario_id: int
    conteudo: str

class MensagemCriar(MensagemBase):
    pass

class UsuarioSimples(BaseModel):
    id: int
    nome: str
    email: str
    foto_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class MensagemResposta(BaseModel):
    id: int
    remetente_id: int
    destinatario_id: int
    conteudo: str
    data_envio: datetime
    lida: bool
    data_leitura: Optional[datetime] = None
    remetente: UsuarioSimples
    destinatario: UsuarioSimples
    
    class Config:
        from_attributes = True

class ConversaResumo(BaseModel):
    usuario: UsuarioSimples
    ultima_mensagem: Optional[str] = None
    data_ultima_mensagem: Optional[datetime] = None
    mensagens_nao_lidas: int = 0
    
    class Config:
        from_attributes = True
