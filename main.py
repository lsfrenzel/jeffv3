from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.database import SessionLocal, Base, engine
from backend.models import Usuario, Empresa, Prospeccao, Agendamento, AtribuicaoEmpresa, Notificacao, Mensagem
from backend.routers import auth, empresas, prospeccoes, agendamentos, admin, atribuicoes, consultores, dashboard, cnpj, notificacoes, mensagens, cronograma, pipeline
from backend.utils.seed import criar_usuario_admin_padrao, criar_empresas_padrao, criar_consultores_padrao, criar_stages_padrao, popular_pipeline
from backend.utils.seed_cronograma import seed_cronograma
from backend.models.prospeccoes import gerar_codigo_prospeccao

app = FastAPI(title="Núcleo 1.03", version="1.0.0")

def atualizar_prospeccoes_sem_codigo(db):
    """Atualiza prospecções que não possuem código único"""
    prospeccoes_sem_codigo = db.query(Prospeccao).filter(
        (Prospeccao.codigo == None) | (Prospeccao.codigo == "")
    ).all()
    
    if prospeccoes_sem_codigo:
        print(f"🔄 Atualizando {len(prospeccoes_sem_codigo)} prospecções sem código...")
        for p in prospeccoes_sem_codigo:
            p.codigo = gerar_codigo_prospeccao()
        db.commit()
        print(f"✅ {len(prospeccoes_sem_codigo)} prospecções atualizadas com código único")

@app.get("/health")
async def health_check():
    """Health check endpoint - must respond quickly and independently of database state"""
    return JSONResponse(
        content={
            "status": "healthy", 
            "app": "Nucleo 1.03",
            "version": "1.0.0"
        }, 
        status_code=200,
        headers={"Cache-Control": "no-cache"}
    )

@app.get("/healthz")
async def healthz():
    """Alternative health check endpoint for Kubernetes/Railway compatibility"""
    return {"status": "ok"}

@app.on_event("startup")
async def startup_event():
    """Cria tabelas se necessário e executa seed de dados iniciais"""
    import os
    
    # Skip if running via Docker (entrypoint already handled this)
    if os.getenv("SKIP_STARTUP_SEED") == "true":
        print("✅ Startup seed skipped (handled by entrypoint)")
        return
    
    if engine is None:
        print("⚠️ DATABASE_URL não configurada - pulando inicialização do banco")
        return
    
    try:
        print("🔄 Verificando banco de dados...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tabelas verificadas/criadas")
    except Exception as e:
        print(f"⚠️ Erro ao verificar tabelas: {e}")
    
    db = SessionLocal()
    try:
        print("🔄 Iniciando seed de dados...")
        try:
            criar_usuario_admin_padrao(db)
        except Exception as e:
            print(f"⚠️ Erro ao criar usuário admin (pode já existir): {e}")
        
        try:
            criar_consultores_padrao(db)
        except Exception as e:
            print(f"⚠️ Erro ao criar consultores (podem já existir): {e}")
        
        try:
            criar_empresas_padrao(db)
        except Exception as e:
            print(f"⚠️ Erro ao criar empresas (podem já existir): {e}")
        
        try:
            criar_stages_padrao(db)
        except Exception as e:
            print(f"⚠️ Erro ao criar stages (podem já existir): {e}")
        
        try:
            popular_pipeline(db)
        except Exception as e:
            print(f"⚠️ Erro ao popular pipeline: {e}")
        
        try:
            atualizar_prospeccoes_sem_codigo(db)
        except Exception as e:
            print(f"⚠️ Erro ao atualizar prospecções sem código: {e}")
        
        # Cronograma seed disabled during startup (too slow)
        # You can import cronograma manually via the UI if needed
        # try:
        #     seed_cronograma(db)
        # except Exception as e:
        #     print(f"⚠️ Erro ao importar cronograma: {e}")
        
        print("✅ Seed de dados concluído")
    except Exception as e:
        print(f"❌ Erro geral no startup: {e}")
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
async def dashboard_page(request: Request):
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
