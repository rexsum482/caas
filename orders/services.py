import uuid
from datetime import timedelta
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from .square_client import square_client
from carts.models import Cart
from orders.models import Order, OrderItem
from products.models import Product
from .models import CheckoutSession
from decimal import Decimal
from django.db import transaction
from carts.utils import Cart
from products.models import Product
from .models import Order, OrderItem


class OrderService:

    def __init__(self, request):
        self.request = request
        self.user = request.user
        self.cart = Cart(request)

    @transaction.atomic
    def checkout(self, payment_id=None):

        items = self.cart.items()

        if not items:
            raise Exception("Cart is empty")

        total = Decimal(self.cart.total())

        order = Order.objects.create(
            user=self.user,
            total=total,
            payment_id=payment_id,
            status="paid",
        )

        for item in items:

            product = Product.objects.select_for_update().get(
                id=item["product"]["id"]
            )

            quantity = item["quantity"]

            if product.inventory < quantity:
                raise Exception(
                    f"{product.name} is out of stock"
                )

            product.inventory -= quantity
            product.save()

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=product.price,
                subtotal=product.price * quantity,
            )

        self.cart.clear()

        return order
class CheckoutService:

    SESSION_TIMEOUT_MINUTES = 15

    def __init__(self, user):
        self.user = user

    @transaction.atomic
    def create_session(self):

        cart = Cart.objects.select_for_update().get(
            user=self.user
        )

        total = cart.total()

        session = CheckoutSession.objects.create(
            user=self.user,
            cart=cart,
            total=total,
            idempotency_key=str(uuid.uuid4()),
            expires_at=timezone.now() +
            timedelta(minutes=self.SESSION_TIMEOUT_MINUTES)
        )

        for item in cart.items.select_related("product"):

            product = item.product

            if product.stock < item.quantity:
                raise ValueError(
                    f"{product.name} out of stock"
                )

            product.stock -= item.quantity
            product.save(update_fields=["stock"])

        return session

    @transaction.atomic
    def finalize_order(self, session):

        if session.status == "paid":
            return

        cart = session.cart

        order = Order.objects.create(
            user=self.user,
            total=session.total
        )

        for item in cart.items.select_related("product"):

            OrderItem.objects.create(
                order=order,
                product=item.product,
                price=item.product.price,
                quantity=item.quantity
            )

        cart.items.all().delete()

        session.status = "paid"
        session.save()

        return order
    def create_order(self):

        with transaction.atomic():

            cart = self.user.cart

            total = cart.total()

            order = Order.objects.create(
                user=self.user,
                total=total,
            )

            for item in cart.items.select_related("product"):

                product = item.product

                product.reserve(item.quantity)

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    price=product.price,
                    quantity=item.quantity,
                )

            cart.items.all().delete()

            return order

    def create_square_payment(self, order, nonce):

        body = {
            "source_id": nonce,
            "idempotency_key": str(uuid.uuid4()),
            "amount_money": {
                "amount": int(order.total * 100),
                "currency": "USD",
            },
            "location_id": settings.SQUARE_LOCATION_ID,
        }

        result = square_client.payments.create_payment(body)

        if result.is_success():

            payment = result.body["payment"]

            order.square_payment_id = payment["id"]
            order.status = "paid"
            order.save()

            return payment

        raise Exception(result.errors)
    