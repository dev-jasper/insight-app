from __future__ import annotations

from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .application.use_cases.create_insight import CreateInsightInput, CreateInsightUseCase
from .application.use_cases.delete_insight import DeleteInsightUseCase
from .application.use_cases.list_insights import ListInsightsQuery, ListInsightsUseCase
from .application.use_cases.top_tags import TopTagsUseCase
from .application.use_cases.update_insight import UpdateInsightInput, UpdateInsightUseCase
from .domain.exceptions import ValidationError
from .infrastructure.repositories import InsightRepository
from .infrastructure.selectors import InsightSelector, TagAnalyticsSelector
from .models import Insight
from .serializers import InsightSerializer


class InsightViewSet(viewsets.ModelViewSet):
    serializer_class = InsightSerializer
    queryset = Insight.objects.all()  # overridden by get_queryset

    repo = InsightRepository()
    selector = InsightSelector()

    def get_permissions(self):
        # Spec:
        # - list/retrieve: public
        # - create: authenticated
        # - update/delete: owner only (also requires authentication)
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        q = ListInsightsQuery(
            search=self.request.query_params.get("search"),
            category=self.request.query_params.get("category"),
            tag=self.request.query_params.get("tag"),
        )
        return ListInsightsUseCase(selector=self.selector).execute(query=q)

    def create(self, request, *args, **kwargs):
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)

        use_case = CreateInsightUseCase(repo=self.repo)
        try:
            insight = use_case.execute(
                data=CreateInsightInput(
                    title=ser.validated_data["title"],
                    category=ser.validated_data["category"],
                    body=ser.validated_data["body"],
                    tags=ser.validated_data.get("tags", []),
                ),
                user=request.user,
            )
        except ValidationError as e:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "details": e.details}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(self.get_serializer(insight).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        insight = self.get_object()
        partial = kwargs.pop("partial", False)

        ser = self.get_serializer(insight, data=request.data, partial=partial)
        ser.is_valid(raise_exception=True)

        use_case = UpdateInsightUseCase(repo=self.repo)
        try:
            updated = use_case.execute(
                insight=insight,
                data=UpdateInsightInput(
                    title=ser.validated_data.get("title", insight.title),
                    category=ser.validated_data.get("category", insight.category),
                    body=ser.validated_data.get("body", insight.body),
                    tags=ser.validated_data.get("tags", []),
                ),
                user=request.user,
            )
        except PermissionError:
            return Response(
                {"error": {"code": "FORBIDDEN", "details": {"detail": ["Owner only."]}}},
                status=status.HTTP_403_FORBIDDEN,
            )
        except ValidationError as e:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "details": e.details}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(self.get_serializer(updated).data, status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        insight = self.get_object()
        use_case = DeleteInsightUseCase(repo=self.repo)
        try:
            use_case.execute(insight=insight, user=request.user)
        except PermissionError:
            return Response(
                {"error": {"code": "FORBIDDEN", "details": {"detail": ["Owner only."]}}},
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([AllowAny])
def top_tags_view(request):
    use_case = TopTagsUseCase(selector=TagAnalyticsSelector())
    tags_qs = use_case.execute(limit=10)
    return Response({"tags": [{"name": t.name, "count": t.count} for t in tags_qs]})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    # Stateless JWT: client clears tokens. Endpoint exists per requirement.
    return Response({"detail": "Logged out."})