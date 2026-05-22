from rest_framework import generics, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import CourseModule, TheoryMaterial, Task, TaskResult, ModuleProgress
from .serializers import (
    CourseModuleSerializer, CourseModuleListSerializer,
    TheoryMaterialSerializer, TaskDetailSerializer, TaskListSerializer,
    TaskResultSerializer, TaskResultCreateSerializer, ModuleProgressSerializer
)


class ModuleListView(generics.ListAPIView):
    """List all course modules."""
    
    queryset = CourseModule.objects.filter(is_active=True)
    serializer_class = CourseModuleListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = []
    search_fields = ['title', 'description']
    ordering_fields = ['order_number', 'created_at']
    ordering = ['order_number']


class ModuleDetailView(generics.RetrieveAPIView):
    """Get module details with theory materials."""
    
    queryset = CourseModule.objects.filter(is_active=True)
    serializer_class = CourseModuleSerializer
    permission_classes = [permissions.IsAuthenticated]


class TheoryDetailView(generics.RetrieveAPIView):
    """Get theory material detail."""
    
    queryset = TheoryMaterial.objects.filter(is_active=True)
    serializer_class = TheoryMaterialSerializer
    permission_classes = [permissions.IsAuthenticated]


class TaskListView(generics.ListAPIView):
    """List tasks with filtering."""
    
    queryset = Task.objects.filter(is_active=True)
    serializer_class = TaskListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['module', 'task_type', 'difficulty_level']
    search_fields = ['title', 'condition_text']
    ordering_fields = ['difficulty_level', 'created_at', 'order_number']
    ordering = ['order_number']


class TaskDetailView(generics.RetrieveAPIView):
    """Get task details."""
    
    queryset = Task.objects.filter(is_active=True)
    serializer_class = TaskDetailSerializer
    permission_classes = [permissions.IsAuthenticated]


class TaskSubmitView(APIView):
    """Submit task answer and get result."""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        """Submit task answer."""
        try:
            task = Task.objects.get(pk=pk, is_active=True)
        except Task.DoesNotExist:
            return Response(
                {'detail': 'Task not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = TaskResultCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        submitted_answer = serializer.validated_data['submitted_answer']
        is_using_hint = serializer.validated_data.get('is_using_hint', False)
        
        # Get or create task result
        task_result, created = TaskResult.objects.get_or_create(
            student=request.user,
            task=task,
            defaults={
                'submitted_answer': submitted_answer,
                'is_using_hint': is_using_hint,
                'attempts_count': 1
            }
        )
        
        if not created:
            # Update existing result
            task_result.attempts_count += 1
            task_result.submitted_answer = submitted_answer
            task_result.is_using_hint = is_using_hint
        
        # Check answer (basic implementation - will be extended in checker_app)
        from apps.checker_app.checker import check_answer
        result_data = check_answer(task, submitted_answer)
        
        task_result.status = result_data['status']
        task_result.score = result_data['score']
        task_result.points_earned = result_data['points_earned']
        task_result.feedback = result_data['feedback']
        task_result.completed_at = timezone.now()
        task_result.save()
        
        # Update module progress
        self._update_module_progress(request.user, task.module)
        
        from apps.analytics_app.services import refresh_student_analytics
        refresh_student_analytics(request.user)
        
        return Response(
            TaskResultSerializer(task_result).data,
            status=status.HTTP_200_OK
        )
    
    def _update_module_progress(self, user, module):
        """Update module progress for user."""
        progress, _ = ModuleProgress.objects.get_or_create(
            student=user,
            module=module,
            defaults={'started_at': timezone.now()}
        )
        
        # Calculate progress metrics
        total_tasks = module.tasks.filter(is_active=True).count()
        completed_tasks = TaskResult.objects.filter(
            student=user,
            task__module=module,
            status__in=['correct', 'partial']
        ).count()
        
        if total_tasks > 0:
            progress.tasks_completed = completed_tasks
            progress.completion_percent = int((completed_tasks / total_tasks) * 100)
            progress.status = 'in_progress' if progress.completion_percent > 0 else 'not_started'
            
            if progress.completion_percent == 100:
                progress.status = 'completed'
                progress.completed_at = timezone.now()
            
            progress.save()


class TaskResultListView(generics.ListAPIView):
    """List task results for current user."""
    
    serializer_class = TaskResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'task__difficulty_level']
    ordering_fields = ['completed_at', 'score']
    ordering = ['-completed_at']
    
    def get_queryset(self):
        """Get results for current user."""
        return TaskResult.objects.filter(student=self.request.user)


class TaskResultDetailView(generics.RetrieveAPIView):
    """Get task result detail."""
    
    serializer_class = TaskResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get results for current user."""
        return TaskResult.objects.filter(student=self.request.user)


class ModuleProgressListView(generics.ListAPIView):
    """List module progress for current user."""
    
    serializer_class = ModuleProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['completion_percent', 'updated_at']
    ordering = ['-updated_at']
    
    def get_queryset(self):
        """Get progress for current user."""
        return ModuleProgress.objects.filter(student=self.request.user)


class ModuleProgressDetailView(generics.RetrieveAPIView):
    """Get module progress detail."""
    
    serializer_class = ModuleProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Get progress for current user."""
        return ModuleProgress.objects.filter(student=self.request.user)
