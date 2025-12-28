from rest_framework import viewsets
from reviews.models import GoogleReview
from reviews.serializers import GoogleReviewSerializer
from rest_framework.permissions import AllowAny
from reviews.fetch_reviews import fetch_google_reviews
from reviews.pagination import ReviewsPagination

class GoogleReviewViewSet(viewsets.ModelViewSet):
    queryset = GoogleReview.objects.all().order_by('-review_time')
    serializer_class = GoogleReviewSerializer
    permission_classes = [AllowAny]
    pagination_class = ReviewsPagination

    def retrieve(self, request, *args, **kwargs):
        fetch_google_reviews()
        return super().retrieve(request, *args, **kwargs)