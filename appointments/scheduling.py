from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
from .models import Appointment, BlackoutDate

APPOINTMENT_DURATION = timedelta(hours=1)

def generate_time_slots(date, exclude_appointment_id=None):
    # 🚫 FULL DAY CLOSED
    if BlackoutDate.objects.filter(date=date).exists():
        return []

    weekday = date.weekday()
    business_hours = settings.BUSINESS_HOURS_BY_WEEKDAY

    if weekday not in business_hours:
        return []

    start_time, end_time = business_hours[weekday]
    tz = timezone.get_current_timezone()

    start_dt = timezone.make_aware(
        datetime.combine(date, start_time), tz
    )
    end_dt = timezone.make_aware(
        datetime.combine(date, end_time), tz
    )

    qs = Appointment.objects.filter(
        requested_date=date,
        accepted="A"
    )

    if exclude_appointment_id:
        qs = qs.exclude(id=exclude_appointment_id)

    booked_times = set(qs.values_list("requested_time", flat=True))

    slots = []
    current = start_dt

    while current + APPOINTMENT_DURATION <= end_dt:
        slot_time = current.time()

        if slot_time not in booked_times:
            slots.append({
                "date": date.isoformat(),
                "time": slot_time.strftime("%H:%M"),
                "label": slot_time.strftime("%I:%M %p"),
            })

        current += APPOINTMENT_DURATION

    return slots
