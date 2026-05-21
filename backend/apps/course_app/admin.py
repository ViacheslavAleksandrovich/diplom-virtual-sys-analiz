from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from .models import CourseModule, TheoryMaterial, Task, TaskResult, ModuleProgress


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    """Admin interface for CourseModule model."""
    
    list_display = ['order_number', 'title', 'is_active', 'estimated_hours', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['title', 'description']
    ordering = ['order_number']
    
    fieldsets = (
        (None, {'fields': ('title', 'description', 'order_number')}),
        (_('Settings'), {'fields': ('is_active', 'estimated_hours', 'icon')}),
        (_('Dates'), {'fields': ('created_at', 'updated_at')}),
    )
    
    readonly_fields = ['created_at', 'updated_at']


class TheoryMaterialInline(admin.TabularInline):
    """Inline admin for TheoryMaterial."""
    
    model = TheoryMaterial
    extra = 1
    fields = ['order_number', 'title', 'is_active']


@admin.register(TheoryMaterial)
class TheoryMaterialAdmin(admin.ModelAdmin):
    """Admin interface for TheoryMaterial model."""
    
    list_display = ['title', 'module', 'order_number', 'is_active']
    list_filter = ['module', 'is_active', 'created_at']
    search_fields = ['title', 'html_content']
    ordering = ['module', 'order_number']
    
    fieldsets = (
        (None, {'fields': ('module', 'title', 'order_number', 'html_content')}),
        (_('Multimedia'), {'fields': ('attachment', 'video_url')}),
        (_('Settings'), {'fields': ('is_active',)}),
        (_('Dates'), {'fields': ('created_at', 'updated_at')}),
    )
    
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Admin interface for Task model."""
    
    list_display = ['title', 'module', 'task_type', 'difficulty_level_badge', 'points', 'is_active']
    list_filter = ['module', 'task_type', 'difficulty_level', 'is_active', 'created_at']
    search_fields = ['title', 'condition_text']
    ordering = ['module', 'order_number', 'difficulty_level']
    
    fieldsets = (
        (None, {'fields': ('module', 'title', 'task_type', 'difficulty_level', 'order_number')}),
        (_('Content'), {'fields': ('condition_text', 'explanation')}),
        (_('Answer'), {'fields': ('reference_answer', 'tolerance')}),
        (_('Settings'), {'fields': ('is_active', 'points')}),
        (_('Dates'), {'fields': ('created_at', 'updated_at')}),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def difficulty_level_badge(self, obj):
        """Display difficulty level as a badge."""
        colors = {1: '#28a745', 2: '#ffc107', 3: '#dc3545'}
        color = colors.get(obj.difficulty_level, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">'
            'Level {}</span>',
            color,
            obj.difficulty_level
        )
    difficulty_level_badge.short_description = _('Difficulty Level')


@admin.register(TaskResult)
class TaskResultAdmin(admin.ModelAdmin):
    """Admin interface for TaskResult model."""
    
    list_display = ['student', 'task', 'status_badge', 'score', 'attempts_count', 'completed_at']
    list_filter = ['status', 'task__difficulty_level', 'completed_at']
    search_fields = ['student__username', 'student__email', 'task__title']
    ordering = ['-completed_at']
    readonly_fields = ['student', 'task', 'submitted_answer', 'started_at', 'completed_at']
    
    fieldsets = (
        (None, {'fields': ('student', 'task')}),
        (_('Submission'), {'fields': ('submitted_answer', 'status', 'score', 'points_earned')}),
        (_('Metadata'), {'fields': ('attempts_count', 'is_using_hint')}),
        (_('Feedback'), {'fields': ('feedback',)}),
        (_('Dates'), {'fields': ('started_at', 'completed_at')}),
    )
    
    def status_badge(self, obj):
        """Display status as a badge."""
        colors = {
            'correct': '#28a745',
            'partial': '#ffc107',
            'incorrect': '#dc3545',
            'pending': '#6c757d'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">'
            '{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = _('Status')


@admin.register(ModuleProgress)
class ModuleProgressAdmin(admin.ModelAdmin):
    """Admin interface for ModuleProgress model."""
    
    list_display = ['student', 'module', 'completion_percent_bar', 'status', 'updated_at']
    list_filter = ['status', 'module', 'updated_at']
    search_fields = ['student__username', 'student__email', 'module__title']
    ordering = ['-updated_at']
    readonly_fields = ['student', 'module', 'started_at', 'completed_at', 'updated_at']
    
    fieldsets = (
        (None, {'fields': ('student', 'module')}),
        (_('Progress'), {
            'fields': (
                'completion_percent', 'theory_viewed_percent', 'tasks_completed', 'total_score'
            )
        }),
        (_('Status'), {'fields': ('status',)}),
        (_('Dates'), {'fields': ('started_at', 'completed_at', 'updated_at')}),
    )
    
    def completion_percent_bar(self, obj):
        """Display completion percentage as a progress bar."""
        return format_html(
            '<div style="width: 100px; height: 20px; background-color: #e9ecef; border-radius: 3px; '
            'overflow: hidden;">'
            '<div style="width: {}%; height: 100%; background-color: #28a745;"></div>'
            '</div> {}%',
            obj.completion_percent,
            obj.completion_percent
        )
    completion_percent_bar.short_description = _('Progress')
