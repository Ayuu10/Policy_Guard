from pydantic import BaseModel
from typing import Dict, Any

class SearchResultResponse(BaseModel):
    id: str
    text: str
    metadata: Dict[str, Any]
    score: float
