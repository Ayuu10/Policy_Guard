import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DocumentResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    filename: str
    original_filename: str
    file_type: str
    upload_date: datetime
    checksum: str

    model_config = ConfigDict(from_attributes=True)
