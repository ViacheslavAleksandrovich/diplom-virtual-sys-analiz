from django.urls import path
from . import views

app_name = 'course_app_compat'

urlpatterns = [
    path('modules/', views.ModuleListView.as_view(), name='module_list'),
    path('modules/<int:pk>/', views.ModuleDetailView.as_view(), name='module_detail'),
    path('theory/<int:pk>/', views.TheoryDetailView.as_view(), name='theory_detail'),
    path('tasks/', views.TaskListView.as_view(), name='task_list'),
    path('tasks/<int:pk>/', views.TaskDetailView.as_view(), name='task_detail'),
    path('tasks/<int:pk>/submit/', views.TaskSubmitView.as_view(), name='task_submit'),
    path('results/', views.TaskResultListView.as_view(), name='result_list'),
    path('results/<int:pk>/', views.TaskResultDetailView.as_view(), name='result_detail'),
    path('progress/', views.ModuleProgressListView.as_view(), name='progress_list'),
    path('progress/<int:pk>/', views.ModuleProgressDetailView.as_view(), name='progress_detail'),
]
