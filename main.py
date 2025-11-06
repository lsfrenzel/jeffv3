from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base, SessionLocal
from backend.models import Usuario, Empresa, Prospeccao, Agendamento
from backend.routers import auth, empresas, prospeccoes, agendamentos, admin
from backend.utils.seed import criar_usuario_admin_padrao

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    criar_usuario_admin_padrao(db)
finally:
    db.close()

app = FastAPI(title="Núcleo 1.03", version="1.0.0")

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
    return templates.TemplateResponse("prospeccao.html", {"request": request})

@app.get("/alertas", response_class=HTMLResponse)
async def alertas_page(request: Request):
    return templates.TemplateResponse("alertas.html", {"request": request})

@app.get("/admin/usuarios", response_class=HTMLResponse)
async def admin_usuarios_page(request: Request):
    return templates.TemplateResponse("admin_usuarios.html", {"request": request})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
