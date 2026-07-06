import uuid
import logging
import json
from pathlib import Path
from sqlalchemy.orm import Session
from backend.models.document import Document
from backend.models.analysis import Analysis
from backend.models.finding import Finding
from backend.models.score import Score
from backend.compliance import rule_engine, scoring
from backend.services import ml_service, industry_service
import nltk
from nltk.tokenize import sent_tokenize

logger = logging.getLogger(__name__)

def extract_text(file_path: str) -> str:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    
    suffix = path.suffix.lower()
    if suffix in [".txt", ".md", ".html", ".htm"]:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    else:
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception:
            return "Sample fallback policy content for non-text files."

def run_analysis(db: Session, document_id: uuid.UUID, framework: str) -> Analysis:
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.is_deleted == False
    ).first()
    if not document:
        raise ValueError("Document not found.")

    analysis = Analysis(
        document_id=document_id,
        framework=framework,
        version="1.0",
        status="processing"
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    try:
        text = extract_text(document.storage_path)
        detected = industry_service.detect_industry(text)
        analysis.detected_industry = detected
        db.commit()

        sentences = sent_tokenize(text)

        ml_findings = {}
        # SBERT model works on GDPR and UK GDPR
        if framework.lower() in ["gdpr", "uk_gdpr", "uk gdpr"]:
            try:
                ml_results = ml_service.classify_sentences(sentences)
                
                # Fetch severity levels from severity.json plugin file
                try:
                    plugin_dir = rule_engine.get_plugin_path(framework)
                    with open(plugin_dir / "severity.json", "r", encoding="utf-8") as f:
                        severity_map = json.load(f)
                except Exception:
                    severity_map = {}

                for principle, details in ml_results.items():
                    sev = severity_map.get(principle, "medium")
                    ml_findings[principle] = {
                        "rule_id": f"ML_{principle.upper().replace(' ', '_').replace(',', '')}",
                        "title": f"ML: {principle}",
                        "severity": sev,
                        "category": principle,
                        "regulation": framework.upper(),
                        "article": "Article 5",
                        "description": f"ML model evaluation of {principle} principle compliance.",
                        "fix": f"Review and add policy clauses addressing {principle}.",
                        "references": ["Article 5 GDPR"],
                        "compliant": details["compliant"],
                        "evidence": details["example"] if details["compliant"] else "No compliant statement detected by ML model.",
                        "matched_pattern": "",
                        "confidence": details["score"]
                    }
            except Exception as ml_err:
                logger.error(f"ML classification failed: {ml_err}")

        # Run Rule Engine
        rule_findings = rule_engine.evaluate_rules(text, framework)

        # Merge findings
        all_findings = []
        for rf in rule_findings:
            all_findings.append(rf)
        for mf in ml_findings.values():
            all_findings.append(mf)

        # Save findings
        for f in all_findings:
            db_finding = Finding(
                analysis_id=analysis.id,
                severity=f["severity"],
                category=f["category"],
                regulation=f["regulation"],
                article=f["article"],
                explanation=f["description"] if not f["compliant"] else "Compliant: " + f["description"],
                confidence=f["confidence"],
                suggested_fix=f["fix"] if not f["compliant"] else "None",
                evidence=f["evidence"]
            )
            db.add(db_finding)

        # Calculate scores
        scores_data = scoring.calculate_scores(all_findings)
        
        # Save scores mapping categories
        cats = scores_data.get("categories", {})
        db_score = Score(
            analysis_id=analysis.id,
            overall_score=scores_data["overall_score"],
            framework_score=scores_data["framework_score"],
            transparency_score=cats.get("Transparency"),
            consent_score=cats.get("Consent"),
            security_score=cats.get("Security"),
            retention_score=cats.get("Storage Limitation"),
            risk_score=scores_data["risk_score"]
        )
        db.add(db_score)

        analysis.status = "completed"
        db.commit()
        db.refresh(analysis)

    except Exception as e:
        logger.error(f"Analysis failed for document {document_id}: {e}")
        analysis.status = "failed"
        db.commit()
        raise e

    return analysis
