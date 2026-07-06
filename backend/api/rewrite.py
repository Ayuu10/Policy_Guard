from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.schemas.llm import RewriteRequest, RewriteResponse
from backend.services import llm_service
from backend.api.auth import get_current_user
from backend.models.user import User

router = APIRouter(tags=["LLM"])

@router.post("/rewrite", response_model=RewriteResponse, status_code=status.HTTP_200_OK)
def rewrite_clause(
    request: RewriteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = llm_service.generate_rewrite(
            db=db,
            text=request.text,
            framework=request.framework,
            finding_id=request.finding_id,
            provider=request.provider,
            model=request.model
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate rewritten section: {str(e)}"
        )
