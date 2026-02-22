import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


# -------------------------
# Fixtures
# -------------------------
@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="testuser", password="password123")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(username="otheruser", password="password123")


@pytest.fixture
def auth_client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


# -------------------------
# Helpers
# -------------------------
def payload(**overrides):
    data = {
        "title": "Alpha insight",
        "category": "Macro",
        "body": "This is a long enough body for validation.",
        "tags": ["Rates", "CPI"],
    }
    data.update(overrides)
    return data


# -------------------------
# Tests
# -------------------------
@pytest.mark.django_db
def test_list_insights_returns_empty_list_initially(client):
    resp = client.get("/api/insights/")
    assert resp.status_code == 200
    assert resp.data["results"] == []
    assert resp.data["count"] == 0


@pytest.mark.django_db
def test_anonymous_cannot_create_insight(client):
    resp = client.post("/api/insights/", payload(), format="json")
    assert resp.status_code in (401, 403)


@pytest.mark.django_db
def test_create_insight_success(auth_client):
    resp = auth_client.post("/api/insights/", payload(), format="json")
    assert resp.status_code == 201
    assert resp.data["title"] == "Alpha insight"
    assert set(resp.data["tags"]) == {"Rates", "CPI"}
    assert resp.data["created_by"]["username"] == "testuser"


@pytest.mark.django_db
def test_search_and_tag_filter_work(auth_client):
    # create one record
    resp = auth_client.post(
        "/api/insights/",
        payload(title="Alpha insight", tags=["django"]),
        format="json",
    )
    assert resp.status_code == 201

    # search should match title/body depending on selector
    r = auth_client.get("/api/insights/?search=alp")
    assert r.status_code == 200
    assert r.data["count"] >= 1

    # tag filter
    t = auth_client.get("/api/insights/?tag=django")
    assert t.status_code == 200
    assert t.data["count"] >= 1


@pytest.mark.django_db
def test_top_tags_endpoint(client, auth_client):
    auth_client.post("/api/insights/", payload(tags=["Rates"]), format="json")

    a = client.get("/api/analytics/top-tags/")
    assert a.status_code == 200
    assert "tags" in a.data
    assert any(t["name"] == "Rates" for t in a.data["tags"])


@pytest.mark.django_db
def test_validation_error_is_standardized(auth_client):
    res = auth_client.post(
        "/api/insights/",
        {"title": "x", "category": "Macro", "body": "short", "tags": ["t"]},
        format="json",
    )
    assert res.status_code == 400
    assert "error" in res.data
    assert res.data["error"]["code"] == "VALIDATION_ERROR"
    assert "details" in res.data["error"]


@pytest.mark.django_db
def test_title_validation(auth_client):
    res = auth_client.post(
        "/api/insights/",
        {
            "title": "x",
            "category": "Macro",
            "body": "This is a valid body content with enough length.",
            "tags": ["Inflation"],
        },
        format="json",
    )
    assert res.status_code == 400
    assert res.data["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.django_db
def test_duplicate_tags_validation(auth_client):
    res = auth_client.post(
        "/api/insights/",
        {
            "title": "Valid Title",
            "category": "Macro",
            "body": "This is a valid body content with enough length.",
            "tags": ["Inflation", "Inflation"],
        },
        format="json",
    )
    assert res.status_code == 400
    assert res.data["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.django_db
def test_owner_can_update(auth_client):
    res = auth_client.post(
        "/api/insights/",
        {
            "title": "Valid Title",
            "category": "Macro",
            "body": "This is a valid body content with enough length.",
            "tags": ["Inflation"],
        },
        format="json",
    )
    assert res.status_code == 201
    insight_id = res.data["id"]

    update = auth_client.patch(
        f"/api/insights/{insight_id}/",
        {"title": "Updated Title"},
        format="json",
    )
    assert update.status_code == 200
    assert update.data["title"] == "Updated Title"


@pytest.mark.django_db
def test_non_owner_cannot_update(auth_client, other_user):
    # Create insight as first user
    res = auth_client.post(
        "/api/insights/",
        {
            "title": "Valid Title",
            "category": "Macro",
            "body": "This is a valid body content with enough length.",
            "tags": ["Inflation"],
        },
        format="json",
    )
    assert res.status_code == 201
    insight_id = res.data["id"]

    # Authenticate as different user
    other = APIClient()
    other.force_authenticate(user=other_user)

    update = other.patch(
        f"/api/insights/{insight_id}/",
        {"title": "Hacked Title"},
        format="json",
    )
    assert update.status_code == 403


@pytest.mark.django_db
def test_owner_can_delete(auth_client):
    res = auth_client.post(
        "/api/insights/",
        {
            "title": "Delete Me",
            "category": "Macro",
            "body": "This is a valid body content with enough length.",
            "tags": ["Rates"],
        },
        format="json",
    )
    assert res.status_code == 201
    insight_id = res.data["id"]

    delete = auth_client.delete(f"/api/insights/{insight_id}/")
    assert delete.status_code == 204


@pytest.mark.django_db
def test_non_owner_cannot_delete(auth_client, other_user):
    res = auth_client.post(
        "/api/insights/",
        {
            "title": "Delete Me",
            "category": "Macro",
            "body": "This is a valid body content with enough length.",
            "tags": ["Rates"],
        },
        format="json",
    )
    assert res.status_code == 201
    insight_id = res.data["id"]

    other = APIClient()
    other.force_authenticate(user=other_user)

    delete = other.delete(f"/api/insights/{insight_id}/")
    assert delete.status_code == 403


@pytest.mark.django_db
def test_pagination_default_page_size_is_10(auth_client):
    for i in range(15):
        auth_client.post(
            "/api/insights/",
            {
                "title": f"Title {i}",
                "category": "Macro",
                "body": "This is a valid body content with enough length.",
                "tags": ["Tag"],
            },
            format="json",
        )

    res = auth_client.get("/api/insights/")
    assert res.status_code == 200
    assert "results" in res.data
    assert len(res.data["results"]) == 10  # default PAGE_SIZE


@pytest.mark.django_db
def test_pagination_respects_page_size_query_param(auth_client):
    for i in range(15):
        auth_client.post(
            "/api/insights/",
            {
                "title": f"Title {i}",
                "category": "Macro",
                "body": "This is a valid body content with enough length.",
                "tags": ["Tag"],
            },
            format="json",
        )

    res = auth_client.get("/api/insights/?page_size=5")
    assert res.status_code == 200
    assert len(res.data["results"]) == 5