def test_signup(client):
    response = client.post(
        "/api/auth/signup",
        json={"username": "testuser", "email": "test@example.com", "password": "secretpassword"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "id" in data

def test_signup_duplicate_username(client):
    client.post(
        "/api/auth/signup",
        json={"username": "testuser", "email": "test@example.com", "password": "password123"}
    )
    response = client.post(
        "/api/auth/signup",
        json={"username": "testuser", "email": "other@example.com", "password": "password123"}
    )
    assert response.status_code == 400
    assert "Username already registered" in response.json()["detail"]

def test_signup_duplicate_email(client):
    client.post(
        "/api/auth/signup",
        json={"username": "testuser", "email": "test@example.com", "password": "password123"}
    )
    response = client.post(
        "/api/auth/signup",
        json={"username": "otheruser", "email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]

def test_login(client):
    client.post(
        "/api/auth/signup",
        json={"username": "testuser", "email": "test@example.com", "password": "password123"}
    )
    response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client):
    client.post(
        "/api/auth/signup",
        json={"username": "testuser", "email": "test@example.com", "password": "password123"}
    )
    response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "wrongpassword"}
    )
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]

def test_read_me_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_read_me_authorized(client):
    client.post(
        "/api/auth/signup",
        json={"username": "testuser", "email": "test@example.com", "password": "password123"}
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "password123"}
    )
    token = login_resp.json()["access_token"]
    
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
