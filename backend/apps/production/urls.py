from django.urls import path
from .views import (
    ProductionDashboardView,
    AvailableEncryptedFilesView,
    RequestKeyView,
    KeyRequestsView,
    DecryptBatchView,
    DownloadFileView,
    DownloadHistoryView,
    ProductionHistoryView,
    AdminKeyRequestActionView,
)

urlpatterns = [
    path('dashboard/', ProductionDashboardView.as_view(), name='production-dashboard'),
    path('encrypted-files/', AvailableEncryptedFilesView.as_view(), name='production-encrypted-files'),
    path('request-key/<int:encrypted_file_id>/', RequestKeyView.as_view(), name='production-request-key'),
    path('key-requests/', KeyRequestsView.as_view(), name='production-key-requests'),
    path('decrypt/<int:encrypted_file_id>/', DecryptBatchView.as_view(), name='production-decrypt'),
    path('download/<int:encrypted_file_id>/', DownloadFileView.as_view(), name='production-download'),
    path('download-history/', DownloadHistoryView.as_view(), name='production-download-history'),
    path('history/', ProductionHistoryView.as_view(), name='production-history'),
    path('admin/key-request/<int:key_request_id>/action/', AdminKeyRequestActionView.as_view(), name='admin-key-request-action'),
]