import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from backend.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
engine = None

if db_url.startswith("postgresql"):
    try:
        engine = create_engine(db_url, pool_pre_ping=True)
        with engine.connect() as conn:
            pass
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL database: {e}. Attempting to auto-create database...")
        try:
            from urllib.parse import urlparse, urlunparse
            parsed = urlparse(db_url)
            db_name = parsed.path.lstrip("/")
            # Replace database name with postgres default db
            postgres_parsed = parsed._replace(path="/postgres")
            postgres_url = urlunparse(postgres_parsed)
            
            temp_engine = create_engine(postgres_url, isolation_level="AUTOCOMMIT")
            with temp_engine.connect() as conn:
                # SQL injection check: db_name is safe here as it comes from configuration
                conn.execute(text(f"CREATE DATABASE {db_name}"))
            temp_engine.dispose()
            
            engine = create_engine(db_url, pool_pre_ping=True)
            logger.info(f"Database '{db_name}' successfully created.")
        except Exception as create_err:
            logger.error(f"Failed to auto-create database: {create_err}. Falling back to SQLite.")
            db_url = "sqlite:///./policyguard.db"
            engine = create_engine(db_url, connect_args={"check_same_thread": False})
            from backend.db.base import Base
            Base.metadata.create_all(bind=engine)
else:
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    if db_url.startswith("sqlite"):
        from backend.db.base import Base
        Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
