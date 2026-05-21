from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class GamificationAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.gamification_app'
    verbose_name = _('Gamification')
    
    def ready(self):
        """Import signals when the app is ready."""
        # import apps.gamification_app.signals  # Uncomment when signals are created
        pass
