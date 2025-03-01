# app/models/page.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base, TimeStampMixin

class Page(Base, TimeStampMixin):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String)

    # Relationships
    story = relationship("Story", back_populates="pages")
    sketch = relationship("Sketch", back_populates="page", uselist=False, cascade="all, delete-orphan")
    eye_tracking_data = relationship("EyeTrackingData", back_populates="page", cascade="all, delete-orphan")