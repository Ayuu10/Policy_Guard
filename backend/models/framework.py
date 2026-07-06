import uuid
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from backend.db.base_class import Base

class FrameworkRegistry(Base):
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    framework_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    embedding_collection: Mapped[str] = mapped_column(String(100), nullable=True)
    rules_path: Mapped[str] = mapped_column(String(500), nullable=True)
