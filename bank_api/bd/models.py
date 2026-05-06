from sqlalchemy import Integer, String, Column, Float, DateTime, ForeignKey, Boolean
from datetime import datetime
from .database import Base
from sqlalchemy.orm import relationship



class Bank:
    __table_name__ = "bank"

    