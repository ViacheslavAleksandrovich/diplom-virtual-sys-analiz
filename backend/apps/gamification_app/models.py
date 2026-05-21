from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class Achievement(models.Model):
    """Achievement/Badge model for gamification."""
    
    RARITY_CHOICES = (
        ('common', _('Common')),
        ('rare', _('Rare')),
        ('epic', _('Epic')),
        ('legendary', _('Legendary')),
    )
    
    title = models.CharField(_('Title'), max_length=255, unique=True, db_index=True)
    description = models.TextField(_('Description'))
    icon = models.ImageField(_('Icon'), upload_to='achievements/')
    rarity = models.CharField(_('Rarity'), max_length=20, choices=RARITY_CHOICES, default='common')
    
    # Condition for earning
    condition_code = models.CharField(
        _('Condition Code'),
        max_length=100,
        help_text=_('Code identifier for the achievement condition')
    )
    
    # Points reward
    bonus_points = models.PositiveIntegerField(_('Bonus Points'), default=0)
    
    # Timestamps
    created_at = models.DateTimeField(_('Created At'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('Achievement')
        verbose_name_plural = _('Achievements')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title


class UserAchievement(models.Model):
    """Track user achievements."""
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='achievements',
        verbose_name=_('User'),
        limit_choices_to={'role': 'student'}
    )
    
    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        related_name='users',
        verbose_name=_('Achievement')
    )
    
    earned_at = models.DateTimeField(_('Earned At'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('User Achievement')
        verbose_name_plural = _('User Achievements')
        ordering = ['-earned_at']
        unique_together = ('user', 'achievement')
        indexes = [
            models.Index(fields=['user', 'achievement']),
            models.Index(fields=['-earned_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.achievement.title}"


class StudentRanking(models.Model):
    """Student ranking/leaderboard."""
    
    student = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='ranking',
        verbose_name=_('Student'),
        limit_choices_to={'role': 'student'}
    )
    
    # Points and ranking
    total_points = models.PositiveIntegerField(_('Total Points'), default=0)
    level = models.PositiveIntegerField(_('Level'), default=1)
    achievements_count = models.PositiveIntegerField(_('Achievements Count'), default=0)
    
    # XP system
    experience_points = models.PositiveIntegerField(_('Experience Points'), default=0)
    
    # Updated timestamp
    updated_at = models.DateTimeField(_('Updated At'), auto_now=True)
    
    class Meta:
        verbose_name = _('Student Ranking')
        verbose_name_plural = _('Student Rankings')
        ordering = ['-total_points', '-level', '-experience_points']
        indexes = [
            models.Index(fields=['-total_points']),
            models.Index(fields=['-level']),
        ]
    
    def __str__(self):
        return f"{self.student.username} - Level {self.level} ({self.total_points} pts)"


class BonusPoints(models.Model):
    """Track bonus points earned by students."""
    
    BONUS_TYPES = (
        ('achievement', _('Achievement')),
        ('streak', _('Study Streak')),
        ('bonus', _('Bonus Points')),
        ('referral', _('Referral')),
    )
    
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bonus_points',
        verbose_name=_('Student'),
        limit_choices_to={'role': 'student'}
    )
    
    points = models.PositiveIntegerField(_('Points'), default=0)
    bonus_type = models.CharField(_('Bonus Type'), max_length=20, choices=BONUS_TYPES)
    description = models.CharField(_('Description'), max_length=255, blank=True)
    
    earned_at = models.DateTimeField(_('Earned At'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('Bonus Points')
        verbose_name_plural = _('Bonus Points')
        ordering = ['-earned_at']
        indexes = [
            models.Index(fields=['student', '-earned_at']),
        ]
    
    def __str__(self):
        return f"{self.student.username} - {self.points} pts ({self.bonus_type})"
