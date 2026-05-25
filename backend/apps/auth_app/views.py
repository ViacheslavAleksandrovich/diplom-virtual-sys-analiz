from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.mail import send_mail
from datetime import timedelta
import uuid

from .models import Group, PasswordReset
from .permissions import IsAdmin, IsAdminOrTeacher
from .serializers import (
    UserDetailSerializer, UserListSerializer, UserCreateSerializer,
    UserUpdateSerializer, ChangePasswordSerializer,
    GroupListSerializer, GroupDetailSerializer, GroupCreateUpdateSerializer
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""
    
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        """Override create to return tokens after registration."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserDetailSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """User login endpoint."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Authenticate user and return tokens."""
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'detail': _('Email and password are required.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to authenticate
        user = authenticate(username=email, password=password)
        
        if user is None:
            # Try with username
            try:
                user_obj = User.objects.get(username=email)
                user = authenticate(username=user_obj.email, password=password)
            except User.DoesNotExist:
                return Response(
                    {'detail': _('Invalid credentials.')},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        if user is None:
            return Response(
                {'detail': _('Invalid credentials.')},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'detail': _('User account is disabled.')},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Update last login
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserDetailSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """User logout endpoint."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Logout user."""
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response(
                {'detail': _('Successfully logged out.')},
                status=status.HTTP_200_OK
            )
        except Exception:
            return Response(
                {'detail': _('Invalid token.')},
                status=status.HTTP_400_BAD_REQUEST
            )


class PasswordResetRequestView(APIView):
    """Request password reset endpoint."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Send password reset email."""
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'detail': _('Email is required.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if user exists
            return Response(
                {'detail': _('If an account with that email exists, a password reset link has been sent.')},
                status=status.HTTP_200_OK
            )
        
        # Generate reset token
        token = str(uuid.uuid4())
        expires_at = timezone.now() + timedelta(hours=24)
        
        PasswordReset.objects.filter(user=user).delete()
        PasswordReset.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
        
        # Send email (in production)
        reset_url = f"{request.build_absolute_uri('/')[:-1]}/reset/{token}/"
        
        try:
            send_mail(
                _('Password Reset Request'),
                f"Click the link to reset your password: {reset_url}",
                'noreply@sys-analiz.com',
                [user.email],
                fail_silently=True,
            )
        except Exception:
            pass
        
        return Response(
            {'detail': _('If an account with that email exists, a password reset link has been sent.')},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(APIView):
    """Confirm password reset endpoint."""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, token):
        """Confirm password reset with token."""
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response(
                {'detail': _('New password is required.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            reset = PasswordReset.objects.get(token=token)
        except PasswordReset.DoesNotExist:
            return Response(
                {'detail': _('Invalid or expired reset token.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not reset.is_valid():
            return Response(
                {'detail': _('Reset token has expired.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update password
        user = reset.user
        user.set_password(new_password)
        user.save()
        
        # Mark token as used
        reset.used = True
        reset.save()
        
        return Response(
            {'detail': _('Password has been reset successfully.')},
            status=status.HTTP_200_OK
        )


class UserProfileView(generics.RetrieveAPIView):
    """Get current user profile."""
    
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Get current user."""
        return self.request.user


class UserUpdateView(generics.UpdateAPIView):
    """Update current user profile."""
    
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Get current user."""
        return self.request.user


class ChangePasswordView(APIView):
    """Change current user password."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Change user password."""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        # Check old password
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'detail': _('Old password is incorrect.')},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response(
            {'detail': _('Password has been changed successfully.')},
            status=status.HTTP_200_OK
        )


class UserDetailView(generics.RetrieveAPIView):
    """Get user detail."""
    
    queryset = User.objects.all()
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserListView(generics.ListAPIView):
    """List users — restricted to admin and teacher roles."""
    
    queryset = User.objects.all()
    serializer_class = UserListSerializer
    permission_classes = [IsAdminOrTeacher]
    filterset_fields = ['role', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['created_at', 'username', 'email']
    ordering = ['-created_at']


class GroupListCreateView(generics.ListCreateAPIView):
    """List and create groups."""
    
    queryset = Group.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['academic_year', 'teacher']
    search_fields = ['title']
    ordering_fields = ['academic_year', 'created_at']
    ordering = ['-academic_year', '-created_at']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        request_method = getattr(getattr(self, 'request', None), 'method', None)
        if request_method == 'POST':
            return GroupCreateUpdateSerializer
        return GroupListSerializer
    
    def get_permissions(self):
        """Check permissions based on method."""
        request_method = getattr(getattr(self, 'request', None), 'method', None)
        if request_method == 'POST':
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()


class GroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete group."""
    
    queryset = Group.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        request_method = getattr(getattr(self, 'request', None), 'method', None)
        if request_method in ['PUT', 'PATCH']:
            return GroupCreateUpdateSerializer
        return GroupDetailSerializer
