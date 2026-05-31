from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os
from pathlib import Path

current_dir = Path(__file__).resolve().parent
dotenv_path = current_dir.parent / '.env'

load_dotenv(dotenv_path=dotenv_path)

USER_NAME = os.getenv('USER_NAME')
PASSWORD = os.getenv("PASSWORD")
HOST = os.getenv('HOST')
PORT = os.getenv('PORT')
DB_NAME = os.getenv("DB_NAME")

SQLALCHEMY_DB_URL = f'postgresql://{USER_NAME}:{PASSWORD}@{HOST}:{PORT}/{DB_NAME}'
engine = create_engine(SQLALCHEMY_DB_URL)
Sessionlocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = Sessionlocal()
    try:
        yield db
    finally:
        db.close()