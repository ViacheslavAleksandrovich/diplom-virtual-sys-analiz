from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class CourseAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.course_app'
    verbose_name = _('Course Management')
    
    def ready(self):
        """Import signals when the app is ready."""
        # import apps.course_app.signals  # Uncomment when signals are created
        pass
