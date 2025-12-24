from django.db import models

class Notification(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
    
    def time_since(self):
        from django.utils import timezone
        from datetime import timedelta

        current_time = timezone.now()
        time_difference = current_time - self.created_at

        if time_difference < timedelta(seconds=20):
            return "just now"
        if time_difference < timedelta(minutes=1):
            return "{time_difference.seconds} seconds ago"
        elif time_difference < timedelta(hours=1):
            return f"{time_difference.seconds // 60} minutes ago"
        elif time_difference < timedelta(days=1):
            return f"{time_difference.seconds // 3600} hours ago"
        else:
            return f"{time_difference.days} days ago"