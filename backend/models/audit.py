import uuid
from datetime import datetime, timezone
from typing import Any, Optional
from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.db.base_class import Base

class AuditLog(Base):
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("user.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    metadata_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, name="metadata", nullable=True)

    user = relationship("User", back_populates="audit_logs")
