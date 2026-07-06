import pytest

@pytest.fixture
def auth_token(client):
    client.post(
        "/api/auth/signup",
        json={"username": "projectuser", "email": "project@example.com", "password": "password123"}
    )
    resp = client.post(
        "/api/auth/login",
        json={"username": "projectuser", "password": "password123"}
    )
    return resp.json()["access_token"]

def test_create_project(client, auth_token):
    response = client.post(
        "/api/projects",
        json={"project_name": "Test Project", "description": "This is a test project"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["project_name"] == "Test Project"
    assert data["description"] == "This is a test project"
    assert "id" in data

def test_list_projects(client, auth_token):
    client.post(
        "/api/projects",
        json={"project_name": "Project 1"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    client.post(
        "/api/projects",
        json={"project_name": "Project 2"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    response = client.get(
        "/api/projects",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert {p["project_name"] for p in data} == {"Project 1", "Project 2"}

def test_get_project_by_id(client, auth_token):
    create_resp = client.post(
        "/api/projects",
        json={"project_name": "Unique Project"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    project_id = create_resp.json()["id"]
    
    response = client.get(
        f"/api/projects/{project_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    assert response.json()["project_name"] == "Unique Project"

def test_update_project(client, auth_token):
    create_resp = client.post(
        "/api/projects",
        json={"project_name": "Old Name", "description": "Old description"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    project_id = create_resp.json()["id"]
    
    response = client.put(
        f"/api/projects/{project_id}",
        json={"project_name": "New Name", "description": "New description"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["project_name"] == "New Name"
    assert data["description"] == "New description"

def test_delete_project(client, auth_token):
    create_resp = client.post(
        "/api/projects",
        json={"project_name": "To Delete"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    project_id = create_resp.json()["id"]
    
    del_resp = client.delete(
        f"/api/projects/{project_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert del_resp.status_code == 204
    
    get_resp = client.get(
        f"/api/projects/{project_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert get_resp.status_code == 404
