from decimal import Decimal
from products.models import Product

class Cart:
    SESSION_KEY = "cart"

    def __init__(self, request):
        self.session = request.session
        self.cart = self.session.get(self.SESSION_KEY, {})

    def save(self):
        self.session[self.SESSION_KEY] = self.cart
        self.session.modified = True


    def add(self, item):

        item_id = str(item["id"])

        product = Product.objects.get(id=item["id"])

        if item_id in self.cart:
            self.cart[item_id]["quantity"] += item["quantity"]

        else:
            self.cart[item_id] = {
                "id": product.id,
                "name": product.name,
                "price": str(product.price),
                "quantity": item["quantity"],
            }

        self.save()

    def update(self, item_id, quantity):
        item_id = str(item_id)
        if item_id in self.cart:
            self.cart[item_id]["quantity"] = quantity
            self.save()

    def remove(self, item_id):
        item_id = str(item_id)
        if item_id in self.cart:
            del self.cart[item_id]
            self.save()

    def clear(self):
        self.session[self.SESSION_KEY] = {}
        self.session.modified = True

    def items(self):

        items = []

        for item in self.cart.values():

            subtotal = Decimal(item["price"]) * item["quantity"]

            items.append({
                "id": item["id"],
                "product": {
                    "id": item["id"],
                    "name": item["name"],
                    "price": item["price"]
                },
                "quantity": item["quantity"],
                "subtotal": subtotal
            })

        return items

    def total(self):

        return sum(
            Decimal(item["price"]) * item["quantity"]
            for item in self.cart.values()
        )