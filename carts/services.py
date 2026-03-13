from decimal import Decimal
from .models import Cart, CartItem
from products.models import Product
from django.core.cache import cache

class CartCache:

    PREFIX = "cart"

    @classmethod
    def key(cls, user_id):
        return f"{cls.PREFIX}:{user_id}"

    @classmethod
    def get(cls, user_id):
        return cache.get(cls.key(user_id))

    @classmethod
    def set(cls, user_id, data):
        cache.set(cls.key(user_id), data, timeout=3600)

    @classmethod
    def delete(cls, user_id):
        cache.delete(cls.key(user_id))

class CartService:

    SESSION_KEY = "cart"

    def __init__(self, request):

        self.request = request
        self.session = request.session
        self.user = request.user if request.user.is_authenticated else None

    def get_items(self):

        if self.user:
            return self._db_items()

        return self._session_items()

    def add(self, product_id, quantity=1):

        if self.user:
            self._add_db(product_id, quantity)
        else:
            self._add_session(product_id, quantity)

    def clear_session(self):

        self.session[self.SESSION_KEY] = {}
        self.session.modified = True

    def merge_session_to_user(self):

        if not self.user:
            return

        session_items = self._session_items()

        if not session_items:
            return

        cart, _ = Cart.objects.get_or_create(user=self.user)

        for item in session_items:

            product = Product.objects.get(id=item["product_id"])

            obj, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={"quantity": item["quantity"]},
            )

            if not created:
                obj.quantity += item["quantity"]
                obj.save()

        self.clear_session()

    def _session_items(self):

        return list(self.session.get(self.SESSION_KEY, {}).values())

    def _db_items(self):

        return [
            {
                "product_id": item.product.id,
                "name": item.product.name,
                "price": item.product.price,
                "quantity": item.quantity,
            }
            for item in self.user.cart.items.select_related("product")
        ]

    def _add_session(self, product_id, quantity):

        cart = self.session.get(self.SESSION_KEY, {})
        pid = str(product_id)

        if pid in cart:
            cart[pid]["quantity"] += quantity
        else:
            cart[pid] = {
                "product_id": product_id,
                "quantity": quantity,
            }

        self.session[self.SESSION_KEY] = cart
        self.session.modified = True

    def _add_db(self, product_id, quantity):

        cart, _ = Cart.objects.get_or_create(user=self.user)

        product = Product.objects.get(id=product_id)

        obj, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity},
        )

        if not created:
            obj.quantity += quantity
            obj.save()