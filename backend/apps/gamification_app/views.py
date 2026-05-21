from django.contrib.auth import get_user_model
from django.db.models import F
from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Achievement, UserAchievement, StudentRanking, BonusPoints
from .serializers import (
    AchievementSerializer,
    UserAchievementSerializer,
    StudentRankingSerializer,
    BonusPointsSerializer,
    AssignAchievementSerializer,
)

User = get_user_model()


class AchievementListView(generics.ListAPIView):
    """List all active achievements metadata."""

    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'condition_code']
    ordering_fields = ['created_at', 'bonus_points', 'rarity']
    ordering = ['-created_at']


class MyAchievementsView(generics.ListAPIView):
    """List achievements earned by current user."""

    serializer_class = UserAchievementSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ['-earned_at']

    def get_queryset(self):
        return UserAchievement.objects.filter(user=self.request.user).select_related('achievement', 'user')


class RankingListView(generics.ListAPIView):
    """Global students leaderboard."""

    queryset = StudentRanking.objects.all().select_related('student')
    serializer_class = StudentRankingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['total_points', 'level', 'experience_points']
    ordering = ['-total_points', '-level', '-experience_points']


class MyRankingView(generics.RetrieveAPIView):
    """Get current user ranking row."""

    serializer_class = StudentRankingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        ranking, _ = StudentRanking.objects.get_or_create(student=self.request.user)
        return ranking


class BonusPointsListView(generics.ListAPIView):
    """List bonus points for current user."""

    serializer_class = BonusPointsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['earned_at', 'points']
    ordering = ['-earned_at']

    def get_queryset(self):
        return BonusPoints.objects.filter(student=self.request.user).select_related('student')


class AssignAchievementView(APIView):
    """Assign achievement to student and update ranking."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role not in ['teacher', 'admin']:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = AssignAchievementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data['user_id']
        achievement_id = serializer.validated_data['achievement_id']

        try:
            student = User.objects.get(id=user_id, role='student')
        except User.DoesNotExist:
            return Response({'detail': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            achievement = Achievement.objects.get(id=achievement_id)
        except Achievement.DoesNotExist:
            return Response({'detail': 'Achievement not found.'}, status=status.HTTP_404_NOT_FOUND)

        user_achievement, created = UserAchievement.objects.get_or_create(
            user=student,
            achievement=achievement,
        )
        if not created:
            return Response(
                {'detail': 'Achievement already assigned.'},
                status=status.HTTP_200_OK,
            )

        BonusPoints.objects.create(
            student=student,
            points=achievement.bonus_points,
            bonus_type='achievement',
            description=f'Achievement unlocked: {achievement.title}',
        )

        ranking, _ = StudentRanking.objects.get_or_create(student=student)
        ranking.total_points = F('total_points') + achievement.bonus_points
        ranking.achievements_count = F('achievements_count') + 1
        ranking.experience_points = F('experience_points') + achievement.bonus_points
        ranking.save(update_fields=['total_points', 'achievements_count', 'experience_points', 'updated_at'])
        ranking.refresh_from_db()

        return Response(
            {
                'detail': 'Achievement assigned.',
                'achievement': UserAchievementSerializer(user_achievement).data,
                'ranking': StudentRankingSerializer(ranking).data,
            },
            status=status.HTTP_201_CREATED,
        )
