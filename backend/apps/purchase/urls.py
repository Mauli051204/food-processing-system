from django.urls import path
from .views import (
    PurchaseDashboardView,
    VendorRequestsView,
    VendorDetailView,
    MaterialReviewView,
    EditMaterialView,
    ApproveMaterialView,
    RejectMaterialView,
    ApprovedMaterialsView,
    RejectedMaterialsView,
    SendToTechView,
    VendorApprovalTrendView,
    MaterialApprovalBreakdownView,
    ReviewActivityTrendView,
)

urlpatterns = [
    path('dashboard/', PurchaseDashboardView.as_view(), name='purchase-dashboard'),
    path('vendor-requests/', VendorRequestsView.as_view(), name='purchase-vendor-requests'),
    path('vendor/<int:vendor_id>/', VendorDetailView.as_view(), name='purchase-vendor-detail'),
    path('materials/', MaterialReviewView.as_view(), name='purchase-materials'),
    path('material/<int:material_id>/edit/', EditMaterialView.as_view(), name='purchase-material-edit'),
    path('material/<int:material_id>/approve/', ApproveMaterialView.as_view(), name='purchase-material-approve'),
    path('material/<int:material_id>/reject/', RejectMaterialView.as_view(), name='purchase-material-reject'),
    path('send-to-tech/', SendToTechView.as_view(), name='purchase-send-to-tech'),
    path('approved-materials/', ApprovedMaterialsView.as_view(), name='purchase-approved-materials'),
    path('rejected-materials/', RejectedMaterialsView.as_view(), name='purchase-rejected-materials'),
    path('vendor-approval-trend/', VendorApprovalTrendView.as_view(), name='purchase-vendor-approval-trend'),
    path('material-approval-breakdown/', MaterialApprovalBreakdownView.as_view(), name='purchase-material-approval-breakdown'),
    path('review-activity-trend/', ReviewActivityTrendView.as_view(), name='purchase-review-activity-trend'),
]