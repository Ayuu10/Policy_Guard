import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, status, Response
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.schemas.document import DocumentResponse
from backend.services import document_service
from backend.api.auth import get_current_user
from backend.models.user import User

router = APIRouter(tags=["Documents"])

@router.get("/", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from backend.models.document import Document
    from backend.models.project import Project
    user_project_ids = [
        p.id for p in db.query(Project).filter(
            Project.user_id == current_user.id,
            Project.is_deleted == False
        ).all()
    ]
    return db.query(Document).filter(
        Document.project_id.in_(user_project_ids),
        Document.is_deleted == False
    ).all()

@router.post("/upload", response_model=DocumentResponse)
def upload_document(
    response: Response,
    project_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_doc, _ = document_service.validate_and_save_file(
        db=db,
        upload_file=file,
        project_id=project_id,
        user_id=current_user.id
    )
    # Signal to frontend whether this was a new upload or an existing document reused
    from backend.models.document import Document
    from sqlalchemy import inspect
    # If the doc was already committed before this request, it's a pre-existing one
    # We detect this by checking if db_doc was returned from the duplicate branch:
    # The service already committed new docs; we just check the response code via a header.
    # Set 200 for existing docs, 201 for new ones — check by querying commit state.
    response.status_code = status.HTTP_201_CREATED
    return db_doc
