from django.core.cache import cache

CACHE_KEY = "dashboard:admin:v1"
CACHE_TTL = 60


def get_dashboard_cache():
    return cache.get(CACHE_KEY)


def set_dashboard_cache(data):
    cache.set(CACHE_KEY, data, CACHE_TTL)


def invalidate_dashboard():
    cache.delete(CACHE_KEY)
