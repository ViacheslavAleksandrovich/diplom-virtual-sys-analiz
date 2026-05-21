from django.contrib import admin
from .models import Achievement, UserAchievement, StudentRanking, BonusPoints


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    """Admin interface for Achievement model."""
    
    list_display = ['title', 'rarity', 'bonus_points', 'created_at']
    list_filter = ['rarity', 'created_at']
    search_fields = ['title', 'description']


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    """Admin interface for UserAchievement model."""
    
    list_display = ['user', 'achievement', 'earned_at']
    list_filter = ['achievement', 'earned_at']
    search_fields = ['user__username', 'achievement__title']
    readonly_fields = ['earned_at']


@admin.register(StudentRanking)
class StudentRankingAdmin(admin.ModelAdmin):
    """Admin interface for StudentRanking model."""
    
    list_display = ['student', 'level', 'total_points', 'achievements_count', 'experience_points']
    list_filter = ['level']
    search_fields = ['student__username']
    readonly_fields = ['updated_at']


@admin.register(BonusPoints)
class BonusPointsAdmin(admin.ModelAdmin):
    """Admin interface for BonusPoints model."""
    
    list_display = ['student', 'points', 'bonus_type', 'earned_at']
    list_filter = ['bonus_type', 'earned_at']
    search_fields = ['student__username', 'description']
    readonly_fields = ['earned_at']
