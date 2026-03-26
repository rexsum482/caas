from pathlib import Path
from dotenv import load_dotenv
import json
from datetime import time
from django.core.exceptions import ImproperlyConfigured
import os
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8000")

DEBUG = os.getenv("DEBUG") == "true"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "").split(",")

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'users',
    'invoices',
    'msgs',
    'customers',
    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',
    'appointments',
    'notifications.apps.NotificationsConfig',
    'reviews',
    "carts.apps.CartConfig",
    'products',
    'orders',
    'companies.apps.CompaniesConfig',
    'django_filters',
    
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',

    # Auth
    'django.contrib.auth.middleware.AuthenticationMiddleware',

    # Middleware AFTER auth
    'handyman.middleware.UpdateLastActiveMiddleware',

    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'handyman.urls'

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [ BASE_DIR / 'web_app' / 'build'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'handyman.context_processors.frontend_context',
                "reviews.context_processors.review_schema",
            ],
        },
    },
]

WSGI_APPLICATION = 'handyman.wsgi.application'
ASGI_APPLICATION = 'handyman.asgi.application'
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/Chicago'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
AUTH_USER_MODEL = "users.CustomUser"
DEFAULT_AUTH_MODEL = AUTH_USER_MODEL

AUTHENTICATION_BACKENDS = [
    "users.authentication.EmailOrUsernameBackend",
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],

}

STATICFILES_DIRS = [
    BASE_DIR / 'web_app' / 'build' / 'static',
    BASE_DIR / 'web_app' / 'build' / 'assets',
]
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "webmaster@domain.com")
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name}: {message}",
            "style": "{",
        },
    },
    "handlers": {
        "file": {
            "level": "DEBUG",
            "class": "logging.FileHandler",
            "filename": BASE_DIR / "django_debug.log",
            "formatter": "verbose",
        },
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django.request": {"handlers": ["file", "console"], "level": "DEBUG", "propagate": False},
        "users": {"handlers": ["file", "console"], "level": "DEBUG", "propagate": False},
    },
}

COMPANY_NAME = os.getenv("REACT_APP_COMPANY_NAME") 

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    },
}

def _parse_business_hours(value):
    try:
        raw = json.loads(value)
        parsed = {}

        for weekday, (start, end) in raw.items():
            parsed[int(weekday)] = (
                time.fromisoformat(start),
                time.fromisoformat(end),
            )

        return parsed
    except Exception as e:
        raise ImproperlyConfigured(
            f"Invalid BUSINESS_HOURS_BY_WEEKDAY env value: {e}"
        )

BUSINESS_HOURS_BY_WEEKDAY = _parse_business_hours(
    os.getenv("BUSINESS_HOURS_BY_WEEKDAY", "{}")
)

SESSION_COOKIE_SAMESITE = "None"
SESSION_COOKIE_SECURE = True
CART_ABANDONED_DAYS = 14

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

SQUARE_ACCESS_TOKEN = os.getenv("SQUARE_ACCESS_TOKEN")
SQUARE_LOCATION_ID = os.getenv("SQUARE_LOCATION_ID")