from django.urls import path
from . import views

app_name = 'course_app'

urlpatterns = [
    # Modules
    path('modules/', views.ModuleListView.as_view(), name='module_list'),
    path('modules/<int:pk>/', views.ModuleDetailView.as_view(), name='module_detail'),
    
    # Theory Materials
    path('theory/<int:pk>/', views.TheoryDetailView.as_view(), name='theory_detail'),
    
    # Tasks
    path('tasks/', views.TaskListView.as_view(), name='task_list'),
    path('tasks/<int:pk>/', views.TaskDetailView.as_view(), name='task_detail'),
    path('tasks/<int:pk>/submit/', views.TaskSubmitView.as_view(), name='task_submit'),
    
    # Task Results
    path('results/', views.TaskResultListView.as_view(), name='result_list'),
    path('results/<int:pk>/', views.TaskResultDetailView.as_view(), name='result_detail'),
    
    # Module Progress
    path('progress/', views.ModuleProgressListView.as_view(), name='progress_list'),
    path('progress/<int:pk>/', views.ModuleProgressDetailView.as_view(), name='progress_detail'),
    path('progress/module/<int:module_id>/', views.ModuleProgressByModuleView.as_view(), name='progress_by_module'),
]
