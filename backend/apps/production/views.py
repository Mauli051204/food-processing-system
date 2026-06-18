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
from .services import (
    get_production_dashboard_stats,
    get_available_encrypted_files,
    request_key,
    get_key_requests_for_user,
    decrypt_batch,
    get_decrypted_file_path,
    record_download,
    get_download_history,
    get_production_history,
)
from .utils import get_client_ip
from apps.tech.models import EncryptedFile
from apps.production.models import KeyRequest


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
        search = request.query_params.get('search')
        queryset = get_available_encrypted_files(search=search)

        page_number = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 20)
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
        search = request.query_params.get('search')
        queryset = get_download_history(production_user=request.user, search=search)

        page_number = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 20)
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


# ---------------------------------------------------------
# Minimal Admin-side approval endpoint (Admin module not yet
# built as a separate app; this is the smallest integration
# point needed for Production's workflow to function end-to-end)
# ---------------------------------------------------------

class AdminKeyRequestActionView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, key_request_id):
        from django.utils import timezone
        from apps.audit.models import AuditLog
        from apps.notifications.models import Notification

        key_request = get_object_or_404(KeyRequest, id=key_request_id)
        serializer = ApproveRejectKeyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data['action']

        if key_request.status != KeyRequest.PENDING:
            return Response(
                {'success': False, 'message': 'This key request has already been processed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        encrypted_file = key_request.encrypted_file

        if action == 'approve':
            key_request.status = KeyRequest.APPROVED
            key_request.approved_by = request.user
            key_request.approved_at = timezone.now()
            key_request.save()

            encrypted_file.status = 'KEY_APPROVED'
            encrypted_file.save(update_fields=['status'])

            from apps.tech.models import AESKey
            AESKey.objects.filter(encrypted_file=encrypted_file).update(sent_to_admin=True)

            AuditLog.objects.create(
                user=request.user,
                role='ADMIN',
                action='KEY_REQUEST_APPROVED',
                description=f'Key request #{key_request.id} approved for EncryptedFile #{encrypted_file.id}.',
            )

            Notification.objects.create(
                user=key_request.requested_by,
                title='Key Request Approved',
                message=f'Your key request for batch #{encrypted_file.id} has been approved.',
                notification_type='KEY_REQUEST_APPROVED',
                related_object_id=key_request.id,
            )
        else:
            key_request.status = KeyRequest.REJECTED
            key_request.save()

            encrypted_file.status = 'ENCRYPTED'
            encrypted_file.save(update_fields=['status'])

            AuditLog.objects.create(
                user=request.user,
                role='ADMIN',
                action='KEY_REQUEST_REJECTED',
                description=f'Key request #{key_request.id} rejected for EncryptedFile #{encrypted_file.id}.',
            )

            Notification.objects.create(
                user=key_request.requested_by,
                title='Key Request Rejected',
                message=f'Your key request for batch #{encrypted_file.id} has been rejected.',
                notification_type='KEY_REQUEST_REJECTED',
                related_object_id=key_request.id,
            )

        return Response({
            'success': True,
            'message': f'Key request {action}d successfully.',
        }, status=status.HTTP_200_OK)