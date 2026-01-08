from django.apps import AppConfig

class NotificationsConfig(AppConfig):
    name = "notifications"

    def ready(self):
        import notifications.signals
        from handyman.firebase import init_firebase
        init_firebase()
