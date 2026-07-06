import pytest
import numpy as np
from backend.services import rag_service
from backend.db import vector_store

@pytest.fixture
def auth_token(client):
    client.post(
        "/api/auth/signup",
        json={"username": "raguser", "email": "rag@example.com", "password": "password123"}
    )
    resp = client.post(
        "/api/auth/login",
        json={"username": "raguser", "password": "password123"}
    )
    return resp.json()["access_token"]

def test_chunk_text():
    text = "The quick brown fox jumps over the lazy dog. Programming is fun and engaging."
    chunks = rag_service.chunk_text(text, chunk_size=20, chunk_overlap=5)
    assert len(chunks) > 0
    for chunk in chunks:
        assert len(chunk) <= 20
        assert len(chunk) > 0

def test_vector_store_direct():
    vector_store.init_db()
    vector_store.delete_collection("test_col")
    
    docs = [
        {"id": "doc1", "text": "Apple computer", "vector": [1.0, 0.0, 0.0], "metadata": {"category": "tech"}},
        {"id": "doc2", "text": "Banana fruit", "vector": [0.0, 1.0, 0.0], "metadata": {"category": "food"}},
    ]
    
    vector_store.add_documents("test_col", docs)
    
    query = [0.1, 0.9, 0.0]
    results = vector_store.similarity_search("test_col", query, k=2)
    
    assert len(results) == 2
    assert results[0]["id"] == "doc2"
    assert results[0]["metadata"]["category"] == "food"
    assert results[0]["score"] > 0.8
    assert results[1]["id"] == "doc1"

def test_rag_indexing():
    # GDPR articles should index without issues
    rag_service.index_framework_articles("GDPR")
    
    results = rag_service.retrieve_relevant_clauses("GDPR", "security and encryption", k=2)
    assert len(results) > 0
    for r in results:
        assert "regulation" in r["metadata"]
        assert r["metadata"]["regulation"] == "GDPR"

def test_api_search(client, auth_token):
    rag_service.init_rag_system()
    
    resp = client.get(
        "/api/search?q=consent&regulation=GDPR&k=3",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "score" in data[0]
    assert "text" in data[0]
