import json
import hmac
import hashlib
from django.conf import settings
from django.http import HttpResponse
from .models import Order

def square_webhook(request):

    payload = request.body
    signature = request.headers.get("x-square-hmacsha256-signature")

    expected = hmac.new(
        settings.SQUARE_WEBHOOK_SIGNATURE_KEY.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    if signature != expected:
        return HttpResponse(status=403)

    event = json.loads(payload)

    if event["type"] == "payment.updated":

        payment = event["data"]["object"]["payment"]

        order = Order.objects.filter(
            square_payment_id=payment["id"]
        ).first()

        if order:
            order.status = payment["status"]
            order.save()

    return HttpResponse(status=200)