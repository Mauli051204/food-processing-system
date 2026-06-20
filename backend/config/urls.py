# C:\Mauli\GradTwin\Project\food-processing-system\backend\config\urls.py 
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.accounts.views import (
    AdminTestView,
    VendorTestView,
    PurchaseTestView,
    TechTestView,
    ProductionTestView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/vendor/', include('apps.vendors.urls')),
    path('api/purchase/', include('apps.purchase.urls')),
    path('api/tech/', include('apps.tech.urls')),
    path('api/production/', include('apps.production.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/dashboard/', include('apps.dashboard.urls')),
    path('api/admin/', include('apps.admin_panel.urls')),

    path('api/test/admin/', AdminTestView.as_view(), name='test-admin'),
    path('api/test/vendor/', VendorTestView.as_view(), name='test-vendor'),
    path('api/test/purchase/', PurchaseTestView.as_view(), name='test-purchase'),
    path('api/test/tech/', TechTestView.as_view(), name='test-tech'),
    path('api/test/production/', ProductionTestView.as_view(), name='test-production'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)