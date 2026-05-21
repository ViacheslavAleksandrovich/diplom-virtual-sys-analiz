from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    """Custom user manager for User model."""
    
    def create_user(self, email, username, password=None, **extra_fields):
        """Create and save a regular user."""
        if not email:
            raise ValueError(_('Email field is required'))
        if not username:
            raise ValueError(_('Username field is required'))
        
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, username, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True'))
        
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Extended User model for the training simulator."""
    
    ROLE_CHOICES = (
        ('student', _('Student')),
        ('teacher', _('Teacher')),
        ('admin', _('Administrator')),
    )
    
    email = models.EmailField(_('Email Address'), unique=True, db_index=True)
    username = models.CharField(_('Username'), max_length=150, unique=True, db_index=True)
    first_name = models.CharField(_('First Name'), max_length=150, blank=True)
    last_name = models.CharField(_('Last Name'), max_length=150, blank=True)
    role = models.CharField(_('Role'), max_length=20, choices=ROLE_CHOICES, default='student')
    
    # Account status
    is_active = models.BooleanField(_('Is Active'), default=True)
    is_staff = models.BooleanField(_('Is Staff'), default=False)
    
    # Timestamps
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    last_login = models.DateTimeField(_('Last Login'), null=True, blank=True)
    
    # Additional fields
    avatar = models.ImageField(_('Avatar'), upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(_('Biography'), blank=True)
    phone_number = models.CharField(_('Phone Number'), max_length=20, blank=True)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
            models.Index(fields=['role']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def get_full_name(self):
        """Return user's full name."""
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    def is_student(self):
        """Check if user is a student."""
        return self.role == 'student'
    
    def is_teacher(self):
        """Check if user is a teacher."""
        return self.role == 'teacher'
    
    def is_admin_user(self):
        """Check if user is an administrator."""
        return self.role == 'admin'


class Group(models.Model):
    """Academic group model."""
    
    title = models.CharField(_('Group Title'), max_length=100, unique=True, db_index=True)
    description = models.TextField(_('Description'), blank=True)
    academic_year = models.CharField(
        _('Academic Year'),
        max_length=20,
        help_text=_('Format: 2023-2024')
    )
    teacher = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'teacher'},
        related_name='managed_groups',
        verbose_name=_('Teacher')
    )
    students = models.ManyToManyField(
        User,
        related_name='academic_groups',
        limit_choices_to={'role': 'student'},
        verbose_name=_('Students'),
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    
    class Meta:
        verbose_name = _('Group')
        verbose_name_plural = _('Groups')
        ordering = ['-academic_year', 'title']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['academic_year']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.academic_year})"


class PasswordReset(models.Model):
    """Model for password reset tokens."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='password_reset')
    token = models.CharField(_('Token'), max_length=200, unique=True, db_index=True)
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    expires_at = models.DateTimeField(_('Expires At'), db_index=True)
    used = models.BooleanField(_('Used'), default=False)
    
    class Meta:
        verbose_name = _('Password Reset')
        verbose_name_plural = _('Password Resets')
    
    def __str__(self):
        return f"Password reset for {self.user.email}"
    
    def is_valid(self):
        """Check if token is still valid."""
        return not self.used and timezone.now() < self.expires_at
