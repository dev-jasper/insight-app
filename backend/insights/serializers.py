
from rest_framework import serializers
from .models import Insight

class InsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insight
        fields = ['id', 'title', 'category', 'body', 'tags', 'created_at', 'updated_at']
