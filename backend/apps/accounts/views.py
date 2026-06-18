from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout

from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator

from .serializers import LoginSerializer, UserSerializer, VendorRegisterSerializer
from .permissions import IsAdmin, IsVendor, IsPurchaseTeam, IsTechTeam, IsProductionTeam


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            errors = serializer.errors
            message = 'Invalid credentials'
            if isinstance(errors, dict):
                for field_errors in errors.values():
                    if isinstance(field_errors, list) and field_errors:
                        first = field_errors[0]
                        if isinstance(first, dict) and 'message' in first:
                            message = first['message']
                        elif isinstance(first, str):
                            message = first
                    break
            return Response(
                {'success': False, 'message': message},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = serializer.validated_data['user']
        login(request, user)

        return Response({
            'success': True,
            'message': 'Login successful',
            'role': user.role.name.lower() if user.role else None,
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({
            'success': True,
            'message': 'Logout successful',
        }, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class SessionCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'authenticated': request.user.is_authenticated,
        }, status=status.HTTP_200_OK)


@method_decorator(ensure_csrf_cookie, name='get')
class CSRFTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'detail': 'CSRF cookie set'}, status=status.HTTP_200_OK)

class VendorRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VendorRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            'success': True,
            'message': 'Registration successful. Please wait for admin approval.',
        }, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------
# Role-protected test endpoints (for verifying permissions)
# ---------------------------------------------------------

class AdminTestView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        return Response({'success': True, 'message': 'Admin access granted'})


class VendorTestView(APIView):
    permission_classes = [IsAuthenticated, IsVendor]

    def get(self, request):
        return Response({'success': True, 'message': 'Vendor access granted'})


class PurchaseTestView(APIView):
    permission_classes = [IsAuthenticated, IsPurchaseTeam]

    def get(self, request):
        return Response({'success': True, 'message': 'Purchase team access granted'})


class TechTestView(APIView):
    permission_classes = [IsAuthenticated, IsTechTeam]

    def get(self, request):
        return Response({'success': True, 'message': 'Tech team access granted'})


class ProductionTestView(APIView):
    permission_classes = [IsAuthenticated, IsProductionTeam]

    def get(self, request):
        return Response({'success': True, 'message': 'Production team access granted'})