import firebase_admin
from firebase_admin import credentials
from django.conf import settings
import os

_firebase_app = None


def firebase_enabled():
    """
    Firebase is ONLY enabled in production.
    """
    return not settings.DEBUG


def get_firebase_app():
    global _firebase_app

    if not firebase_enabled():
        return None

    if _firebase_app:
        return _firebase_app

    cred_path = settings.FIREBASE_CREDENTIALS

    if not cred_path or not os.path.exists(cred_path):
        raise RuntimeError("Firebase credentials missing in production")

    cred = credentials.Certificate(cred_path)
    _firebase_app = firebase_admin.initialize_app(cred)

    return _firebase_app
