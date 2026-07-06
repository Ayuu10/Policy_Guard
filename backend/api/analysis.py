import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.db.session import get_db
from backend.schemas.analysis import AnalysisRequest, MultiAnalysisRequest, AnalysisResponse
from backend.services import analysis_service
from backend.compliance import rule_engine
from backend.api.auth import get_current_user
from backend.models.user import User

router = APIRouter(tags=["Analysis"])

@router.post("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_200_OK)
def analyze_document(
    request: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # In a real setup we would also verify if the document belongs to a project the user owns.
        # analysis_service.run_analysis already checks if the document exists in DB.
        analysis = analysis_service.run_analysis(
            db=db,
            document_id=request.document_id,
            framework=request.framework
        )
        return analysis
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve)
        )
    except FileNotFoundError as fnfe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(fnfe)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Compliance analysis failed: {str(e)}"
        )

@router.post("/analyze/multi", response_model=List[AnalysisResponse], status_code=status.HTTP_200_OK)
def analyze_document_multi(
    request: MultiAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Run compliance analysis against multiple frameworks for one document."""
    if not request.frameworks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one framework must be selected."
        )
    results = []
    errors = []
    for framework in request.frameworks:
        try:
            analysis = analysis_service.run_analysis(
                db=db,
                document_id=request.document_id,
                framework=framework
            )
            results.append(analysis)
        except Exception as e:
            errors.append(f"{framework}: {str(e)}")

    if not results:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"All framework analyses failed: {'; '.join(errors)}"
        )
    return results

@router.get("/frameworks", response_model=List[str])
def get_supported_frameworks(current_user: User = Depends(get_current_user)):
    try:
        # List subdirectories in the frameworks folder dynamically
        root_dir = rule_engine.get_plugin_path("dummy").parent
        frameworks = []
        if root_dir.exists():
            for item in root_dir.iterdir():
                if item.is_dir():
                    # Convert folder name back to formatted name, e.g. pci_dss -> PCI DSS
                    name = item.name.replace("_", " ").upper()
                    frameworks.append(name)
        return sorted(frameworks)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not load supported frameworks: {str(e)}"
        )

@router.get("/analyses", response_model=List[AnalysisResponse])
def get_user_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return all completed analyses for documents belonging to the current user."""
    try:
        from backend.models.analysis import Analysis
        from backend.models.document import Document
        from backend.models.project import Project

        user_project_ids = [
            p.id for p in db.query(Project).filter(
                Project.user_id == current_user.id,
                Project.is_deleted == False
            ).all()
        ]
        user_doc_ids = [
            d.id for d in db.query(Document).filter(
                Document.project_id.in_(user_project_ids),
                Document.is_deleted == False
            ).all()
        ]
        analyses = db.query(Analysis).filter(
            Analysis.document_id.in_(user_doc_ids),
            Analysis.status == "completed"
        ).order_by(Analysis.created_at.desc()).all()
        return analyses
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not load analyses: {str(e)}"
        )

