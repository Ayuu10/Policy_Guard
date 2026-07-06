import hashlib
import uuid
from pathlib import Path
from typing import Tuple
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from backend.core.config import settings
from backend.models.document import Document
from backend.models.project import Project

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".html", ".htm", ".md", ".markdown"}

def calculate_checksum(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

def validate_and_save_file(
    db: Session,
    upload_file: UploadFile,
    project_id: uuid.UUID,
    user_id: uuid.UUID
) -> Tuple[Document, bytes]:
    # Check if project exists and belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == user_id,
        Project.is_deleted == False
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or access denied."
        )

    # 1. Validate file extension
    original_filename = upload_file.filename or "unnamed_file"
    file_ext = Path(original_filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{file_ext}'. Supported extensions: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # 2. Read content and validate file size
    try:
        content = upload_file.file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not read uploaded file: {str(e)}"
        )

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    # 3. Compute checksum
    checksum = calculate_checksum(content)

    # 4. Check for duplicates in this project — return existing doc instead of erroring
    existing_doc = db.query(Document).filter(
        Document.project_id == project_id,
        Document.checksum == checksum,
        Document.is_deleted == False
    ).first()
    if existing_doc:
        # Idempotent: same content already exists, return it so analysis can still run
        return existing_doc, content

    # 5. Save to disk with unique name
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    storage_path = settings.UPLOAD_DIR / unique_filename

    try:
        with open(storage_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file to storage: {str(e)}"
        )

    # 6. Create database record
    db_doc = Document(
        project_id=project_id,
        filename=unique_filename,
        original_filename=original_filename,
        file_type=file_ext.lstrip("."),
        storage_path=str(storage_path.resolve()),
        checksum=checksum
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)

    return db_doc, content
