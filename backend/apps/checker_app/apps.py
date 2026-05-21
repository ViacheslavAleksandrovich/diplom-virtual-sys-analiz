from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class CheckerAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.checker_app'
    verbose_name = _('Answer Checker')
    
    def ready(self):
        """Import signals when the app is ready."""
        pass
