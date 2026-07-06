import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.models.project import Project
from backend.schemas.project import ProjectCreate

def create_project(db: Session, project_in: ProjectCreate, user_id: uuid.UUID) -> Project:
    db_project = Project(
        user_id=user_id,
        project_name=project_in.project_name,
        description=project_in.description
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def get_project(db: Session, project_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Project]:
    return db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == user_id,
        Project.is_deleted == False
    ).first()

def list_projects(db: Session, user_id: uuid.UUID) -> List[Project]:
    return db.query(Project).filter(
        Project.user_id == user_id,
        Project.is_deleted == False
    ).all()

def update_project(db: Session, project_id: uuid.UUID, project_in: ProjectCreate, user_id: uuid.UUID) -> Optional[Project]:
    db_project = get_project(db, project_id, user_id)
    if not db_project:
        return None
    db_project.project_name = project_in.project_name
    db_project.description = project_in.description
    db.commit()
    db.refresh(db_project)
    return db_project

def soft_delete_project(db: Session, project_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    db_project = get_project(db, project_id, user_id)
    if not db_project:
        return False
    db_project.is_deleted = True
    db.commit()
    return True
