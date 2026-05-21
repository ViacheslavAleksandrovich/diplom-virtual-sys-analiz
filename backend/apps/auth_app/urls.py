from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'auth_app'

urlpatterns = [
    # Authentication
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password-reset/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/<str:token>/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # User management
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('profile/update/', views.UserUpdateView.as_view(), name='user_update'),
    path('password-change/', views.ChangePasswordView.as_view(), name='password_change'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('users/', views.UserListView.as_view(), name='user_list'),
    
    # Groups
    path('groups/', views.GroupListCreateView.as_view(), name='group_list_create'),
    path('groups/<int:pk>/', views.GroupDetailView.as_view(), name='group_detail'),
]
