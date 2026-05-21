from django.urls import path
from . import views

app_name = "gamification_app"

urlpatterns = [
    path('achievements/', views.AchievementListView.as_view(), name='achievements'),
    path('achievements/assign/', views.AssignAchievementView.as_view(), name='assign_achievement'),
    path('my-achievements/', views.MyAchievementsView.as_view(), name='my_achievements'),
    path('ranking/', views.RankingListView.as_view(), name='ranking'),
    path('my-ranking/', views.MyRankingView.as_view(), name='my_ranking'),
    path('bonus-points/', views.BonusPointsListView.as_view(), name='bonus_points'),
]
