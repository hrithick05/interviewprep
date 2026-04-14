from django.urls import path
from . import views
from django.contrib.auth.views import LogoutView

urlpatterns = [

    # 🔹 HOME
    path('', views.home, name='home'),

    # 🔹 AUTH
    path('accounts/signup/', views.signup, name='signup'),

    # 🔹 INTERVIEW
    path('preferences/', views.preference_page, name='preference_page'),
    
    path('mock_interview/', views.mock_interview, name='mock_interview'),
    # 🔹 AJAX
    path('ajax_submit/', views.ajax_submit, name='ajax_submit'),
    path('ajax_skip/', views.ajax_skip_question, name='ajax_skip'),

    # 🔹 RESUME BUILDER
    path('resumebuilder/', views.resume_templates, name='resume_templates'),
    path('resume/form/<int:template_id>/', views.resume_form, name='resume_form'),
    path('resume/generate/', views.generate_resume, name='generate_resume'),
    path('resume/download/', views.download_resume_pdf, name='download_resume'),

    # 🔥 CODING PRACTICE (FINAL CLEAN)
    path('coding/', views.coding_practice, name='coding_practice'),
    path('coding/<int:id>/', views.coding_detail, name='coding_detail'),

    # 🔥 RUN CODE
    path('run_code/', views.run_code, name='run_code'),
    
    path('hr/', views.hr_questions, name='hr_questions'),
    
    path('logout/', LogoutView.as_view(next_page='/'), name='logout'),
    
    path('admin-dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('admin-user/<int:user_id>/', views.user_performance, name='user_performance'),
    
    path('admin-login/', views.admin_login, name='admin_login'),
]