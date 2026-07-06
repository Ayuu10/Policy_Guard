import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base_class import Base

class Analysis(Base):
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    document_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("document.id"), nullable=False)
    framework: Mapped[str] = mapped_column(String(50), nullable=False)
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, processing, completed, failed
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    detected_industry: Mapped[str] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="analyses")
    findings = relationship("Finding", back_populates="analysis", cascade="all, delete-orphan")
    scores = relationship("Score", back_populates="analysis", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="analysis", cascade="all, delete-orphan")

    @property
    def industry_suggestions(self):
        from backend.services.industry_service import get_industry_suggestions
        if self.detected_industry:
            return get_industry_suggestions(self.detected_industry)
        return get_industry_suggestions("General / Non-specified")

