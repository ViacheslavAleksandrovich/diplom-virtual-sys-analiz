from django.contrib import admin
from .models import StudentStatistics, TaskStatistics, ModuleStatistics, LearningPath


@admin.register(StudentStatistics)
class StudentStatisticsAdmin(admin.ModelAdmin):
    """Admin interface for StudentStatistics."""
    
    list_display = ['student', 'total_tasks_completed', 'total_points_earned', 'average_score', 'success_rate']
    search_fields = ['student__username', 'student__email']
    readonly_fields = ['updated_at']


@admin.register(TaskStatistics)
class TaskStatisticsAdmin(admin.ModelAdmin):
    """Admin interface for TaskStatistics."""
    
    list_display = ['task', 'total_submissions', 'success_rate', 'average_attempts', 'average_score']
    search_fields = ['task__title']
    readonly_fields = ['updated_at']


@admin.register(ModuleStatistics)
class ModuleStatisticsAdmin(admin.ModelAdmin):
    """Admin interface for ModuleStatistics."""
    
    list_display = ['module', 'total_students_started', 'students_completed', 'average_completion_percent']
    search_fields = ['module__title']
    readonly_fields = ['updated_at']


@admin.register(LearningPath)
class LearningPathAdmin(admin.ModelAdmin):
    """Admin interface for LearningPath."""
    
    list_display = ['student', 'current_module', 'average_tasks_per_day']
    search_fields = ['student__username', 'student__email']
    readonly_fields = ['updated_at']
