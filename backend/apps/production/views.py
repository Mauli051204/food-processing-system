from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.permissions import BasePermission
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.core.paginator import Paginator

from .permissions import IsProductionTeam
from .serializers import (
    EncryptedFileAvailableSerializer,
    KeyRequestSerializer,
    DownloadHistorySerializer,
    ProductionHistorySerializer,
    ApproveRejectKeyRequestSerializer,
)
from .services.production_services import (
    get_production_dashboard_stats,
    get_available_encrypted_files,
    request_key,
    get_key_requests_for_user,
    decrypt_batch,
    get_decrypted_file_path,
    record_download,
    get_download_history,
    get_production_history,
    get_download_trend,
    get_key_request_status_breakdown,
    get_production_statistics,
)
from .services.key_request_service import (
    approve_key_request,
    reject_key_request,
    KeyRequestNotFound,
    KeyRequestAlreadyProcessed,
)
from .utils import get_client_ip
from apps.tech.models import EncryptedFile
from apps.common.validators import get_safe_page_size, get_safe_days, get_safe_search


class IsAdmin(BasePermission):
    message = 'Only Admin users can access this resource.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role and user.role.name == 'ADMIN')


class ProductionDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsProductionTeam]

    def get(self, request):
        stats = get_production_dashboard_stats()
        return Response({'success': True, 'stats': stats}, status=status.HTTP_200_OK)


class AvailableEncryptedFilesView(APIView):
    permission_classes = [IsAuthenticated, IsProductionTeam]

    def get(self, request):
        search = get_safe_search(request)
        queryset = get_available_encrypted_files(search=search)

        page_number = request.query_params.get('page', 1)
        page_size = get_safe_page_size(request)
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page_number)

        return Response({
            'success': True,
            'data': EncryptedFileAvailableSerializer(page_obj.object_list, many=True).data,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_records': paginator.count,
            },
        }, status=status.HTTP_200_OK)


class RequestKeyView(APIView):
    permission_classes = [IsAuthenticated, IsProductionTeam]

    def post(self, request, encrypted_file_id):
        encrypted_file = get_object_or_404(EncryptedFile, id=encrypted_file_id)

        try:
            key_request = request_key(encrypted_file, request.user)
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'message': 'Key request submitted. Awaiting admin approval.',
            'data': KeyRequestSerializer(key_request).data,
        }, status=status.HTTP_201_CREATED)


class KeyRequestsView(APIView):
    permission_classes = [IsAuthenticated, IsProductionTeam]

    def get(self, request):
        queryset = get_key_requests_for_user(request.user)
        return Response({
            'success': True,
            'data': KeyRequestSerializer(queryset, many=True).data,
        }, status=status.HTTP_200_OK)


class DecryptBatchView(APIView):
    permission_classes = [IsAuthenticated, IsProductionTeam]

    def post(self, request, encrypted_file_id):
        encrypted_file = get_object_or_404(EncryptedFile, id=encrypted_file_id)

        try:
            decrypted_path = decrypt_batch(encrypted_file, request.user)
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'message': 'File decrypted successfully.',
            'data': {'decrypted_path': decrypted_path},
        }, status=status.HTTP_200_OK)


class DownloadFileView(APIView):
    permission_classes = [IsAuthenticated, IsProductionTeam]

    def get(self, request, encrypted_file_id):
        encrypted_file = get_object_or_404(EncryptedFile, id=encrypted_file_id)

        try:
            full_path, file_name = get_decrypted_file_path(encrypted_file)
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        record_download(encrypted_file, request.user, file_name, ip_address=get_client_ip(request))

        return FileResponse(open(full_path, 'rb'), as_attachment=True, filename=file_name)


class DownloadHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsProductionTeam]

    def get(self, request):
        search = get_safe_search(request)
        queryset = get_download_history(production_user=request.user, search=search)

        page_number = request.query_params.get('page', 1)
        page_size = get_safe_page_size(request)
        paginator = Paginator(queryset, page_size)
        page_obj = paginator.get_page(page_number)

        return Response({
            'success': True,
            'data': DownloadHistorySerializer(page_obj.object_list, many=True).data,
            'pagination': {
                'current_page': page_obj.number,
                'total_pages': paginator.num_pages,
                'total_records': paginator.count,
            },
        }, status=status.HTTP_200_OK)


class ProductionHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsProductionTeam]

    def get(self, request):
        history = get_production_history(request.user)
        return Response({
            'success': True,
            'data': ProductionHistorySerializer(history, many=True).data,
        }, status=status.HTTP_200_OK)


class AdminKeyRequestActionView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, key_request_id):
        serializer = ApproveRejectKeyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data['action']
        reason = request.data.get('reason', '')

        try:
            if action == 'approve':
                approve_key_request(key_request_id, request.user)
            else:
                reject_key_request(key_request_id, request.user, reason=reason)
        except (KeyRequestNotFound,) as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_404_NOT_FOUND)
        except (KeyRequestAlreadyProcessed,) as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'message': f'Key request {action}d successfully.',
        }, status=status.HTTP_200_OK)


class DownloadTrendView(APIView):
    permission_classes = [IsAuthenticated, IsProductionTeam]

    def get(self, request):
        days = get_safe_days(request)
        trend = get_download_trend(request.user, days=days)
        return Response({'success': True, 'data': trend}, status=status.HTTP_200_OK)


class KeyRequestStatusBreakdownView(APIView):
    permission_classes = [IsAuthenticated, IsProductionTeam]

    def get(self, request):
        breakdown = get_key_request_status_breakdown(request.user)
        return Response({'success': True, 'data': breakdown}, status=status.HTTP_200_OK)


class ProductionStatisticsView(APIView):
    permission_classes = [IsAuthenticated, IsProductionTeam]

    def get(self, request):
        stats = get_production_statistics(request.user)
        return Response({'success': True, 'data': stats}, status=status.HTTP_200_OK)