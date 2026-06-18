from django.urls import path
from .views import (
    LoginView,
    LogoutView,
    CurrentUserView,
    SessionCheckView,
    AdminTestView,
    VendorTestView,
    PurchaseTestView,
    TechTestView,
    ProductionTestView,
)
from .views import VendorRegisterView  # kept from Phase 1, not part of Phase 3 scope

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('check-session/', SessionCheckView.as_view(), name='check-session'),
    path('register/vendor/', VendorRegisterView.as_view(), name='vendor-register'),
]