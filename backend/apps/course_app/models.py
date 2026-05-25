from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
import json

User = get_user_model()


class CourseModule(models.Model):
    """Course module/topic model."""
    
    title = models.CharField(_('Title'), max_length=255, db_index=True)
    description = models.TextField(_('Description'), blank=True)
    order_number = models.PositiveIntegerField(_('Order Number'), default=0, db_index=True)
    is_active = models.BooleanField(_('Is Active'), default=True, db_index=True)
    
    # Additional fields
    estimated_hours = models.PositiveIntegerField(_('Estimated Hours'), default=1)
    icon = models.CharField(_('Icon'), max_length=50, blank=True, default='book')
    
    # Timestamps
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    
    class Meta:
        verbose_name = _('Course Module')
        verbose_name_plural = _('Course Modules')
        ordering = ['order_number', 'title']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['is_active']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.order_number}. {self.title}"


class TheoryMaterial(models.Model):
    """Theory material for course modules."""
    
    module = models.ForeignKey(
        CourseModule,
        on_delete=models.CASCADE,
        related_name='theory_materials',
        verbose_name=_('Module')
    )
    
    title = models.CharField(_('Title'), max_length=255, db_index=True)
    html_content = models.TextField(_('HTML Content'), help_text=_('Theory content in HTML format'))
    order_number = models.PositiveIntegerField(_('Order Number'), default=0)
    is_active = models.BooleanField(_('Is Active'), default=True)
    
    # For multimedia support
    attachment = models.FileField(_('Attachment'), upload_to='theory_materials/', null=True, blank=True)
    video_url = models.URLField(_('Video URL'), blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    
    class Meta:
        verbose_name = _('Theory Material')
        verbose_name_plural = _('Theory Materials')
        ordering = ['module', 'order_number', 'title']
        indexes = [
            models.Index(fields=['module', 'order_number']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.module.title} - {self.title}"


class Task(models.Model):
    """Practical task model."""
    
    TASK_TYPES = (
        ('multiple_choice', _('Multiple Choice')),
        ('text_answer', _('Text Answer')),
        ('calculation', _('Calculation')),
        ('matrix', _('Matrix/AHP')),
        ('hierarchy', _('Hierarchy/Diagram')),
    )
    
    DIFFICULTY_LEVELS = (
        (1, _('Level 1 - Reproductive')),
        (2, _('Level 2 - Analytical')),
        (3, _('Level 3 - Creative')),
    )
    
    module = models.ForeignKey(
        CourseModule,
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name=_('Module')
    )
    
    title = models.CharField(_('Title'), max_length=255, db_index=True)
    task_type = models.CharField(_('Task Type'), max_length=50, choices=TASK_TYPES)
    difficulty_level = models.PositiveIntegerField(
        _('Difficulty Level'),
        choices=DIFFICULTY_LEVELS,
        default=1
    )
    
    # Task content
    condition_text = models.TextField(_('Task Condition'), help_text=_('Task description in HTML format'))
    explanation = models.TextField(_('Explanation'), blank=True, help_text=_('Explanation for correct answer'))
    
    # Answer information (stored as JSON)
    reference_answer = models.JSONField(
        _('Reference Answer'),
        help_text=_('Correct answer in JSON format')
    )
    
    # Tolerance for numerical answers
    tolerance = models.FloatField(
        _('Tolerance'),
        default=0.01,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text=_('Acceptable error margin for calculations')
    )
    
    # Answer options (for multiple_choice tasks)
    options = models.JSONField(
        _('Options'),
        blank=True,
        null=True,
        help_text=_('Answer options for multiple choice, e.g. [{"key":"A","text":"..."}]')
    )

    # Additional settings
    is_active = models.BooleanField(_('Is Active'), default=True)
    points = models.PositiveIntegerField(_('Points'), default=10)
    order_number = models.PositiveIntegerField(_('Order Number'), default=0)
    
    # Timestamps
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    
    class Meta:
        verbose_name = _('Task')
        verbose_name_plural = _('Tasks')
        ordering = ['module', 'order_number', 'difficulty_level']
        indexes = [
            models.Index(fields=['module', 'difficulty_level']),
            models.Index(fields=['task_type']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.module.title} - {self.title} (Level {self.difficulty_level})"


class TaskResult(models.Model):
    """Student's task result and submission."""
    
    STATUS_CHOICES = (
        ('pending', _('Pending')),
        ('correct', _('Correct')),
        ('partial', _('Partial')),
        ('incorrect', _('Incorrect')),
    )
    
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='task_results',
        verbose_name=_('Student'),
        limit_choices_to={'role': 'student'}
    )
    
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='results',
        verbose_name=_('Task')
    )
    
    # Submission data
    submitted_answer = models.JSONField(_('Submitted Answer'))
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='pending')
    score = models.PositiveIntegerField(_('Score'), default=0, validators=[MaxValueValidator(100)])
    points_earned = models.PositiveIntegerField(_('Points Earned'), default=0)
    
    # Metadata
    attempts_count = models.PositiveIntegerField(_('Attempts Count'), default=1)
    started_at = models.DateTimeField(_('Started At'), auto_now_add=True)
    completed_at = models.DateTimeField(_('Completed At'), null=True, blank=True)
    
    # For feedback
    feedback = models.TextField(_('Feedback'), blank=True)
    is_using_hint = models.BooleanField(_('Is Using Hint'), default=False)
    
    class Meta:
        verbose_name = _('Task Result')
        verbose_name_plural = _('Task Results')
        ordering = ['-completed_at']
        unique_together = ('student', 'task')
        indexes = [
            models.Index(fields=['student', 'task']),
            models.Index(fields=['status']),
            models.Index(fields=['-completed_at']),
        ]
    
    def __str__(self):
        return f"{self.student.username} - {self.task.title} ({self.status})"


class ModuleProgress(models.Model):
    """Student's progress in a module."""
    
    STATUS_CHOICES = (
        ('not_started', _('Not Started')),
        ('in_progress', _('In Progress')),
        ('completed', _('Completed')),
    )
    
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='module_progress',
        verbose_name=_('Student'),
        limit_choices_to={'role': 'student'}
    )
    
    module = models.ForeignKey(
        CourseModule,
        on_delete=models.CASCADE,
        related_name='student_progress',
        verbose_name=_('Module')
    )
    
    # Progress metrics
    completion_percent = models.PositiveIntegerField(
        _('Completion Percent'),
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    total_score = models.PositiveIntegerField(_('Total Score'), default=0)
    theory_viewed_percent = models.PositiveIntegerField(
        _('Theory Viewed Percent'),
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    tasks_completed = models.PositiveIntegerField(_('Tasks Completed'), default=0)
    
    status = models.CharField(_('Status'), max_length=20, choices=STATUS_CHOICES, default='not_started')
    
    # Timestamps
    started_at = models.DateTimeField(_('Started At'), null=True, blank=True)
    completed_at = models.DateTimeField(_('Completed At'), null=True, blank=True)
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    
    class Meta:
        verbose_name = _('Module Progress')
        verbose_name_plural = _('Module Progress')
        ordering = ['-updated_at']
        unique_together = ('student', 'module')
        indexes = [
            models.Index(fields=['student', 'module']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.student.username} - {self.module.title} ({self.completion_percent}%)"
