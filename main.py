from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.database import SessionLocal
from backend.models import Usuario, Empresa, Prospeccao, Agendamento, AtribuicaoEmpresa, Notificacao, Mensagem
from backend.routers import auth, empresas, prospeccoes, agendamentos, admin, atribuicoes, consultores, dashboard, cnpj, notificacoes, mensagens, cronograma, pipeline
from backend.utils.seed import criar_usuario_admin_padrao, criar_empresas_padrao, criar_consultores_padrao, criar_stages_padrao

app = FastAPI(title="Núcleo 1.03", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    """Executa seed de dados iniciais ao iniciar a aplicação"""
    db = SessionLocal()
    try:
        criar_usuario_admin_padrao(db)
        criar_consultores_padrao(db)
        criar_empresas_padrao(db)
        criar_stages_padrao(db)
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(empresas.router)
app.include_router(prospeccoes.router)
app.include_router(agendamentos.router)
app.include_router(atribuicoes.router)
app.include_router(consultores.router)
app.include_router(dashboard.router)
app.include_router(cnpj.router)
app.include_router(notificacoes.router)
app.include_router(mensagens.router)
app.include_router(cronograma.router)
app.include_router(pipeline.router)

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    return templates.TemplateResponse("dashboard.html", {"request": request})

@app.get("/empresas", response_class=HTMLResponse)
async def empresas_page(request: Request):
    return templates.TemplateResponse("empresas.html", {"request": request})

@app.get("/empresa/{empresa_id}", response_class=HTMLResponse)
async def empresa_perfil(request: Request, empresa_id: int):
    return templates.TemplateResponse("empresa_perfil.html", {"request": request, "empresa_id": empresa_id})

@app.get("/prospeccao", response_class=HTMLResponse)
async def prospeccao_page(request: Request):
    return templates.TemplateResponse("prospeccao_nova.html", {"request": request})

@app.get("/alertas", response_class=HTMLResponse)
async def alertas_page(request: Request):
    return templates.TemplateResponse("alertas.html", {"request": request})

@app.get("/admin/usuarios", response_class=HTMLResponse)
async def admin_usuarios_page(request: Request):
    return templates.TemplateResponse("admin_usuarios.html", {"request": request})

@app.get("/admin/atribuicoes", response_class=HTMLResponse)
async def admin_atribuicoes_page(request: Request):
    return templates.TemplateResponse("admin_atribuicoes.html", {"request": request})

@app.get("/consultores", response_class=HTMLResponse)
async def consultores_page(request: Request):
    return templates.TemplateResponse("consultores.html", {"request": request})

@app.get("/consultor/{consultor_id}", response_class=HTMLResponse)
async def consultor_perfil_page(request: Request, consultor_id: int):
    return templates.TemplateResponse("consultor_perfil.html", {"request": request, "consultor_id": consultor_id})

@app.get("/buscar-empresa", response_class=HTMLResponse)
async def buscar_empresa_page(request: Request):
    return templates.TemplateResponse("buscar_empresa.html", {"request": request})

@app.get("/chat", response_class=HTMLResponse)
async def chat_page(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

@app.get("/cronograma", response_class=HTMLResponse)
async def cronograma_page(request: Request):
    return templates.TemplateResponse("cronograma.html", {"request": request})

@app.get("/pipeline", response_class=HTMLResponse)
async def pipeline_page(request: Request):
    return templates.TemplateResponse("pipeline.html", {"request": request})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
