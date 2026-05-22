from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .services import refresh_student_analytics, build_student_analytics_row
from .models import StudentStatistics, TaskStatistics, ModuleStatistics, LearningPath
from .serializers import (
    StudentStatisticsSerializer, TaskStatisticsSerializer,
    ModuleStatisticsSerializer, LearningPathSerializer,
    StudentAnalyticsSerializer,
)

User = get_user_model()


class StudentStatisticsView(generics.RetrieveAPIView):
    """Get current user statistics."""
    
    serializer_class = StudentStatisticsSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Get statistics for current user."""
        return refresh_student_analytics(self.request.user)


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


class StudentAnalyticsReportView(APIView):
    """Student analytics report."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        students = User.objects.filter(is_active=True).order_by('role', 'username')

        rows = [build_student_analytics_row(student) for student in students]
        serialized_rows = StudentAnalyticsSerializer(rows, many=True).data

        summary = {
            'total_users': len(rows),
            'users_with_progress': sum(1 for row in rows if row['total_tasks_completed'] > 0),
            'users_completed_modules': sum(1 for row in rows if row['completed_modules'] > 0),
            'total_completed_tasks': sum(row['total_tasks_completed'] for row in rows),
            'average_success_rate': round(
                sum(row['success_rate'] for row in rows) / len(rows), 2
            ) if rows else 0.0,
        }

        return Response(
            {
                'summary': summary,
                'results': serialized_rows,
            },
            status=status.HTTP_200_OK,
        )
