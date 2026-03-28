from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models import profile, transaction, user
from sqlalchemy import engine

profile.Base.metadata.create_all(bind=engine)
transaction.Base.metadata.create_all(bind=engine)
user.Base.metadata.create_all(bind=engine)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,      
    allow_methods=["*"],         
    allow_headers=["*"],         
)