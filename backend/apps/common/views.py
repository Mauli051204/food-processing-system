from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import StaffRegisterSerializer
from .services.registration_service import register_staff_user


class StaffRegisterView(APIView):
    """
    Base view for staff registration. Subclasses set `role_name` to
    the target Role — this is what prevents a client from registering
    as a different role than the endpoint they hit.
    """
    permission_classes = [AllowAny]
    role_name = None

    def post(self, request):
        serializer = StaffRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        register_staff_user(serializer.validated_data, self.role_name)

        return Response({
            'success': True,
            'message': 'Registration successful. Please wait for admin approval.',
        }, status=status.HTTP_201_CREATED)


class PurchaseRegisterView(StaffRegisterView):
    role_name = 'PURCHASE'


class TechRegisterView(StaffRegisterView):
    role_name = 'TECH'


class ProductionRegisterView(StaffRegisterView):
    role_name = 'PRODUCTION'