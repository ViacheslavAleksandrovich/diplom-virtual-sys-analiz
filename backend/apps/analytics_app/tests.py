from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apps.course_app.models import CourseModule, Task, TaskResult
from apps.gamification_app.models import BonusPoints, StudentRanking

from .services import refresh_student_analytics


User = get_user_model()


class StudentAnalyticsSyncTests(TestCase):
    def test_refresh_student_analytics_uses_task_results(self):
        student = User.objects.create_user(
            email='student@example.com',
            username='student',
            password='password123',
            role='student',
        )
        module = CourseModule.objects.create(
            title='Module 1',
            description='Demo module',
            order_number=1,
            is_active=True,
        )
        task_1 = Task.objects.create(
            module=module,
            title='Task 1',
            task_type='multiple_choice',
            difficulty_level=1,
            condition_text='Choose A',
            reference_answer={'answer': 'A'},
            points=10,
            is_active=True,
            order_number=1,
        )
        task_2 = Task.objects.create(
            module=module,
            title='Task 2',
            task_type='multiple_choice',
            difficulty_level=1,
            condition_text='Choose B',
            reference_answer={'answer': 'B'},
            points=10,
            is_active=True,
            order_number=2,
        )

        TaskResult.objects.create(
            student=student,
            task=task_1,
            submitted_answer={'selected': 'A'},
            status='correct',
            score=100,
            points_earned=10,
            attempts_count=1,
            completed_at=timezone.now(),
            feedback='',
            is_using_hint=False,
        )
        TaskResult.objects.create(
            student=student,
            task=task_2,
            submitted_answer={'selected': 'C'},
            status='incorrect',
            score=0,
            points_earned=0,
            attempts_count=2,
            completed_at=timezone.now(),
            feedback='',
            is_using_hint=False,
        )
        BonusPoints.objects.create(
            student=student,
            points=120,
            bonus_type='bonus',
            description='Manual bonus',
        )

        stats = refresh_student_analytics(student)
        ranking = StudentRanking.objects.get(student=student)

        self.assertEqual(stats.total_tasks_completed, 1)
        self.assertEqual(stats.total_points_earned, 10)
        self.assertEqual(stats.success_rate, 50.0)
        self.assertAlmostEqual(stats.average_attempts, 1.5)
        self.assertEqual(ranking.total_points, 130)
        self.assertEqual(ranking.level, 2)
