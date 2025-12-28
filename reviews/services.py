from django.db.models import Avg, Count
from reviews.models import GoogleReview

def get_review_stats():
    stats = GoogleReview.objects.aggregate(
        avg_rating=Avg("rating"),
        total_reviews=Count("id"),
    )

    return {
        "average_rating": round(stats["avg_rating"] or 0, 1),
        "total_reviews": stats["total_reviews"],
        "reviews": list(
            GoogleReview.objects.order_by("-review_time")[:5].values(
                "reviewer_name",
                "rating",
                "comment",
                "review_time",
            )
        ),
    }
