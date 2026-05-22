from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudentStatistics, TaskStatistics, ModuleStatistics, LearningPath

User = get_user_model()


class StudentStatisticsSerializer(serializers.ModelSerializer):
    """Serializer for StudentStatistics."""
    
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    
    class Meta:
        model = StudentStatistics
        fields = [
            'id', 'student', 'student_name', 'total_tasks_completed', 'total_points_earned',
            'average_score', 'total_learning_hours', 'average_attempts', 'success_rate', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class TaskStatisticsSerializer(serializers.ModelSerializer):
    """Serializer for TaskStatistics."""
    
    task_title = serializers.CharField(source='task.title', read_only=True)
    
    class Meta:
        model = TaskStatistics
        fields = [
            'id', 'task', 'task_title', 'total_submissions', 'successful_submissions',
            'partial_submissions', 'failed_submissions', 'success_rate', 'partial_rate',
            'average_attempts', 'average_score', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class ModuleStatisticsSerializer(serializers.ModelSerializer):
    """Serializer for ModuleStatistics."""
    
    module_title = serializers.CharField(source='module.title', read_only=True)
    
    class Meta:
        model = ModuleStatistics
        fields = [
            'id', 'module', 'module_title', 'total_students_started', 'students_completed',
            'average_completion_percent', 'average_module_score', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class LearningPathSerializer(serializers.ModelSerializer):
    """Serializer for LearningPath."""
    
    current_module_name = serializers.CharField(source='current_module.title', read_only=True)
    
    class Meta:
        model = LearningPath
        fields = [
            'id', 'student', 'current_module', 'current_module_name', 'recommendations',
            'average_tasks_per_day', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at']


class StudentAnalyticsSerializer(serializers.Serializer):
    """Serializer for admin/teacher student analytics rows."""

    id = serializers.IntegerField()
    username = serializers.CharField()
    full_name = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField()
    total_tasks_completed = serializers.IntegerField()
    total_points_earned = serializers.IntegerField()
    average_score = serializers.FloatField()
    total_learning_hours = serializers.FloatField()
    average_attempts = serializers.FloatField()
    success_rate = serializers.FloatField()
    completed_modules = serializers.IntegerField()
    average_module_completion = serializers.FloatField()
    ranking_level = serializers.IntegerField()
    ranking_points = serializers.IntegerField()
    achievements_count = serializers.IntegerField()
