import random
import string
from decimal import Decimal
from datetime import timedelta, datetime, time

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import connection

from customers.models import Customer
from appointments.models import Appointment
from invoices.models import Invoice, Part, Labor, Payment
from msgs.models import Message

from dateutil.relativedelta import relativedelta


class Command(BaseCommand):
    help = "Generate large realistic mock data for performance testing"

    def add_arguments(self, parser):
        parser.add_argument("--customers", type=int, default=1000)
        parser.add_argument("--appointments", type=int, default=5000)
        parser.add_argument("--invoices", type=int, default=5000)
        parser.add_argument("--messages", type=int, default=2000)

    def handle(self, *args, **options):
        connection.ensure_connection()  # 🔥 Force SQLite connection init

        customers_count = options["customers"]
        appointments_count = options["appointments"]
        invoices_count = options["invoices"]
        messages_count = options["messages"]

        self.stdout.write(self.style.SUCCESS("Generating mock data..."))

        today = timezone.now().date()

        # ============================
        # CUSTOMERS
        # ============================
        customers = []
        for i in range(customers_count):
            customers.append(
                Customer(
                    first_name=f"John{i}",
                    last_name="Doe",
                    street_address=f"{random.randint(100, 9999)} Main St",
                    city="New York",
                    state="NY",
                    zip_code="10001",
                    phone_number=f"555{random.randint(1000000,9999999)}",
                    email=f"user{i}_{random.randint(1,99999)}@test.com",
                )
            )

        Customer.objects.bulk_create(customers, batch_size=1000)
        customers = list(Customer.objects.all())

        self.stdout.write(self.style.SUCCESS("Customers created."))

        # ============================
        # APPOINTMENTS
        # ============================
        appointment_objects = []
        for _ in range(appointments_count):
            random_date = today - timedelta(days=random.randint(0, 365))
            random_time = time(hour=random.randint(8, 17), minute=0)

            appointment_objects.append(
                Appointment(
                    customer_first_name="Jane",
                    customer_last_name="Smith",
                    customer_email="jane@test.com",
                    customer_phone_number="5551234567",
                    customer_street_address="123 Mock St",
                    customer_city="New York",
                    customer_state="NY",
                    requested_date=random_date,
                    requested_time=random_time,
                    accepted=random.choice(["P", "A", "D"]),
                )
            )

        Appointment.objects.bulk_create(appointment_objects, batch_size=1000)
        self.stdout.write(self.style.SUCCESS("Appointments created."))

        # ============================
        # INVOICES + LINE ITEMS + PAYMENTS
        # ============================
        for i in range(invoices_count):
            customer = random.choice(customers)

            issue_date = today - relativedelta(months=random.randint(0, 11))
            amount = Decimal(random.randint(100, 2000))

            invoice = Invoice.objects.create(
                invoice_number=f"MOCK{i}_{random.randint(1000,9999)}",
                customer=customer,
                amount=amount,
                issue_date=issue_date,
                due_date=issue_date + timedelta(days=30),
                paid=False,
            )

            # Add Parts
            for p in range(random.randint(1, 3)):
                Part.objects.create(
                    invoice=invoice,
                    description=f"Part {p}",
                    quantity=random.randint(1, 5),
                    unit_price=Decimal(random.randint(10, 200)),
                    position=p,
                )

            # Add Labor
            for l in range(random.randint(1, 2)):
                Labor.objects.create(
                    invoice=invoice,
                    description=f"Labor {l}",
                    hours=Decimal(random.randint(1, 5)),
                    hourly_rate=Decimal(random.randint(50, 150)),
                    position=l,
                )

            # Random Payments
            if random.random() > 0.4:
                Payment.objects.create(
                    invoice=invoice,
                    payment_date=issue_date + timedelta(days=random.randint(1, 40)),
                    amount=amount if random.random() > 0.5 else amount / 2,
                    method="Credit Card",
                )

            if i % 500 == 0:
                self.stdout.write(f"Created {i} invoices...")

        self.stdout.write(self.style.SUCCESS("Invoices + line items + payments created."))

        # ============================
        # MESSAGES
        # ============================
        messages = []
        for i in range(messages_count):
            messages.append(
                Message(
                    sender=f"user{i}@email.com",
                    subject="Test Message",
                    content="This is performance test message content.",
                    read=random.choice([True, False]),
                )
            )

        Message.objects.bulk_create(messages, batch_size=1000)

        self.stdout.write(self.style.SUCCESS("Messages created."))
        self.stdout.write(self.style.SUCCESS("Mock data generation complete! 🚀"))