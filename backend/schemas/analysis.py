import uuid
from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel, ConfigDict

class AnalysisRequest(BaseModel):
    document_id: uuid.UUID
    framework: str

class MultiAnalysisRequest(BaseModel):
    document_id: uuid.UUID
    frameworks: List[str]


class FindingResponse(BaseModel):
    id: uuid.UUID
    severity: str
    category: str
    regulation: str
    article: str
    explanation: str
    confidence: float
    suggested_fix: str
    evidence: str

    model_config = ConfigDict(from_attributes=True)

class ScoreResponse(BaseModel):
    id: uuid.UUID
    overall_score: float
    framework_score: float
    transparency_score: Optional[float] = None
    consent_score: Optional[float] = None
    security_score: Optional[float] = None
    retention_score: Optional[float] = None
    risk_score: float

    model_config = ConfigDict(from_attributes=True)

class AnalysisResponse(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    framework: str
    version: str
    status: str
    detected_industry: Optional[str] = None
    industry_suggestions: Optional[List[Dict[str, str]]] = None
    created_at: datetime
    findings: List[FindingResponse] = []
    scores: List[ScoreResponse] = []

    model_config = ConfigDict(from_attributes=True)
