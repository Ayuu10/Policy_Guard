import io
import pytest
from backend.compliance import rule_engine, scoring
from backend.services import ml_service

@pytest.fixture
def auth_token(client):
    client.post(
        "/api/auth/signup",
        json={"username": "complianceuser", "email": "comp@example.com", "password": "password123"}
    )
    resp = client.post(
        "/api/auth/login",
        json={"username": "complianceuser", "password": "password123"}
    )
    return resp.json()["access_token"]

@pytest.fixture
def project_id(client, auth_token):
    resp = client.post(
        "/api/projects",
        json={"project_name": "Compliance Project"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    return resp.json()["id"]

def test_ml_classification():
    text = (
        "We collect cookies to track user interactions and store site preferences. "
        "We implement appropriate technical and organizational measures to ensure security. "
        "Our team takes data protection very seriously and protects user privacy."
    )
    sentences = [s.strip() for s in text.split(".") if s.strip()]
    
    results = ml_service.classify_sentences(sentences)
    assert isinstance(results, dict)
    assert len(results) == 7
    for k, v in results.items():
        assert "compliant" in v
        assert "score" in v
        assert "example" in v

def test_rule_engine_gdpr():
    text = "We obtain your consent for marketing. We encrypt all user data and secure our servers."
    findings = rule_engine.evaluate_rules(text, "GDPR")
    
    assert len(findings) == 5
    
    security_finding = next(f for f in findings if f["rule_id"] == "GDPR_DATA_SECURITY")
    assert security_finding["compliant"] is True
    assert "encrypt" in security_finding["evidence"].lower()
    
    cookie_finding = next(f for f in findings if f["rule_id"] == "GDPR_COOKIE_NOTICE")
    assert cookie_finding["compliant"] is False

def test_scoring_engine():
    dummy_findings = [
        {"compliant": True, "severity": "critical", "category": "Security"},
        {"compliant": False, "severity": "high", "category": "Consent"},
        {"compliant": True, "severity": "medium", "category": "Transparency"},
    ]
    
    scores = scoring.calculate_scores(dummy_findings)
    assert scores["framework_score"] == 2/3
    assert pytest.approx(scores["risk_score"], 0.001) == 0.7 / 2.1
    assert pytest.approx(scores["overall_score"], 0.001) == 1.0 - (0.7 / 2.1)
    assert scores["categories"]["Security"] == 1.0
    assert scores["categories"]["Consent"] == 0.0
    assert scores["categories"]["Transparency"] == 1.0

def test_get_frameworks(client, auth_token):
    response = client.get(
        "/api/frameworks",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert "GDPR" in data
    assert "HIPAA" in data
    assert "CCPA" in data

def test_post_analyze_flow(client, auth_token, project_id):
    file_content = (
        "We collect cookies to track user interactions and store site preferences. "
        "We implement appropriate security and encrypt sensitive account records. "
        "However, we do not mention how long we store your data or any consumer rights."
    )
    
    upload_resp = client.post(
        "/api/upload",
        data={"project_id": project_id},
        files={"file": ("privacy_policy.txt", io.BytesIO(file_content.encode("utf-8")), "text/plain")},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert upload_resp.status_code == 201
    doc_id = upload_resp.json()["id"]
    
    analyze_resp = client.post(
        "/api/analyze",
        json={"document_id": doc_id, "framework": "GDPR"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert analyze_resp.status_code == 200
    data = analyze_resp.json()
    assert data["document_id"] == doc_id
    assert data["framework"] == "GDPR"
    assert data["status"] == "completed"
    
    assert len(data["findings"]) > 0
    assert len(data["scores"]) == 1
    scores = data["scores"][0]
    assert "overall_score" in scores
    assert "risk_score" in scores
