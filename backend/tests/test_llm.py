import pytest
import uuid
from backend.services import llm_service, rag_service
from backend.models.chat import ChatSession, ChatMessage
from backend.models.project import Project
from backend.models.user import User

@pytest.fixture
def auth_token(client):
    client.post(
        "/api/auth/signup",
        json={"username": "llmuser", "email": "llm@example.com", "password": "password123"}
    )
    resp = client.post(
        "/api/auth/login",
        json={"username": "llmuser", "password": "password123"}
    )
    return resp.json()["access_token"]

def test_llm_service_rewrite_fallbacks(db):
    res = llm_service.generate_rewrite(db, "Old consent statement.", "GDPR", None)
    assert "process your personal data" in res["rewritten_text"]
    
    from backend.models.finding import Finding
    finding = Finding(
        analysis_id=uuid.uuid4(),
        severity="high",
        category="Consent",
        regulation="GDPR",
        article="Article 7",
        explanation="No consent choice.",
        confidence=1.0,
        suggested_fix="Ask for affirmative opt-in.",
        evidence="None"
    )
    db.add(finding)
    db.commit()
    db.refresh(finding)
    
    res_consent = llm_service.generate_rewrite(db, "Old consent.", "GDPR", finding.id)
    assert "affirmative consent" in res_consent["rewritten_text"]
    assert "Article 7" in res_consent["explanation"]

def test_llm_service_chat_fallback(db):
    rag_service.init_rag_system()
    
    user = User(username="chat_test_user", email="ctu@example.com", password_hash="pw")
    db.add(user)
    db.commit()
    db.refresh(user)
    
    project = Project(project_name="Chat Test Proj", user_id=user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    
    session_id = uuid.uuid4()
    session = ChatSession(id=session_id, project_id=project.id, title="Test Chat")
    db.add(session)
    db.commit()
    db.refresh(session)
    
    res = llm_service.generate_chat_reply(db, session_id, "How can a user consent?", "GDPR")
    assert "response" in res
    assert len(res["sources"]) > 0
    assert "Article 7" in res["response"]

def test_api_rewrite_endpoint(client, auth_token):
    resp = client.post(
        "/api/rewrite",
        json={"text": "We store cookies.", "framework": "GDPR"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "rewritten_text" in data
    assert "explanation" in data

def test_api_chat_flow(client, auth_token):
    # 1. Start chat session
    resp1 = client.post(
        "/api/chat",
        json={"message": "What are the rules for security under HIPAA?", "framework": "HIPAA"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert resp1.status_code == 200
    data1 = resp1.json()
    session_id = data1["session_id"]
    assert "response" in data1
    assert "sources" in data1
    assert len(data1["sources"]) > 0
    assert "45 CFR Section 164.312" in data1["response"]
    
    # 2. Continue chat session with the same session_id
    resp2 = client.post(
        "/api/chat",
        json={"message": "Can you explain patient access rules?", "session_id": session_id, "framework": "HIPAA"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["session_id"] == session_id
    assert "45 CFR Section 164.524" in data2["response"]
