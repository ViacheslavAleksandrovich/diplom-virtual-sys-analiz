from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend

from .models import StudentStatistics, TaskStatistics, ModuleStatistics, LearningPath
from .serializers import (
    StudentStatisticsSerializer, TaskStatisticsSerializer,
    ModuleStatisticsSerializer, LearningPathSerializer
)


class StudentStatisticsView(generics.RetrieveAPIView):
    """Get current user statistics."""
    
    serializer_class = StudentStatisticsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Get statistics for current user."""
        obj, _ = StudentStatistics.objects.get_or_create(student=self.request.user)
        return obj


class TaskStatisticsListView(generics.ListAPIView):
    """List task statistics."""
    
    queryset = TaskStatistics.objects.all()
    serializer_class = TaskStatisticsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['task__module', 'task__difficulty_level']
    ordering_fields = ['average_score', 'success_rate', 'total_submissions']
    ordering = ['-average_score']


class ModuleStatisticsListView(generics.ListAPIView):
    """List module statistics."""
    
    queryset = ModuleStatistics.objects.all()
    serializer_class = ModuleStatisticsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['average_completion_percent', 'students_completed']
    ordering = ['-average_completion_percent']


class LearningPathView(generics.RetrieveUpdateAPIView):
    """Get current user learning path."""
    
    serializer_class = LearningPathSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Get learning path for current user."""
        obj, _ = LearningPath.objects.get_or_create(student=self.request.user)
        return obj
