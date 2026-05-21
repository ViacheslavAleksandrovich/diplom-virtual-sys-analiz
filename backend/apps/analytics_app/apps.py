from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class AnalyticsAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.analytics_app'
    verbose_name = _('Analytics and Reporting')
    
    def ready(self):
        """Import signals when the app is ready."""
        # import apps.analytics_app.signals  # Uncomment when signals are created
        pass
