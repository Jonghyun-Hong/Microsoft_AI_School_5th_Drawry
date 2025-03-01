# app/models/sketch.py
from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base, TimeStampMixin

class Sketch(Base, TimeStampMixin):
    __tablename__ = "sketches"

    id = Column(Integer, primary_key=True, index=True)
    page_id = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), unique=True, nullable=False)
    original_sketch_url = Column(String, nullable=False)
    generated_image_urls = Column(JSON, nullable=False)
    selected_image_url = Column(String)
    prompt_data = Column(JSON, nullable=False)

    # Relationships
    page = relationship("Page", back_populates="sketch")