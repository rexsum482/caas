from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, status
from rest_framework.decorators import action
from .models import CheckoutSession
from .serializers import CheckoutSessionSerializer
from .services import CheckoutService
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Order
from .serializers import OrderSerializer
from .services import OrderService


class OrderViewSet(viewsets.ModelViewSet):

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            user=self.request.user
        ).order_by("-created_at")

    @action(detail=False, methods=["post"])
    def checkout(self, request):

        payment_id = request.data.get("payment_id")

        order = OrderService(request).checkout(
            payment_id=payment_id
        )

        serializer = OrderSerializer(order)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

class CheckoutSessionViewSet(viewsets.ModelViewSet):

    queryset = CheckoutSession.objects.all()

    serializer_class = CheckoutSessionSerializer

    permission_classes = [IsAuthenticated]

    def create(self, request):

        service = CheckoutService(request.user)

        session = service.create_session()

        serializer = self.get_serializer(session)

        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def finalize(self, request, pk=None):

        session = self.get_object()

        service = CheckoutService(request.user)

        order = service.finalize_order(session)

        return Response({
            "order_id": order.id
        })
class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        nonce = request.data.get("nonce")
        service = CheckoutService(request.user)
        order = service.create_order()
        payment = service.create_square_payment(order, nonce)
        return Response({
            "order_id": order.id,
            "payment_id": payment["id"],
        })