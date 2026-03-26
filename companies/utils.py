import requests
from django.conf import settings

def geocode_address(street, city, state, zip_code):
    address = f"{street}, {city}, {state} {zip_code}"

    url = "https://maps.googleapis.com/maps/api/geocode/json"

    params = {
        "address": address,
        "key": settings.GOOGLE_MAPS_API_KEY,
    }

    try:
        res = requests.get(url, params=params)
        data = res.json()

        if data["status"] == "OK":
            location = data["results"][0]["geometry"]["location"]
            return location["lat"], location["lng"]

    except Exception as e:
        print("Geocode error:", e)

    return None, None
