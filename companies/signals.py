import requests
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Company


def build_address(instance):
    return ", ".join(filter(None, [
        instance.street_address,
        instance.city,
        instance.state,
        instance.zip_code
    ]))


def geocode_address(address):
    try:
        # 🔥 Use OpenStreetMap (FREE)
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": address,
            "format": "json",
            "limit": 1
        }

        headers = {
            "User-Agent": "your-app-name"
        }

        res = requests.get(url, params=params, headers=headers, timeout=5)
        data = res.json()

        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])

    except Exception as e:
        print("Geocode error:", e)

    return None, None


@receiver(pre_save, sender=Company)
def set_lat_lng(sender, instance, **kwargs):

    if not instance.street_address and not instance.zip_code:
        return

    try:
        old = Company.objects.get(pk=instance.pk)
    except Company.DoesNotExist:
        old = None

    address_changed = (
        not old or
        old.street_address != instance.street_address or
        old.city != instance.city or
        old.state != instance.state or
        old.zip_code != instance.zip_code
    )

    if address_changed:
        address = build_address(instance)
        lat, lng = geocode_address(address)

        if lat and lng:
            instance.latitude = lat
            instance.longitude = lng
