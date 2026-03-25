from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os
from dotenv import load_dotenv

load_dotenv()

USER_BD = os.getenv('USER_BD')
PASSWORD_BD = os.getenv('PASSWORD_BD')
HOST_DB = os.getenv('HOST_DB')
PORT_DB = os.getenv('PORT_DB')
NAME_DB = os.getenv('NAME_DB')

SQLALCHEMY_DATABASE_URL = f"postgresql://{USER_BD}:{PASSWORD_BD}@{HOST_DB}:{PORT_DB}/{NAME_DB}"


engine = create_engine(SQLALCHEMY_DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()