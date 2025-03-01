# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, Date
from sqlalchemy.orm import relationship
from app.db.base import Base, TimeStampMixin

class User(Base, TimeStampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    nickname = Column(String, nullable=False)
    birth_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)

    # Relationships
    stories = relationship("Story", back_populates="user")
    game_progress = relationship("GameProgress", back_populates="user")
    eye_tracking_data = relationship("EyeTrackingData", back_populates="user")