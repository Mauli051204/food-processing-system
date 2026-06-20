from django.urls import path
from .views import (
    VendorRegisterView,
    VendorDashboardView,
    VendorUploadView,
    VendorUploadHistoryView,
    VendorMaterialsView,
    SendToPurchaseView,
    VendorProfileView,
    VendorUploadTrendView,
    VendorMaterialStatusView,
)

urlpatterns = [
    path('register/', VendorRegisterView.as_view(), name='vendor-register'),
    path('dashboard/', VendorDashboardView.as_view(), name='vendor-dashboard'),
    path('upload/', VendorUploadView.as_view(), name='vendor-upload'),
    path('uploads/', VendorUploadHistoryView.as_view(), name='vendor-uploads'),
    path('materials/', VendorMaterialsView.as_view(), name='vendor-materials'),
    path('send-to-purchase/', SendToPurchaseView.as_view(), name='vendor-send-to-purchase'),
    path('profile/', VendorProfileView.as_view(), name='vendor-profile'),
    path('upload-trend/', VendorUploadTrendView.as_view(), name='vendor-upload-trend'),
    path('material-status/', VendorMaterialStatusView.as_view(), name='vendor-material-status'),
]