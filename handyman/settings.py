import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = os.getenv("DEBUG", "True") == "True"

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8000")

ALLOWED_HOSTS = [
    '192.168.1.223',
    'localhost',
    '127.0.0.1',
] + os.getenv("ALLOWED_HOSTS", "").split(",")

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
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',

    # Auth
    'django.contrib.auth.middleware.AuthenticationMiddleware',

    # Your middleware AFTER auth
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

AUTHENTICATION_BACKENDS = [
    "users.authentication.EmailOrUsernameBackend",
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ]
}
STATICFILES_DIRS = [
    BASE_DIR / 'web_app' / 'build' / 'static',
]
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "master@ccgenz.com")
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

SQUARE_ENVIRONMENT = os.getenv("SQUARE_ENVIRONMENT", "sandbox")

if SQUARE_ENVIRONMENT == "production":
    SQUARE_ACCESS_TOKEN = os.getenv("SQUARE_ACCESS_TOKEN")
    SQUARE_APPLICATION_ID = os.getenv("SQUARE_APPLICATION_ID")
    SQUARE_LOCATION_ID = os.getenv('SQUARE_LOCATION_ID')
else:
    SQUARE_ACCESS_TOKEN = os.getenv("SQUARE_SANDBOX_TOKEN")
    SQUARE_APPLICATION_ID = os.getenv("SQUARE_SANDBOX_APPLICATION_ID")
    SQUARE_LOCATION_ID = os.getenv('SQUARE_SANDBOX_LOCATION_ID')

COMPANY_NAME = os.getenv("REACT_APP_COMPANY_NAME") 


FIREBASE_CREDENTIALS = (
    os.getenv("FIREBASE_CREDENTIALS")
    if not DEBUG
    else None
)

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [("127.0.0.1", 6379)],
        },
    },
}