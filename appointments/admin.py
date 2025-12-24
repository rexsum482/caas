from django.contrib import admin
from .models import Appointment, BlackoutDate

@admin.register(BlackoutDate)
class BlackoutDateAdmin(admin.ModelAdmin):
    list_display = ("date", "reason")
    ordering = ("date",)