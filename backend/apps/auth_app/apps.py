from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class AuthAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.auth_app'
    verbose_name = _('Authentication and Authorization')
    
    def ready(self):
        """Import signals when the app is ready."""
        # import apps.auth_app.signals  # Uncomment when signals are created
        pass
