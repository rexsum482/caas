from square.client import Square
from django.conf import settings
from square.environment import SquareEnvironment

square_client = Square(
    token=settings.SQUARE_ACCESS_TOKEN,
    environment=SquareEnvironment.SANDBOX,
)