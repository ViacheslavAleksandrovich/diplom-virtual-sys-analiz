from django.db.models import Avg, Sum
from django.utils import timezone

from apps.auth_app.models import User
from apps.course_app.models import ModuleProgress, Task, TaskResult
from apps.gamification_app.models import BonusPoints, StudentRanking, UserAchievement

from .models import StudentStatistics


def refresh_student_analytics(student: User) -> StudentStatistics:
    completed_results = TaskResult.objects.filter(
        student=student,
        completed_at__isnull=False,
    ).select_related('task')

    completed_count = completed_results.filter(status__in=['correct', 'partial']).count()
    total_points = completed_results.aggregate(total=Sum('points_earned'))['total'] or 0
    average_score = completed_results.aggregate(avg=Avg('score'))['avg'] or 0.0
    average_attempts = completed_results.aggregate(avg=Avg('attempts_count'))['avg'] or 0.0
    total_learning_hours = 0.0

    for result in completed_results:
        if result.started_at and result.completed_at:
            total_learning_hours += (
                result.completed_at - result.started_at
            ).total_seconds() / 3600.0

    total_tasks_available = Task.objects.filter(is_active=True).count()
    success_rate = (completed_count / total_tasks_available * 100.0) if total_tasks_available else 0.0

    statistics, _ = StudentStatistics.objects.get_or_create(student=student)
    statistics.total_tasks_completed = completed_count
    statistics.total_points_earned = total_points
    statistics.average_score = float(average_score)
    statistics.total_learning_hours = round(total_learning_hours, 2)
    statistics.average_attempts = float(average_attempts)
    statistics.success_rate = round(success_rate, 2)
    statistics.updated_at = timezone.now()
    statistics.save()

    bonus_points = BonusPoints.objects.filter(student=student).aggregate(total=Sum('points'))['total'] or 0
    achievements_count = UserAchievement.objects.filter(user=student).count()
    ranking_points = total_points + bonus_points
    ranking_level = max(1, ranking_points // 100 + 1)

    ranking, _ = StudentRanking.objects.get_or_create(student=student)
    ranking.total_points = ranking_points
    ranking.level = ranking_level
    ranking.achievements_count = achievements_count
    ranking.experience_points = ranking_points
    ranking.save()

    return statistics
