from fastapi import FastAPI
from app.models import user
from app.core.config import engine
from app.api.v1.endpoints.profile import router as profile_router
from app.api.v1.endpoints.users import router as users_router
from app.api.v1.endpoints.transactions import router as transactions_router  

# user.Base.metadata.create_all(bind=engine)  # Убрано, так как alembic управляет схемой

app = FastAPI()


app.include_router(profile_router,  
                   prefix="/profile", 
                   tags=["profile"])

app.include_router(users_router,   
                   prefix="/users",
                   tags=["user"])

app.include_router(transactions_router, 
                   prefix="/transactions",
                   tags=["transactions"])

@app.get("/")
async def root():
    return {"message": "Hello to the Fintrack !"}