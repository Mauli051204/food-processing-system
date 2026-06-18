from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator

from .serializers import (
    VendorRegisterSerializer,
    VendorProfileSerializer,
    VendorProfileUpdateSerializer,
    MaterialSerializer,
    UploadHistorySerializer,
    SendToPurchaseSerializer,
)
from .permissions import IsApprovedVendor
from .services import (
    process_vendor_upload,
    get_vendor_dashboard_stats,
    get_upload_history,
    send_materials_to_purchase,
)
from .utils import format_upload_summary
from .models import VendorProfile
from apps.purchase.models import Material


class VendorRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VendorRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            'success': True,
            'message': 'Registration successful. Please wait for admin approval.',
        }, status=status.HTTP_201_CREATED)


class VendorDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsApprovedVendor]

    def get(self, request):
        stats = get_vendor_dashboard_stats(request.user)
        return Response({'success': True, 'data': stats}, status=status.HTTP_200_OK)


class VendorUploadView(APIView):
    permission_classes = [IsAuthenticated, IsApprovedVendor]

    def post(self, request):
        uploaded_file = request.FILES.get('file')

        if not uploaded_file:
            return Response(
                {'success': False, 'message': 'No file provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = process_vendor_upload(request.user, uploaded_file)
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response(
                {'success': False, 'message': message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': 'File processed successfully.',
            'summary': format_upload_summary(result),
        }, status=status.HTTP_201_CREATED)


class VendorUploadHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsApprovedVendor]

    def get(self, request):
        history = get_upload_history(request.user)
        serializer = UploadHistorySerializer(history, many=True)
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)


class VendorMaterialsView(APIView):
    permission_classes = [IsAuthenticated, IsApprovedVendor]

    def get(self, request):
        queryset = Material.objects.filter(vendor=request.user).order_by('-created_at')

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(material_name__icontains=search)

        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())

        sort_by = request.query_params.get('sort_by', '-created_at')
        allowed_sort_fields = ['material_name', '-material_name', 'expiry_date', '-expiry_date', 'created_at', '-created_at']
        if sort_by in allowed_sort_fields:
            queryset = queryset.order_by(sort_by)

        page_number = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 20)
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page_number)

        serializer = MaterialSerializer(page_obj.object_list, many=True)

        return Response({
            'success': True,
            'data': serializer.data,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_records': paginator.count,
            },
        }, status=status.HTTP_200_OK)


class SendToPurchaseView(APIView):
    permission_classes = [IsAuthenticated, IsApprovedVendor]

    def post(self, request):
        serializer = SendToPurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            count = send_materials_to_purchase(request.user, serializer.validated_data['material_ids'])
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response(
                {'success': False, 'message': message},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': f'{count} material(s) sent to purchase team.',
        }, status=status.HTTP_200_OK)


class VendorProfileView(APIView):
    permission_classes = [IsAuthenticated, IsApprovedVendor]

    def get(self, request):
        profile = get_object_or_404(VendorProfile, user=request.user)
        serializer = VendorProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        profile = get_object_or_404(VendorProfile, user=request.user)
        serializer = VendorProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(VendorProfileSerializer(profile).data, status=status.HTTP_200_OK)