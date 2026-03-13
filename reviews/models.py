from django.db import models

class GoogleReview(models.Model):
    review_id = models.CharField(max_length=255, unique=True)
    reviewer_name = models.CharField(max_length=255, null=True, blank=True)
    rating = models.IntegerField()
    comment = models.TextField(null=True, blank=True)
    review_time = models.DateTimeField()
    profile_photo_url = models.URLField(null=True, blank=True)

    def __str__(self):
        return f"{self.reviewer_name} - {self.rating}★"

class Review(models.Model):
    reviewer_name = models.CharField(max_length=255, null=True, blank=True)
    reviewer_email = models.EmailField(unique=True)
    rating = models.IntegerField()
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_created=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.reviewer_email