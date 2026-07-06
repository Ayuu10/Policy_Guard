from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from backend.db.session import get_db
from backend.schemas.llm import ChatRequest, ChatResponse
from backend.services import llm_service
from backend.api.auth import get_current_user
from backend.models.user import User
from backend.models.chat import ChatSession, ChatMessage
from backend.models.project import Project

router = APIRouter(tags=["LLM"])

@router.post("/chat", response_model=ChatResponse, status_code=status.HTTP_200_OK)
def chat_with_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        session = None
        if request.session_id:
            session = db.query(ChatSession).filter(
                ChatSession.id == request.session_id
            ).first()
            if session and session.project.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access to this chat session is forbidden."
                )
            
        if not session:
            project_id = None
            if request.document_id:
                from backend.models.document import Document
                doc = db.query(Document).filter(
                    Document.id == request.document_id,
                    Document.is_deleted == False
                ).first()
                if doc:
                    project_id = doc.project_id
            
            if not project_id:
                project = db.query(Project).filter(
                    Project.user_id == current_user.id,
                    Project.is_deleted == False
                ).first()
                if not project:
                    project = Project(
                        project_name="Default Chat Project",
                        user_id=current_user.id
                    )
                    db.add(project)
                    db.commit()
                    db.refresh(project)
                project_id = project.id
                
            session = ChatSession(
                id=request.session_id or uuid.uuid4(),
                project_id=project_id,
                title=request.message[:50] or "Compliance Consultation"
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            
        user_msg = ChatMessage(
            session_id=session.id,
            role="user",
            message=request.message
        )
        db.add(user_msg)
        db.commit()
        
        result = llm_service.generate_chat_reply(
            db=db,
            session_id=session.id,
            message=request.message,
            framework=request.framework,
            document_id=request.document_id,
            provider=request.provider,
            model=request.model
        )
        
        assistant_msg = ChatMessage(
            session_id=session.id,
            role="assistant",
            message=result["response"]
        )
        db.add(assistant_msg)
        db.commit()
        
        return {
            "response": result["response"],
            "session_id": session.id,
            "sources": result["sources"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat session error: {str(e)}"
        )
