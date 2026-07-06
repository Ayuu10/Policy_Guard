import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ProjectBase(BaseModel):
    project_name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
