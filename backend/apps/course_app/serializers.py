from rest_framework import serializers
from .models import CourseModule, TheoryMaterial, Task, TaskResult, ModuleProgress


class TheoryMaterialSerializer(serializers.ModelSerializer):
    """Serializer for TheoryMaterial."""
    
    class Meta:
        model = TheoryMaterial
        fields = ['id', 'title', 'html_content', 'attachment', 'video_url', 'order_number', 'is_active']
        read_only_fields = ['id']


class CourseModuleSerializer(serializers.ModelSerializer):
    """Serializer for CourseModule with theory materials."""
    
    theory_materials = TheoryMaterialSerializer(many=True, read_only=True)
    
    class Meta:
        model = CourseModule
        fields = ['id', 'title', 'description', 'order_number', 'is_active', 'estimated_hours', 
                  'icon', 'theory_materials', 'created_at']
        read_only_fields = ['id', 'created_at']


class CourseModuleListSerializer(serializers.ModelSerializer):
    """Serializer for CourseModule list view (without details)."""
    
    class Meta:
        model = CourseModule
        fields = ['id', 'title', 'description', 'order_number', 'is_active', 'estimated_hours', 'icon']
        read_only_fields = ['id']


class TaskDetailSerializer(serializers.ModelSerializer):
    """Serializer for Task detail view."""
    
    difficulty_level_display = serializers.CharField(source='get_difficulty_level_display', read_only=True)
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)
    module_title = serializers.CharField(source='module.title', read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'module', 'module_title', 'title', 'task_type', 'task_type_display', 'difficulty_level',
            'difficulty_level_display', 'condition_text', 'explanation', 'reference_answer',
            'tolerance', 'is_active', 'points', 'order_number', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class TaskListSerializer(serializers.ModelSerializer):
    """Serializer for Task list view."""
    
    difficulty_level_display = serializers.CharField(source='get_difficulty_level_display', read_only=True)
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)
    module_title = serializers.CharField(source='module.title', read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'module', 'module_title', 'title', 'task_type', 'task_type_display', 'difficulty_level',
            'difficulty_level_display', 'points', 'order_number'
        ]
        read_only_fields = ['id']


class TaskResultSerializer(serializers.ModelSerializer):
    """Serializer for TaskResult."""
    
    task_title = serializers.CharField(source='task.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = TaskResult
        fields = [
            'id', 'task', 'task_title', 'submitted_answer', 'status', 'status_display',
            'score', 'points_earned', 'attempts_count', 'is_using_hint', 'feedback',
            'started_at', 'completed_at'
        ]
        read_only_fields = ['id', 'status', 'score', 'points_earned', 'feedback', 
                           'started_at', 'completed_at']


class TaskResultCreateSerializer(serializers.ModelSerializer):
    """Serializer for submitting task result."""
    
    class Meta:
        model = TaskResult
        fields = ['task', 'submitted_answer', 'is_using_hint']


class ModuleProgressSerializer(serializers.ModelSerializer):
    """Serializer for ModuleProgress."""
    
    module_title = serializers.CharField(source='module.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ModuleProgress
        fields = [
            'id', 'module', 'module_title', 'completion_percent', 'theory_viewed_percent',
            'tasks_completed', 'total_score', 'status', 'status_display', 'started_at', 
            'completed_at', 'updated_at'
        ]
        read_only_fields = ['id', 'started_at', 'completed_at', 'updated_at']
