import sqlite3
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.db.session import get_db, db_url
from backend.models.user import User
from backend.models.project import Project
from backend.models.document import Document
from backend.models.analysis import Analysis
from backend.models.finding import Finding
from backend.db.vector_store import DB_PATH
from backend.api.auth import get_current_user
from backend.compliance.rule_engine import get_plugin_path
from backend.services import rag_service

router = APIRouter(tags=["Admin"])

# Admin Request Schemas
class FrameworkUpsertRequest(BaseModel):
    framework_name: str
    rules: List[Dict[str, Any]]
    articles: List[Dict[str, Any]]

class ReindexRequest(BaseModel):
    framework_name: str

@router.get("/admin/stats")
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns high-level system metrics, database table counts, and storage metrics.
    """
    # Verify admin role
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator privileges required."
        )

    try:
        users_count = db.query(User).count()
        projects_count = db.query(Project).filter(Project.is_deleted == False).count()
        documents_count = db.query(Document).filter(Document.is_deleted == False).count()
        analyses_count = db.query(Analysis).filter(Analysis.is_deleted == False).count()
        findings_count = db.query(Finding).count()

        # Vector Database metrics
        vector_chunks_count = 0
        if DB_PATH.exists():
            try:
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM vector_chunks")
                vector_chunks_count = cursor.fetchone()[0]
                conn.close()
            except Exception:
                pass

        # Database storage calculations
        main_db_size_kb = 0
        main_db_path = Path("policyguard.db")
        if main_db_path.exists():
            main_db_size_kb = main_db_path.stat().st_size / 1024

        vector_db_size_kb = 0
        if DB_PATH.exists():
            vector_db_size_kb = DB_PATH.stat().st_size / 1024

        return {
            "tables": {
                "users": users_count,
                "projects": projects_count,
                "documents": documents_count,
                "analyses": analyses_count,
                "findings": findings_count,
                "vector_chunks": vector_chunks_count
            },
            "storage": {
                "main_db_name": main_db_path.name,
                "main_db_size_kb": round(main_db_size_kb, 2),
                "vector_db_name": DB_PATH.name,
                "vector_db_size_kb": round(vector_db_size_kb, 2)
            },
            "database_type": "Postgres" if db_url.startswith("postgresql") else "SQLite"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch system metrics: {str(e)}"
        )

@router.post("/admin/frameworks", status_code=status.HTTP_200_OK)
def upsert_compliance_framework(
    request: FrameworkUpsertRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Saves or updates a framework's rules.json and articles.json policy configuration on the disk.
    Only accessible to administrators.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator privileges required."
        )

    fw_name = request.framework_name.strip()
    if not fw_name:
        raise HTTPException(status_code=400, detail="Framework name cannot be empty.")

    try:
        plugin_dir = get_plugin_path(fw_name)
        plugin_dir.mkdir(parents=True, exist_ok=True)

        # 1. Save rules.json
        rules_file = plugin_dir / "rules.json"
        with open(rules_file, "w", encoding="utf-8") as f:
            json.dump(request.rules, f, indent=2, ensure_ascii=False)

        # 2. Save articles.json
        articles_file = plugin_dir / "articles.json"
        with open(articles_file, "w", encoding="utf-8") as f:
            json.dump(request.articles, f, indent=2, ensure_ascii=False)

        # 3. Save placeholder/default files if missing
        severity_file = plugin_dir / "severity.json"
        if not severity_file.exists():
            with open(severity_file, "w", encoding="utf-8") as f:
                json.dump({}, f)

        # 4. Trigger auto re-indexing immediately
        rag_service.index_framework_articles(fw_name)

        return {
            "status": "success",
            "message": f"Framework '{fw_name}' configuration saved and RAG vectors indexed successfully."
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save framework files: {str(e)}"
        )

@router.post("/admin/reindex", status_code=status.HTTP_200_OK)
def reindex_framework(
    request: ReindexRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Triggers vector database RAG re-indexing for a given framework.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator privileges required."
        )

    fw_name = request.framework_name.strip()
    try:
        plugin_dir = get_plugin_path(fw_name)
        if not plugin_dir.exists():
            raise HTTPException(status_code=404, detail=f"Framework configuration for '{fw_name}' not found on disk.")

        rag_service.index_framework_articles(fw_name)
        return {
            "status": "success",
            "message": f"RAG vector database re-indexing for '{fw_name}' completed successfully."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to index RAG vectors: {str(e)}"
        )
