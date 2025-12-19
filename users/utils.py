from rest_framework.views import exception_handler
import logging

logger = logging.getLogger("django.request")

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    request = context.get("request")

    logger.error(
        f"API Exception: {exc}\n"
        f"Path: {request.get_full_path()}\n"
        f"Method: {request.method}\n"
        f"Headers: {dict(request.headers)}\n"
        f"Data: {request.data}"
    )

    return response
