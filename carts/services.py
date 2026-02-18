from decimal import Decimal
from .models import Cart, CartItem


class CartService:
    SESSION_KEY = "cart"

    def __init__(self, request):
        self.request = request
        self.session = request.session
        self.user = request.user if request.user.is_authenticated else None

    # --------------------
    # Public API
    # --------------------
    def get_items(self):
        if self.user:
            return self._db_items()
        return self._session_items()

    def add(self, item):
        if self.user:
            self._add_db(item)
        else:
            self._add_session(item)

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
            obj, created = CartItem.objects.get_or_create(
                cart=cart,
                product_id=item["id"],
                defaults={
                    "name": item["name"],
                    "price": item["price"],
                    "quantity": item["quantity"],
                },
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
                "id": item.product_id,
                "name": item.name,
                "price": item.price,
                "quantity": item.quantity,
            }
            for item in self.user.cart.items.all()
        ]

    def _add_session(self, item):
        cart = self.session.get(self.SESSION_KEY, {})
        pid = str(item["id"])

        if pid in cart:
            cart[pid]["quantity"] += item["quantity"]
        else:
            cart[pid] = item

        self.session[self.SESSION_KEY] = cart
        self.session.modified = True

    def _add_db(self, item):
        cart, _ = Cart.objects.get_or_create(user=self.user)
        obj, created = CartItem.objects.get_or_create(
            cart=cart,
            product_id=item["id"],
            defaults={
                "name": item["name"],
                "price": item["price"],
                "quantity": item["quantity"],
                "sku": item["sku"],
                "description": item["description"],
            },
        )

        if not created:
            obj.quantity += item["quantity"]
            obj.save()