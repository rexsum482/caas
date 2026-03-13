from django.contrib import admin
from .models import CustomUser

@admin.register(CustomUser)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "email", "is_active", "email_confirmed")
    search_fields = ("username", "email",)
    list_filter = ("id", "username", "email",)