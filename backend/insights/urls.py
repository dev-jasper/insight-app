from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import InsightViewSet, logout_view, top_tags_view,me_view,signup_view

router = DefaultRouter()
router.register(r"insights", InsightViewSet, basename="insight")

urlpatterns = [
    # Auth
    path("auth/login", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout", logout_view, name="logout"),
    path("auth/me/", me_view),
    path("auth/signup/", signup_view),

    # Insights CRUD
    path("", include(router.urls)),

    # Analytics
    path("analytics/top-tags/", top_tags_view, name="top-tags"),
]