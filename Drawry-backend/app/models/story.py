# app/models/story.py
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base, TimeStampMixin

class Story(Base, TimeStampMixin):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    main_character = Column(String, nullable=False)
    status = Column(String, nullable=False)

    # Relationships
    user = relationship("User", back_populates="stories")
    pages = relationship("Page", back_populates="story", cascade="all, delete-orphan")
    game_progress = relationship("GameProgress", back_populates="story", cascade="all, delete-orphan")
    eye_tracking_data = relationship("EyeTrackingData", back_populates="story", cascade="all, delete-orphan")