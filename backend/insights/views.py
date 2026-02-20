
from collections import Counter
from rest_framework import viewsets, permissions, decorators, response
from .models import Insight
from .serializers import InsightSerializer

class InsightViewSet(viewsets.ModelViewSet):
    queryset = Insight.objects.all().order_by('-created_at')
    serializer_class = InsightSerializer
    permission_classes = [permissions.DjangoModelPermissionsOrAnonReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        category = self.request.query_params.get('category')
        tag = self.request.query_params.get('tag')
        if search:
            qs = qs.filter(title__icontains=search)
        if category:
            qs = qs.filter(category=category)
        if tag:
            qs = qs.filter(tags__icontains=tag)
        return qs

@decorators.api_view(['GET'])
def top_tags(request):
    tags = Insight.objects.values_list('tags', flat=True)
    c = Counter()
    for arr in tags:
        if isinstance(arr, list):
            c.update(arr)
    top = [{'name': k, 'count': v} for k, v in c.most_common(10)]
    return response.Response({'tags': top})
