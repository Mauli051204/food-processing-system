from django.urls import path
from .views import (
    LoginView,
    LogoutView,
    CurrentUserView,
    SessionCheckView,
    CSRFTokenView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('check-session/', SessionCheckView.as_view(), name='check-session'),
    path('csrf/', CSRFTokenView.as_view(), name='csrf-token'),
]