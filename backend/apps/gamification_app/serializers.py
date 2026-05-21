from rest_framework import serializers

from .models import Achievement, UserAchievement, StudentRanking, BonusPoints


class AchievementSerializer(serializers.ModelSerializer):
    """Serializer for achievements catalog."""

    class Meta:
        model = Achievement
        fields = [
            'id',
            'title',
            'description',
            'icon',
            'rarity',
            'condition_code',
            'bonus_points',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class UserAchievementSerializer(serializers.ModelSerializer):
    """Serializer for user earned achievements."""

    achievement = AchievementSerializer(read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = UserAchievement
        fields = ['id', 'user', 'user_name', 'achievement', 'earned_at']
        read_only_fields = ['id', 'earned_at']


class StudentRankingSerializer(serializers.ModelSerializer):
    """Serializer for ranking table."""

    student_name = serializers.CharField(source='student.get_full_name', read_only=True)

    class Meta:
        model = StudentRanking
        fields = [
            'id',
            'student',
            'student_name',
            'total_points',
            'level',
            'achievements_count',
            'experience_points',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']


class BonusPointsSerializer(serializers.ModelSerializer):
    """Serializer for bonus points entries."""

    student_name = serializers.CharField(source='student.get_full_name', read_only=True)

    class Meta:
        model = BonusPoints
        fields = [
            'id',
            'student',
            'student_name',
            'points',
            'bonus_type',
            'description',
            'earned_at',
        ]
        read_only_fields = ['id', 'earned_at']


class AssignAchievementSerializer(serializers.Serializer):
    """Payload to assign an achievement to a student."""

    user_id = serializers.IntegerField()
    achievement_id = serializers.IntegerField()
