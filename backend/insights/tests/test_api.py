
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from insights.models import Insight

@pytest.mark.django_db
def test_list_insights_returns_empty_list_initially():
    client = APIClient()
    resp = client.get('/api/insights/')
    assert resp.status_code == 200
    assert resp.data['results'] == []

@pytest.mark.django_db
def test_create_and_filter_insight():
    client = APIClient()
    # anonymous can read but not create: expect 403
    resp = client.post('/api/insights/', {"title":"t","category":"Macro","body":"b","tags":["Inflation"]}, format='json')
    assert resp.status_code in (401,403)

    # create via ORM (simulating authenticated path)
    Insight.objects.create(title='Alpha', category='Macro', body='...', tags=['Rates','CPI'])
    r = client.get('/api/insights/?search=alp')
    assert r.status_code == 200
    assert r.data['count'] == 1

    a = client.get('/api/analytics/top-tags')
    assert a.status_code == 200
    assert any(t['name']=='Rates' for t in a.data['tags'])
