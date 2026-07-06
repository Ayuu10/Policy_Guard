import uuid
from sqlalchemy import String, Text, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base_class import Base

class Finding(Base):
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    analysis_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("analysis.id"), nullable=False)
    severity: Mapped[str] = mapped_column(String(50), nullable=False)  # low, medium, high, critical
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    regulation: Mapped[str] = mapped_column(String(100), nullable=False)
    article: Mapped[str] = mapped_column(String(100), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    suggested_fix: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[str] = mapped_column(Text, nullable=False)

    analysis = relationship("Analysis", back_populates="findings")
