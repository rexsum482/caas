from django.apps import AppConfig

class CartConfig(AppConfig):
    name = "carts"

    def ready(self):
        import carts.signals