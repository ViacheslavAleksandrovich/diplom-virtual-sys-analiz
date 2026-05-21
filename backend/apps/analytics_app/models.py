from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from apps.course_app.models import CourseModule, Task

User = get_user_model()


class StudentStatistics(models.Model):
    """Aggregated statistics for a student."""
    
    student = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='statistics',
        verbose_name=_('Student'),
        limit_choices_to={'role': 'student'}
    )
    
    # Overall metrics
    total_tasks_completed = models.PositiveIntegerField(_('Total Tasks Completed'), default=0)
    total_points_earned = models.PositiveIntegerField(_('Total Points Earned'), default=0)
    average_score = models.FloatField(_('Average Score'), default=0.0)
    
    # Timing metrics
    total_learning_hours = models.FloatField(_('Total Learning Hours'), default=0.0)
    average_attempts = models.FloatField(_('Average Attempts'), default=0.0)
    
    # Success metrics
    success_rate = models.FloatField(_('Success Rate (%)'), default=0.0)
    
    # Updated timestamp
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    
    class Meta:
        verbose_name = _('Student Statistics')
        verbose_name_plural = _('Student Statistics')
    
    def __str__(self):
        return f"Statistics for {self.student.username}"


class TaskStatistics(models.Model):
    """Aggregated statistics for a task across all students."""
    
    task = models.OneToOneField(
        Task,
        on_delete=models.CASCADE,
        related_name='statistics',
        verbose_name=_('Task')
    )
    
    # Completion metrics
    total_submissions = models.PositiveIntegerField(_('Total Submissions'), default=0)
    successful_submissions = models.PositiveIntegerField(_('Successful Submissions'), default=0)
    partial_submissions = models.PositiveIntegerField(_('Partial Submissions'), default=0)
    failed_submissions = models.PositiveIntegerField(_('Failed Submissions'), default=0)
    
    # Success rate
    success_rate = models.FloatField(_('Success Rate (%)'), default=0.0)
    partial_rate = models.FloatField(_('Partial Rate (%)'), default=0.0)
    
    # Average attempts
    average_attempts = models.FloatField(_('Average Attempts'), default=1.0)
    
    # Average score
    average_score = models.FloatField(_('Average Score'), default=0.0)
    
    # Updated timestamp
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    
    class Meta:
        verbose_name = _('Task Statistics')
        verbose_name_plural = _('Task Statistics')
    
    def __str__(self):
        return f"Statistics for {self.task.title}"


class ModuleStatistics(models.Model):
    """Aggregated statistics for a module across all students."""
    
    module = models.OneToOneField(
        CourseModule,
        on_delete=models.CASCADE,
        related_name='statistics',
        verbose_name=_('Module')
    )
    
    # Student progress
    total_students_started = models.PositiveIntegerField(_('Total Students Started'), default=0)
    students_completed = models.PositiveIntegerField(_('Students Completed'), default=0)
    
    # Average progress
    average_completion_percent = models.FloatField(_('Average Completion (%)'), default=0.0)
    
    # Average score
    average_module_score = models.FloatField(_('Average Module Score'), default=0.0)
    
    # Updated timestamp
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    
    class Meta:
        verbose_name = _('Module Statistics')
        verbose_name_plural = _('Module Statistics')
    
    def __str__(self):
        return f"Statistics for {self.module.title}"


class LearningPath(models.Model):
    """Track student's learning path and recommendations."""
    
    student = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='learning_path',
        verbose_name=_('Student'),
        limit_choices_to={'role': 'student'}
    )
    
    # Current progress
    current_module = models.ForeignKey(
        CourseModule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_learners',
        verbose_name=_('Current Module')
    )
    
    # Recommendations (stored as JSON)
    recommendations = models.JSONField(
        _('Recommendations'),
        default=list,
        help_text=_('AI-generated learning recommendations')
    )
    
    # Pacing (average tasks per day)
    average_tasks_per_day = models.FloatField(_('Average Tasks Per Day'), default=0.0)
    
    # Updated timestamp
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    
    class Meta:
        verbose_name = _('Learning Path')
        verbose_name_plural = _('Learning Paths')
    
    def __str__(self):
        return f"Learning path for {self.student.username}"
