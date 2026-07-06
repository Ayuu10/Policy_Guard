import uuid
from sqlalchemy import Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base_class import Base

class Score(Base):
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    analysis_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("analysis.id"), nullable=False)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    framework_score: Mapped[float] = mapped_column(Float, nullable=False)
    transparency_score: Mapped[float] = mapped_column(Float, nullable=True)
    consent_score: Mapped[float] = mapped_column(Float, nullable=True)
    security_score: Mapped[float] = mapped_column(Float, nullable=True)
    retention_score: Mapped[float] = mapped_column(Float, nullable=True)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)

    analysis = relationship("Analysis", back_populates="scores")
