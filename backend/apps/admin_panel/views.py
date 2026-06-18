from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.http import Http404

from .permissions import IsAdmin
from .serializers import (
    AdminUserSerializer,
    RejectUserSerializer,
    AdminKeyRequestSerializer,
    AdminEncryptedFileSerializer,
    AdminDownloadHistorySerializer,
    AdminAuditLogSerializer,
    AdminNotificationSerializer,
    SystemSettingSerializer,
    ApproveRejectActionSerializer,
)
from .services import (
    get_admin_dashboard_stats,
    get_recent_activity,
    get_all_users,
    approve_user,
    reject_user,
    activate_user,
    deactivate_user,
    get_encryption_management_data,
    get_download_management_data,
    get_audit_logs,
    get_all_notifications,
    mark_notification_read,
    get_or_create_settings,
    update_settings,
)
from .utils import paginate_queryset
from .reports import export_csv, export_excel, export_pdf
from apps.accounts.models import User
from apps.production.models import KeyRequest


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        stats = get_admin_dashboard_stats()
        activity = get_recent_activity()
        return Response({'success': True, 'stats': stats, 'recent_activity': activity}, status=status.HTTP_200_OK)


class AdminUsersView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        search = request.query_params.get('search')
        role_filter = request.query_params.get('role')
        status_filter = request.query_params.get('status')

        queryset = get_all_users(search=search, role_filter=role_filter, status_filter=status_filter)
        result = paginate_queryset(request, queryset, AdminUserSerializer)
        return Response({'success': True, **result}, status=status.HTTP_200_OK)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        return Response({'success': True, 'data': AdminUserSerializer(user).data}, status=status.HTTP_200_OK)


class AdminApproveUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        try:
            approve_user(user, request.user)
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'success': True, 'message': 'User approved successfully.'}, status=status.HTTP_200_OK)


class AdminRejectUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        serializer = RejectUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reject_user(user, request.user, reason=serializer.validated_data.get('reason', ''))
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'success': True, 'message': 'User rejected successfully.'}, status=status.HTTP_200_OK)


class AdminActivateUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        try:
            activate_user(user, request.user)
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'success': True, 'message': 'User activated successfully.'}, status=status.HTTP_200_OK)


class AdminDeactivateUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        try:
            deactivate_user(user, request.user)
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'success': True, 'message': 'User deactivated successfully.'}, status=status.HTTP_200_OK)


class AdminKeyRequestsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        status_filter = request.query_params.get('status')
        queryset = KeyRequest.objects.select_related(
            'encrypted_file__approved_material__material__vendor', 'requested_by'
        ).order_by('-requested_at')

        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())

        return Response({
            'success': True,
            'data': AdminKeyRequestSerializer(queryset, many=True).data,
        }, status=status.HTTP_200_OK)


class AdminKeyRequestApproveView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, key_request_id):
        from apps.production.views import AdminKeyRequestActionView as ProductionAdminAction
        request.data['action'] = 'approve'
        view = ProductionAdminAction()
        view.request = request
        return view.post(request, key_request_id)


class AdminKeyRequestRejectView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, key_request_id):
        from apps.production.views import AdminKeyRequestActionView as ProductionAdminAction
        request.data['action'] = 'reject'
        view = ProductionAdminAction()
        view.request = request
        return view.post(request, key_request_id)


class AdminEncryptionHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        search = request.query_params.get('search')
        status_filter = request.query_params.get('status')
        queryset = get_encryption_management_data(search=search, status_filter=status_filter)
        result = paginate_queryset(request, queryset, AdminEncryptedFileSerializer)
        return Response({'success': True, **result}, status=status.HTTP_200_OK)


class AdminDownloadHistoryView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        search = request.query_params.get('search')
        queryset = get_download_management_data(search=search)
        result = paginate_queryset(request, queryset, AdminDownloadHistorySerializer)
        return Response({'success': True, **result}, status=status.HTTP_200_OK)


class AdminAuditLogsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        search = request.query_params.get('search')
        user_filter = request.query_params.get('user_id')
        action_filter = request.query_params.get('action')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        queryset = get_audit_logs(
            search=search, user_filter=user_filter, action_filter=action_filter,
            date_from=date_from, date_to=date_to,
        )
        result = paginate_queryset(request, queryset, AdminAuditLogSerializer)
        return Response({'success': True, **result}, status=status.HTTP_200_OK)


class AdminNotificationsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        read_filter = request.query_params.get('filter')
        queryset = get_all_notifications(read_filter=read_filter)
        result = paginate_queryset(request, queryset, AdminNotificationSerializer)
        return Response({'success': True, **result}, status=status.HTTP_200_OK)


class AdminNotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, notification_id):
        from apps.notifications.models import Notification
        notification = get_object_or_404(Notification, id=notification_id)
        mark_notification_read(notification)
        return Response({'success': True, 'message': 'Notification marked as read.'}, status=status.HTTP_200_OK)


class AdminReportsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        report_type = request.query_params.get('type')
        export_format = request.query_params.get('export', 'json')

        if not report_type:
            return Response({
                'success': True,
                'available_reports': ['users', 'vendors', 'materials', 'encryption', 'downloads', 'audit'],
            }, status=status.HTTP_200_OK)

        if export_format == 'csv':
            response = export_csv(report_type)
        elif export_format == 'excel':
            response = export_excel(report_type)
        elif export_format == 'pdf':
            response = export_pdf(report_type)
        else:
            from .reports import get_report_rows
            rows = get_report_rows(report_type)
            if rows is None:
                return Response({'success': False, 'message': 'Invalid report type.'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'success': True, 'headers': rows[0], 'rows': rows[1:]}, status=status.HTTP_200_OK)

        if response is None:
            return Response({'success': False, 'message': 'Invalid report type.'}, status=status.HTTP_400_BAD_REQUEST)

        return response


class AdminSystemSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        settings_obj = get_or_create_settings()
        return Response({'success': True, 'data': SystemSettingSerializer(settings_obj).data}, status=status.HTTP_200_OK)

    def put(self, request):
        settings_obj = get_or_create_settings()
        serializer = SystemSettingSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            updated = update_settings(settings_obj, serializer.validated_data, request.user)
        except DjangoValidationError as exc:
            message = exc.messages[0] if hasattr(exc, 'messages') else str(exc)
            return Response({'success': False, 'message': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'success': True, 'data': SystemSettingSerializer(updated).data}, status=status.HTTP_200_OK)