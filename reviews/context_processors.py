import json
from reviews.services import get_review_stats

def review_schema(request):
    stats = get_review_stats()

    schema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Reliable Roofing & Restoration",
        "url": "https://yourdomain.com",
        "image": "https://yourdomain.com/images/roof1.jpg",
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": stats["average_rating"],
            "reviewCount": stats["total_reviews"],
        },
        "review": [
            {
                "@type": "Review",
                "author": {
                    "@type": "Person",
                    "name": r["reviewer_name"] or "Anonymous",
                },
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": r["rating"],
                    "bestRating": 5,
                },
                "reviewBody": r["comment"] or "",
                "datePublished": r["review_time"].isoformat(),
            }
            for r in stats["reviews"]
        ],
    }

    return {
        "REVIEW_SCHEMA_JSON": json.dumps(schema)
    }
