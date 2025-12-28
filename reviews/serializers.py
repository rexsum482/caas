from rest_framework import serializers
from reviews.models import GoogleReview

class GoogleReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = GoogleReview
        fields = ['review_id', 'reviewer_name', 'rating', 'comment', 'review_time', 'profile_photo_url']
        read_only_fields = ['review_id', 'review_time']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value
    
    def validate(self, data):
        if 'comment' in data and len(data['comment']) > 1000:
            raise serializers.ValidationError("Comment cannot exceed 1000 characters.")
        return data
    
    def create(self, validated_data):
        return GoogleReview.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        instance.reviewer_name = validated_data.get('reviewer_name', instance.reviewer_name)
        instance.rating = validated_data.get('rating', instance.rating)
        instance.comment = validated_data.get('comment', instance.comment)
        instance.profile_photo_url = validated_data.get('profile_photo_url', instance.profile_photo_url)
        instance.save()
        return instance
    