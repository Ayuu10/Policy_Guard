import io
import pytest
from backend.core.config import settings

@pytest.fixture
def auth_token(client):
    client.post(
        "/api/auth/signup",
        json={"username": "docuser", "email": "doc@example.com", "password": "password123"}
    )
    resp = client.post(
        "/api/auth/login",
        json={"username": "docuser", "password": "password123"}
    )
    return resp.json()["access_token"]

@pytest.fixture
def project_id(client, auth_token):
    resp = client.post(
        "/api/projects",
        json={"project_name": "Doc Testing Project"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    return resp.json()["id"]

def test_upload_document_success(client, auth_token, project_id):
    file_content = b"This is a privacy policy document content to be evaluated."
    file_name = "test_policy.txt"
    
    response = client.post(
        "/api/upload",
        data={"project_id": project_id},
        files={"file": (file_name, io.BytesIO(file_content), "text/plain")},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["original_filename"] == "test_policy.txt"
    assert data["file_type"] == "txt"
    assert "checksum" in data
    assert data["project_id"] == project_id

def test_upload_document_unsupported_type(client, auth_token, project_id):
    file_content = b"Binary data"
    file_name = "unsupported.exe"
    
    response = client.post(
        "/api/upload",
        data={"project_id": project_id},
        files={"file": (file_name, io.BytesIO(file_content), "application/octet-stream")},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]

def test_upload_document_duplicate(client, auth_token, project_id):
    file_content = b"This is unique content to test duplicates."
    file_name = "policy_doc.txt"
    
    response1 = client.post(
        "/api/upload",
        data={"project_id": project_id},
        files={"file": (file_name, io.BytesIO(file_content), "text/plain")},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response1.status_code == 201
    id1 = response1.json()["id"]
    
    response2 = client.post(
        "/api/upload",
        data={"project_id": project_id},
        files={"file": (file_name, io.BytesIO(file_content), "text/plain")},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    # Upload is idempotent: returns existing document details
    assert response2.status_code in (200, 201)
    id2 = response2.json()["id"]
    assert id1 == id2


def test_upload_document_size_limit(client, auth_token, project_id, monkeypatch):
    monkeypatch.setattr(settings, "MAX_UPLOAD_SIZE_MB", 0)
    
    file_content = b"This file content is too big."
    file_name = "large_policy.txt"
    
    response = client.post(
        "/api/upload",
        data={"project_id": project_id},
        files={"file": (file_name, io.BytesIO(file_content), "text/plain")},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 413
    assert "File exceeds maximum allowed size" in response.json()["detail"]
