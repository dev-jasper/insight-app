
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InsightViewSet, top_tags

router = DefaultRouter()
router.register(r'insights', InsightViewSet, basename='insight')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/top-tags', top_tags),
]
