from django.urls import path
from .views import (
    NotificationListView,
    NotificationUnreadCountView,
    NotificationLatestView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
    NotificationDeleteView,
    NotificationDeleteAllReadView,
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('unread-count/', NotificationUnreadCountView.as_view(), name='notification-unread-count'),
    path('latest/', NotificationLatestView.as_view(), name='notification-latest'),
    path('<int:notification_id>/read/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('mark-all-read/', NotificationMarkAllReadView.as_view(), name='notification-mark-all-read'),
    path('<int:notification_id>/', NotificationDeleteView.as_view(), name='notification-delete'),
    path('delete-all-read/', NotificationDeleteAllReadView.as_view(), name='notification-delete-all-read'),
]