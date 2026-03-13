from django.core.mail import send_mail
from django.conf import settings

def appointment_message(appointment):
    reschedule_url = (
        f"{settings.FRONTEND_URL}/reschedule/"
        f"{appointment.reschedule_token}"
    )
    return f"""
Hello {appointment.customer_first_name},

Your appointment request has been received.

📅 Date: {appointment.requested_date}
⏰ Time: {appointment.requested_time.strftime('%I:%M %p')}

We will notify you once it is accepted.

Thank you,
{settings.COMPANY_NAME}
"""

def send_appointment_email(appointment, accepted=None):
    if accepted:
        reschedule_url = (
            f"{settings.FRONTEND_URL}/reschedule/"
            f"{appointment.reschedule_token}"
        )
    if accepted is None:
        status = "received"
        message = appointment_message(appointment)
    elif accepted:
        status = "accepted"
        message = f"""
    Hello {appointment.customer_first_name},

    Your appointment request for
    {appointment.requested_date} at {appointment.requested_time}
    has been {status.lower()}.

    Thank you,
    {settings.DEFAULT_FROM_EMAIL}
    {'Need to reschedule?\n\n' + reschedule_url if accepted else ''}
    """
    else:
        status = "declined"
        message = f"""
    Hello {appointment.customer_first_name},

    Your appointment request for
    {appointment.requested_date} at {appointment.requested_time}
    has been {status.lower()}.

    Thank you,
    {settings.DEFAULT_FROM_EMAIL}
    """

    send_mail(
        subject=f"Appointment {status}",
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[appointment.customer_email],
        fail_silently=False,
    )
