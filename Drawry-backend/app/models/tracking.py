# app/models/tracking.py
from sqlalchemy import Column, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base, TimeStampMixin

class EyeTrackingData(Base, TimeStampMixin):
    __tablename__ = "eye_tracking_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    page_id = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    tracking_data = Column(JSON, nullable=False)

    # Relationships
    user = relationship("User", back_populates="eye_tracking_data")
    story = relationship("Story", back_populates="eye_tracking_data")
    page = relationship("Page", back_populates="eye_tracking_data")