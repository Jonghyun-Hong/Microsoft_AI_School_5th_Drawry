# app/db/base.py
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, DateTime
from datetime import datetime

Base = declarative_base()

class TimeStampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)