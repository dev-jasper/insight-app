import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

@pytest.fixture
def client():
    return APIClient()

@pytest.fixture
def user(db):
    return User.objects.create_user(username="user1", password="pass12345")

@pytest.fixture
def auth_client(client, user):
    client.force_authenticate(user=user)
    return client

def payload(**overrides):
    data = {
        "title": "Alpha insight",
        "category": "Macro",
        "body": "This is a long enough body for validation.",
        "tags": ["Rates", "CPI"],
    }
    data.update(overrides)
    return data

@pytest.mark.django_db
def test_list_insights_returns_empty_list_initially(client):
    resp = client.get("/api/insights/")
    assert resp.status_code == 200
    assert resp.data["results"] == []

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

@pytest.mark.django_db
def test_search_and_tag_filter_work(auth_client):
    # create one record
    resp = auth_client.post("/api/insights/", payload(title="Alpha insight", tags=["django"]), format="json")
    assert resp.status_code == 201

    # search should match title/body/tags depending on your selector
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
    assert any(t["name"] == "Rates" for t in a.data["tags"])