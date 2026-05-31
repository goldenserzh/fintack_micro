from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models import user
from app.core.config import engine
from app.api.v1.endpoints.profile import router as profile_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.transactions import router as transactions_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.ai import router as ai_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")
app.include_router(profile_router, prefix="/profile", tags=["profile"])
app.include_router(users_router, prefix="/users", tags=["user"])
app.include_router(transactions_router, prefix="/transactions", tags=["transactions"])
app.include_router(ai_router, prefix="/ai", tags=["ai"])


@app.get("/")
async def root():
    return {"message": "Hello to the Fintrack !"}
