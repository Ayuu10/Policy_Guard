import uuid
from typing import Optional
from sqlalchemy.orm import Session
from backend.models.user import User
from backend.schemas.user import UserCreate
from backend.core.security import get_password_hash, verify_password

def get_user_by_id(db: Session, user_id: uuid.UUID) -> Optional[User]:
    return db.query(User).filter(User.id == user_id, User.is_deleted == False).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username, User.is_deleted == False).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email, User.is_deleted == False).first()

def create_user(db: Session, user_in: UserCreate) -> User:
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed_password,
        role="user"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username_or_email: str, password: str) -> Optional[User]:
    db_user = get_user_by_username(db, username_or_email)
    if not db_user:
        db_user = get_user_by_email(db, username_or_email)
    if not db_user:
        return None
    if not verify_password(password, db_user.password_hash):
        return None
    return db_user
