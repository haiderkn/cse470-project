from app.core.database import SessionLocal
from app.models.training_video import TrainingVideo, TrainingVideoCategory


def register(client, email="ada@example.com"):
    r = client.post("/api/auth/register", json={"name": "Ada", "email": email, "password": "secret123"})
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_register_login_and_duplicate(client):
    register(client)
    assert client.post("/api/auth/register", json={"name": "A", "email": "ada@example.com", "password": "secret123"}).status_code == 409
    ok = client.post("/api/auth/login", json={"email": "ada@example.com", "password": "secret123"})
    assert ok.status_code == 200 and ok.json()["role"] == "USER"
    bad = client.post("/api/auth/login", json={"email": "ada@example.com", "password": "nope"})
    assert bad.status_code == 401 and bad.json()["message"] == "Invalid email or password"


def test_validation_error_shape(client):
    r = client.post("/api/auth/register", json={"name": "A", "email": "bad", "password": "1"})
    body = r.json()
    assert r.status_code == 422 and body["message"] == "Validation failed"
    assert {"email", "password"} <= set(body["fieldErrors"])


def test_tasks_require_auth(client):
    r = client.get("/api/tasks")
    assert r.status_code == 401 and r.json()["status"] == 401
    assert client.get("/api/tasks", headers={"Authorization": "Bearer junk"}).status_code == 401


def test_task_crud_and_ownership(client):
    h = register(client)
    created = client.post("/api/tasks", json={"title": "Do it", "description": "now", "completed": False}, headers=h)
    assert created.status_code == 201
    task = created.json()
    assert task["title"] == "Do it" and "createdAt" in task

    assert len(client.get("/api/tasks", headers=h).json()) == 1
    upd = client.put(f"/api/tasks/{task['id']}", json={"title": "Done", "description": "x", "completed": True}, headers=h)
    assert upd.json()["completed"] is True

    other = register(client, "bob@example.com")
    assert client.get(f"/api/tasks/{task['id']}", headers=other).status_code == 404
    assert client.get("/api/tasks", headers=other).json() == []

    assert client.delete(f"/api/tasks/{task['id']}", headers=h).status_code == 204
    assert client.get(f"/api/tasks/{task['id']}", headers=h).status_code == 404


def test_training_video_filters_and_favorite_toggle(client):
    headers = register(client)
    with SessionLocal() as db:
        video = TrainingVideo(
            title="Basic obedience",
            description="A beginner lesson",
            category=TrainingVideoCategory.OBEDIENCE,
            youtube_video_id="abc123",
            duration_minutes=12,
        )
        db.add(video)
        db.commit()
        db.refresh(video)
        video_id = video.id

    listed = client.get(
        "/api/videos",
        params={"category": "Obedience", "search": "beginner"},
        headers=headers,
    )
    assert listed.status_code == 200 and [item["id"] for item in listed.json()] == [video_id]

    favorited = client.post(f"/api/videos/{video_id}/favorite", headers=headers)
    assert favorited.status_code == 200 and favorited.json()["favorited"] is True
    assert [item["id"] for item in client.get("/api/videos/favorites", headers=headers).json()] == [
        video_id
    ]

    unfavorited = client.post(f"/api/videos/{video_id}/favorite", headers=headers)
    assert unfavorited.status_code == 200 and unfavorited.json()["favorited"] is False
    assert client.get("/api/videos/favorites", headers=headers).json() == []


def test_community_medical_warning_answers_and_vote_toggle(client):
    headers = register(client)
    created = client.post(
        "/api/community/posts",
        json={
            "title": "My dog is lethargic",
            "content": "Should I be concerned?",
            "category": "Health",
        },
        headers=headers,
    )
    assert created.status_code == 201 and created.json()["hasMedicalWarning"] is True
    post_id = created.json()["id"]

    detail = client.get(f"/api/community/posts/{post_id}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["post"]["id"] == post_id and detail.json()["answers"] == []

    answer = client.post(
        f"/api/community/posts/{post_id}/answers",
        json={"content": "Please contact your veterinarian."},
        headers=headers,
    )
    assert answer.status_code == 201
    assert len(client.get(f"/api/community/posts/{post_id}", headers=headers).json()["answers"]) == 1

    upvote = client.post(
        f"/api/community/posts/{post_id}/vote", json={"voteType": 1}, headers=headers
    )
    assert upvote.json()["voteType"] == 1 and upvote.json()["upvotesCount"] == 1
    downvote = client.post(
        f"/api/community/posts/{post_id}/vote", json={"voteType": -1}, headers=headers
    )
    assert downvote.json()["voteType"] == -1 and downvote.json()["upvotesCount"] == 0
    removed = client.post(
        f"/api/community/posts/{post_id}/vote", json={"voteType": -1}, headers=headers
    )
    assert removed.json()["voteType"] is None and removed.json()["upvotesCount"] == 0
