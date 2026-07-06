import uuid
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class RewriteRequest(BaseModel):
    text: str
    framework: str
    finding_id: Optional[uuid.UUID] = None
    provider: Optional[str] = None
    model: Optional[str] = None

class RewriteResponse(BaseModel):
    rewritten_text: str
    explanation: str

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[uuid.UUID] = None
    document_id: Optional[uuid.UUID] = None
    framework: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: uuid.UUID
    sources: List[Dict[str, Any]] = []

