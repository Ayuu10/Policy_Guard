from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List

from backend.schemas.search import SearchResultResponse
from backend.services import rag_service
from backend.api.auth import get_current_user
from backend.models.user import User

router = APIRouter(tags=["Search"])

@router.get("/search", response_model=List[SearchResultResponse], status_code=status.HTTP_200_OK)
def semantic_search(
    q: str = Query(..., description="Query string for semantic search"),
    regulation: str = Query(..., description="Regulation framework name (e.g. GDPR, HIPAA, CCPA)"),
    k: int = Query(5, description="Number of results to retrieve"),
    current_user: User = Depends(get_current_user)
):
    try:
        results = rag_service.retrieve_relevant_clauses(
            framework=regulation,
            query=q,
            k=k
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Semantic search query failed: {str(e)}"
        )
