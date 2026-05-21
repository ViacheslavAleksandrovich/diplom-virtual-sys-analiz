from django.urls import path
from . import views

app_name = 'analytics_app'

urlpatterns = [
    path('my-statistics/', views.StudentStatisticsView.as_view(), name='student_stats'),
    path('task-statistics/', views.TaskStatisticsListView.as_view(), name='task_stats'),
    path('module-statistics/', views.ModuleStatisticsListView.as_view(), name='module_stats'),
    path('learning-path/', views.LearningPathView.as_view(), name='learning_path'),
]
