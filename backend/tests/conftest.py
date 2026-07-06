import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))

from backend.main import app
from backend.db.base import Base
from backend.db.session import get_db
from backend.db.session import engine, SessionLocal

# SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# engine = create_engine(
#     SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
# )
# TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# @pytest.fixture(scope="function")
# def db():
#     # Recreate tables for every test function to ensure isolation
#     Base.metadata.create_all(bind=engine)
#     session = TestingSessionLocal()
#     try:
#         yield session
#     finally:
#         session.close()
#         Base.metadata.drop_all(bind=engine)
#         # Attempt to clean up the file
#         try:
#             if os.path.exists("./test.db"):
#                 os.remove("./test.db")
#         except Exception:
#             pass

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
