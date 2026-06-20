from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .serializers import NotificationSerializer
from .permissions import IsOwner
from .models import Notification

from apps.common.services.notification_service import (
    get_notifications_for_user,
    get_unread_count,
    get_latest,
    mark_read,
    mark_all_read,
    delete_notification,
    delete_all_read,
    paginate,
)


class NotificationListView(APIView):
    """
    GET /api/notifications/
    Supports: ?filter=unread|read, ?search=, ?type=, ?date_from=, ?date_to=,
              ?sort=newest|oldest, ?page=, ?page_size=
    Always scoped to request.user — there is no way to pass another
    user's id through this endpoint.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = get_notifications_for_user(
            request.user,
            read_filter=request.query_params.get('filter'),
            search=request.query_params.get('search'),
            type_filter=request.query_params.get('type'),
            date_from=request.query_params.get('date_from'),
            date_to=request.query_params.get('date_to'),
            sort=request.query_params.get('sort', 'newest'),
        )

        page = request.query_params.get('page', 1)
        page_size = request.query_params.get('page_size', 20)
        result = paginate(queryset, page=page, page_size=page_size)

        return Response({
            'success': True,
            'data': NotificationSerializer(result['items'], many=True).data,
            'pagination': result['pagination'],
        }, status=status.HTTP_200_OK)


class NotificationUnreadCountView(APIView):
    """GET /api/notifications/unread-count/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = get_unread_count(request.user)
        return Response({'success': True, 'unread_count': count}, status=status.HTTP_200_OK)


class NotificationLatestView(APIView):
    """GET /api/notifications/latest/ — top 5 for the navbar dropdown."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        latest = get_latest(request.user, limit=5)
        return Response({
            'success': True,
            'data': NotificationSerializer(latest, many=True).data,
        }, status=status.HTTP_200_OK)


class NotificationMarkReadView(APIView):
    """POST /api/notifications/{id}/read/"""
    permission_classes = [IsAuthenticated, IsOwner]

    def post(self, request, notification_id):
        notification = get_object_or_404(Notification, id=notification_id)
        self.check_object_permissions(request, notification)

        mark_read(notification, request.user)
        return Response({'success': True, 'message': 'Notification marked as read.'}, status=status.HTTP_200_OK)


class NotificationMarkAllReadView(APIView):
    """POST /api/notifications/mark-all-read/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        count = mark_all_read(request.user)
        return Response({
            'success': True,
            'message': f'{count} notification(s) marked as read.',
        }, status=status.HTTP_200_OK)


class NotificationDeleteView(APIView):
    """DELETE /api/notifications/{id}/"""
    permission_classes = [IsAuthenticated, IsOwner]

    def delete(self, request, notification_id):
        notification = get_object_or_404(Notification, id=notification_id)
        self.check_object_permissions(request, notification)

        delete_notification(notification, request.user)
        return Response({'success': True, 'message': 'Notification deleted.'}, status=status.HTTP_200_OK)


class NotificationDeleteAllReadView(APIView):
    """DELETE /api/notifications/delete-all-read/"""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        count = delete_all_read(request.user)
        return Response({
            'success': True,
            'message': f'{count} read notification(s) deleted.',
        }, status=status.HTTP_200_OK)