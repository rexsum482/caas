from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.conf import settings

from datetime import datetime

from .permissions import IsAdminOrReadCreateOnly
from .models import Appointment
from .serializers import AppointmentSerializer, PublicAppointmentSerializer
from .utils import send_appointment_email, send_mail
from .scheduling import generate_time_slots


@api_view(["GET", "POST"])
def public_reschedule(request, token):
    appointment = get_object_or_404(
        Appointment,
        reschedule_token=token,
        accepted__in=["P", "A"]
    )

    # GET → show appointment + slots
    if request.method == "GET":
        slots = generate_time_slots(
            appointment.requested_date,
            exclude_appointment_id=appointment.id
        )

        return Response({
            "appointment": PublicAppointmentSerializer(appointment).data,
            "available_slots": slots
        })

    # POST → reschedule
    new_date = request.data.get("date")
    new_time = request.data.get("time")

    if not new_date or not new_time:
        return Response(
            {"error": "date and time required"},
            status=400
        )

    new_date = datetime.strptime(new_date, "%Y-%m-%d").date()
    new_time = datetime.strptime(new_time, "%H:%M").time()

    available = generate_time_slots(
        new_date,
        exclude_appointment_id=appointment.id
    )

    if new_time.strftime("%H:%M") not in [s["time"] for s in available]:
        return Response(
            {"error": "Selected time is no longer available"},
            status=400
        )

    appointment.requested_date = new_date
    appointment.requested_time = new_time
    appointment.accepted = "P"  # force re-approval
    appointment.save()

    send_appointment_email(
        subject="Appointment Rescheduled",
        message=f"""
Hello {appointment.customer_first_name},

Your appointment has been rescheduled.

📅 {new_date}
⏰ {new_time.strftime('%I:%M %p')}

We will notify you once it is confirmed.
""",
        recipient=appointment.customer_email
    )

    return Response({"status": "rescheduled"})


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().order_by(
        "-requested_date", "-requested_time"
    )
    serializer_class = AppointmentSerializer
    permission_classes = [IsAdminOrReadCreateOnly]

    def get_queryset(self):
        queryset = super().get_queryset()

        status_filter = self.request.query_params.get("status")
        appointment_id = self.request.query_params.get("appointment")
        date_filter = self.request.query_params.get("date")

        if status_filter in ["P", "A", "D"]:
            queryset = queryset.filter(accepted=status_filter)

        # 🔗 Deep-link: single appointment
        if appointment_id:
            queryset = queryset.filter(id=appointment_id)

        # 📅 Deep-link: calendar date
        if date_filter:
            try:
                date = datetime.strptime(date_filter, "%Y-%m-%d").date()
                queryset = queryset.filter(requested_date=date)
            except ValueError:
                pass  # ignore invalid date silently

        return queryset

    # ----------------------
    # Custom Actions
    # ----------------------

    @action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        appointment = self.get_object()
        appointment.accept_request()
        send_appointment_email(appointment, accepted=True)
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def decline(self, request, pk=None):
        appointment = self.get_object()
        appointment.decline_request()
        send_appointment_email(appointment, accepted=False)
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def pending(self, request):
        appointments = Appointment.objects.filter(accepted="P")
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def accepted(self, request):
        appointments = Appointment.objects.filter(accepted="A")
        serializer = self.get_serializer(appointments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="available-slots")
    def available_slots(self, request):
        """
        GET /api/appointments/available-slots/?date=YYYY-MM-DD&exclude=ID
        """
        date_str = request.query_params.get("date")
        exclude_id = request.query_params.get("exclude")

        if not date_str:
            return Response({"error": "date is required"}, status=400)

        try:
            date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "Invalid date format"}, status=400)

        slots = generate_time_slots(
            date,
            exclude_appointment_id=exclude_id
        )
        return Response(slots)

    @action(detail=True, methods=["post"], url_path="reschedule")
    def reschedule(self, request, pk=None):
        """
        POST /api/appointments/{id}/reschedule/
        """
        appointment = self.get_object()

        new_date = request.data.get("date")
        new_time = request.data.get("time")

        if not new_date or not new_time:
            return Response(
                {"error": "date and time are required"},
                status=400
            )

        try:
            new_date = datetime.strptime(new_date, "%Y-%m-%d").date()
            new_time = datetime.strptime(new_time, "%H:%M").time()
        except ValueError:
            return Response(
                {"error": "Invalid date or time format"},
                status=400
            )

        available_slots = generate_time_slots(
            new_date,
            exclude_appointment_id=appointment.id
        )

        valid_times = {s["time"] for s in available_slots}

        if new_time.strftime("%H:%M") not in valid_times:
            return Response(
                {"error": "Selected time is no longer available"},
                status=409
            )

        with transaction.atomic():
            appointment.requested_date = new_date
            appointment.requested_time = new_time
            appointment.accepted = "P"
            appointment.save()

        send_mail(
            subject="Appointment Rescheduled",
            message=f"""
Hello {appointment.customer_first_name},

🔄 Your appointment has been rescheduled.

📅 New Date: {new_date}
⏰ New Time: {new_time.strftime('%I:%M %p')}

If you did not request this change, please contact us immediately.
""",
            from_email=settings.ADMIN_EMAIL,
            recipient=appointment.customer_email,
        )

        return Response({
            "status": "rescheduled",
            "date": new_date,
            "time": new_time.strftime("%H:%M")
        })

    def perform_create(self, serializer):
        appointment = serializer.save(accepted="P")
        send_appointment_email(appointment)
