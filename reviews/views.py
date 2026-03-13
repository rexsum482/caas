from rest_framework import viewsets
from reviews.models import GoogleReview
from reviews.serializers import GoogleReviewSerializer
from rest_framework.permissions import AllowAny
from reviews.fetch_reviews import fetch_google_reviews
from reviews.pagination import ReviewsPagination
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from reviews.services import get_review_stats

class ReviewStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(get_review_stats())
    
class GoogleReviewViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = GoogleReview.objects.all().order_by('-review_time')
    serializer_class = GoogleReviewSerializer
    permission_classes = [AllowAny]
    pagination_class = ReviewsPagination
