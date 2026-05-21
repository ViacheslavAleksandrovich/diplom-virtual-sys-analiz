from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from .models import Group, PasswordReset

User = get_user_model()


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for User detail view."""
    
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'avatar', 'bio', 'phone_number',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        """Get user's full name."""
        return obj.get_full_name()


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for User list view."""
    
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 'avatar', 'is_active']
        read_only_fields = ['id']
    
    def get_full_name(self, obj):
        """Get user's full name."""
        return obj.get_full_name()


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text=_('Password must be at least 8 characters long')
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label=_('Confirm Password')
    )
    
    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'password', 'password_confirm']
    
    def validate(self, data):
        """Validate that passwords match."""
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': _('Passwords do not match')})
        
        if len(data['password']) < 8:
            raise serializers.ValidationError({'password': _('Password must be at least 8 characters long')})
        
        return data
    
    def create(self, validated_data):
        """Create a new user."""
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role='student'  # Default role for new users
        )
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for user profile update."""
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'avatar', 'bio', 'phone_number']


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    
    old_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text=_('Password must be at least 8 characters long')
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label=_('Confirm Password')
    )
    
    def validate(self, data):
        """Validate passwords."""
        if data['new_password'] != data.pop('new_password_confirm'):
            raise serializers.ValidationError({
                'new_password': _('Passwords do not match')
            })
        
        if len(data['new_password']) < 8:
            raise serializers.ValidationError({
                'new_password': _('Password must be at least 8 characters long')
            })
        
        return data


class GroupListSerializer(serializers.ModelSerializer):
    """Serializer for Group list view."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    students_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'title', 'academic_year', 'teacher', 'teacher_name', 'students_count']
        read_only_fields = ['id']
    
    def get_students_count(self, obj):
        """Get count of students in group."""
        return obj.students.count()


class GroupDetailSerializer(serializers.ModelSerializer):
    """Serializer for Group detail view."""
    
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    students = UserListSerializer(many=True, read_only=True)
    
    class Meta:
        model = Group
        fields = ['id', 'title', 'description', 'academic_year', 'teacher', 'teacher_name', 'students']
        read_only_fields = ['id']


class GroupCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for Group creation and update."""
    
    class Meta:
        model = Group
        fields = ['title', 'description', 'academic_year', 'teacher', 'students']
