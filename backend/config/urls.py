from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from rest_framework import permissions
from rest_framework.renderers import JSONOpenAPIRenderer
from rest_framework.schemas import get_schema_view

schema_view = get_schema_view(
    title='Virtual Training Simulator API',
    description='API schema for the virtual training simulator.',
    version='1.0.0',
    public=True,
    permission_classes=[permissions.AllowAny],
    renderer_classes=[JSONOpenAPIRenderer],
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/docs/', schema_view, name='api-docs'),
    
    # Apps URLs
    path('api/auth/', include('apps.auth_app.urls')),
    path('api/courses/', include('apps.course_app.urls')),
    path('api/', include('apps.course_app.urls_compat')),
    path('api/checker/', include('apps.checker_app.urls')),
    path('api/analytics/', include('apps.analytics_app.urls')),
    path('api/gamification/', include('apps.gamification_app.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
