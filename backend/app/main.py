from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from .database import engine,Base
from .api import register_routes
from .logging import configure_logging, LogLevels


configure_logging(LogLevels.info)

app = FastAPI()
@app.get("/")
def read_root():
    return {"message": "Welcome to the AI-Driven Test Plan Generator API"}
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_routes(app)

# openai.api_key = os.getenv("OPENAI_API_KEY")



