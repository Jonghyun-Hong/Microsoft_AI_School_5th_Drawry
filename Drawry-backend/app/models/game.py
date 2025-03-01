# app/models/game.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base, TimeStampMixin

class GameProgress(Base, TimeStampMixin):
    __tablename__ = "game_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    game_type = Column(String, nullable=False)
    score = Column(Integer, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)

    # Relationships
    user = relationship("User", back_populates="game_progress")
    story = relationship("Story", back_populates="game_progress")