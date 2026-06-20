from django.urls import path
from .views import (
    TechDashboardView,
    ReceivedMaterialsView,
    GenerateTxtView,
    EncryptBatchView,
    EncryptionHistoryView,
    EncryptionDetailView,
    EncryptedFilesListView,
    EncryptionTrendView,
    EncryptionStatusBreakdownView,
    TechStatisticsView,
)

urlpatterns = [
    path('dashboard/', TechDashboardView.as_view(), name='tech-dashboard'),
    path('materials/', ReceivedMaterialsView.as_view(), name='tech-materials'),
    path('generate-txt/<str:batch_id>/', GenerateTxtView.as_view(), name='tech-generate-txt'),
    path('encrypt/<str:batch_id>/', EncryptBatchView.as_view(), name='tech-encrypt'),
    path('history/', EncryptionHistoryView.as_view(), name='tech-history'),
    path('history/<int:pk>/', EncryptionDetailView.as_view(), name='tech-history-detail'),
    path('encrypted-files/', EncryptedFilesListView.as_view(), name='tech-encrypted-files'),
    path('encryption-trend/', EncryptionTrendView.as_view(), name='tech-encryption-trend'),
    path('encryption-status-breakdown/', EncryptionStatusBreakdownView.as_view(), name='tech-encryption-status-breakdown'),
    path('statistics/', TechStatisticsView.as_view(), name='tech-statistics'),
]