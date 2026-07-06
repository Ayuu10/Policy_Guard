import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.db import base
from backend.api import auth, projects, documents, analysis, search, rewrite, chat, admin
from backend.core.config import settings
from backend.services import rag_service

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    import os
    # Auto-migrate/add detected_industry column if it's missing in SQLite/Postgres
    try:
        from backend.db.session import engine
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        columns = [c["name"] for c in inspector.get_columns("analysis")]
        if "detected_industry" not in columns:
            logger.info("Migrating database: Adding detected_industry column to analysis table...")
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE analysis ADD COLUMN detected_industry VARCHAR(100)"))
            logger.info("Database migration completed successfully.")
    except Exception as migration_err:
        logger.error(f"Failed to auto-migrate database table: {migration_err}")

    # Seed default users
    try:
        from backend.db.session import SessionLocal
        from backend.models.user import User
        from backend.core.security import get_password_hash
        db = SessionLocal()
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            logger.info("Seeding default admin/admin user...")
            db.add(User(
                username="admin",
                email="admin@policyguard.ai",
                password_hash=get_password_hash("admin"),
                role="admin"
            ))
            db.commit()

        test_user = db.query(User).filter(User.username == "test1").first()
        if not test_user:
            logger.info("Seeding default test1/test1 user...")
            db.add(User(
                username="test1",
                email="test1@test1.com",
                password_hash=get_password_hash("test1"),
                role="user"
            ))
            db.commit()
        db.close()
    except Exception as seed_err:
        logger.error(f"Failed to seed default users: {seed_err}")

    if "PYTEST_CURRENT_TEST" in os.environ or os.getenv("TESTING") == "True":
        logger.info("Skipping RAG indexing during test runs.")
    else:
        logger.info("Initializing vector search RAG system...")
        rag_service.init_rag_system()
        logger.info("RAG system initialization completed.")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="PolicyGuard AI compliance platform backend services.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(documents.router, prefix="/api/documents")
app.include_router(documents.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(rewrite.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "project": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
