from rest_framework import serializers


class DashboardSerializer(serializers.Serializer):

    counts = serializers.DictField()
    revenue = serializers.DictField()
    charts = serializers.DictField()
