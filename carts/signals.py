from django.contrib.auth.signals import user_logged_in
from .services import CartService, CartCache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import CartItem

@receiver(post_save, sender=CartItem)
@receiver(post_delete, sender=CartItem)
def clear_cart_cache(sender, instance, **kwargs):

    if instance.cart.user:
        CartCache.delete(instance.cart.user.id)

@receiver(user_logged_in)
def merge_cart_on_login(sender, request, user, **kwargs):
    CartService(request).merge_session_to_user()