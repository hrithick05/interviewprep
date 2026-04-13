from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from .models import Submission
from django.contrib.auth.forms import UserCreationForm
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.core.paginator import Paginator
from django.contrib.auth import authenticate, login
from django.contrib import messages
from .models import Submission, InterviewSubmission, Question, HRAnswer, CodingQuestion
from django.db.models import Avg, Sum
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from django.db.models.functions import TruncDate, TruncTime
from django.contrib.auth.decorators import user_passes_test
from django.contrib.auth.models import User

import subprocess


# =========================
# 🔹 HOME
# =========================
def home(request):
    return render(request, 'main/home.html')


# =========================
# 🔹 SIGNUP
# =========================
def signup(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')
    else:
        form = UserCreationForm()

    return render(request, 'registration/signup.html', {'form': form})

def login_view(request):
    if request.method == "POST":
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)

            messages.success(request, "Welcome back!")

            next_url = request.GET.get('next')
            return redirect(next_url if next_url else '/')
        else:
            messages.error(request, "Invalid username or password")

    return render(request, 'registration/login.html')

# =========================
# 🔹 PREFERENCE PAGE
# =========================
@login_required(login_url='/accounts/login/')
def preference_page(request):
    return render(request, 'main/preference_page.html')


# =========================
# 🔹 MOCK INTERVIEW
# =========================
@login_required(login_url='/accounts/login/')
def mock_interview(request):
    field = request.GET.get('field')
    category = request.GET.get('category')
    q_index = int(request.GET.get('q', 0))

    # ✅ RESET SCORE
    if q_index == 0:
        request.session["score"] = 0

    if not field or not category:
        return redirect('preference_page')

    questions = list(Question.objects.filter(
        field__iexact=field,
        category__iexact=category
    ))

    if not questions:
        return HttpResponse("❌ No questions found")

    # ✅ SHOW RESULT PAGE
    if q_index >= len(questions):
        score = request.session.get("score", 0)

        return render(request, 'main/mock_interview_done.html', {
            "score": score,
            "total": len(questions)
        })

    # ✅ NORMAL FLOW
    question = questions[q_index]

    return render(request, 'main/mock_interview.html', {
        'question': question,
        'q_index': q_index,
        'field': field,
        'category': category
    })


# =========================
# 🔹 AJAX SUBMIT
# =========================
@require_POST
@login_required
def ajax_submit(request):
    user_answer = request.POST.get("answer")
    q_index = int(request.POST.get("q_index"))
    field = request.POST.get("field")
    category = request.POST.get("category")

    questions = list(Question.objects.filter(
        field__iexact=field,
        category__iexact=category
    ))

    question = questions[q_index]

    # ✅ CHECK ANSWER
    is_correct = user_answer == question.correct_answer

    # ✅ SESSION SCORE
    score = request.session.get("score", 0)
    if is_correct:
        score += 1
    request.session["score"] = score

    # 🔥 SAVE TO DATABASE (IMPORTANT)
    InterviewSubmission.objects.create(
        user=request.user,
        field=field,
        category=category,
        score=1 if is_correct else 0
    )

    return JsonResponse({
        "next_q": q_index + 1
    })
# =========================
# 🔹 AJAX SKIP
# =========================
@require_POST
@csrf_protect
def ajax_skip_question(request):
    q_index = int(request.POST.get('q_index'))

    return JsonResponse({
        'status': 'ok',
        'next_q': q_index + 1,
        'field': request.POST.get('field'),
        'category': request.POST.get('category')
    })


# =========================
# 🔹 RESUME BUILDER
# =========================
@login_required(login_url='/accounts/login/')
def resume_templates(request):
    return render(request, 'main/resume_templates.html')


@login_required(login_url='/accounts/login/')
def resume_form(request, template_id):
    return render(request, 'main/resume_form.html', {'template_id': template_id})


def generate_resume(request):
    if request.method == "POST":
        data = {
            'name': request.POST.get('name'),
            'email': request.POST.get('email'),
            'phone': request.POST.get('phone'),
            'skills': request.POST.get('skills'),
            'education': request.POST.get('education'),
            'projects': request.POST.get('projects'),
        }

        template_id = request.POST.get('template_id')

        if template_id == "1":
            return render(request, 'main/resume_template1.html', data)
        elif template_id == "2":
            return render(request, 'main/resume_template2.html', data)
        elif template_id == "3":
            return render(request, 'main/resume_template3.html', data)
        else:
            return render(request, 'main/resume_template4.html', data)

    return redirect('resume_templates')


# =========================
# 🔹 DOWNLOAD PDF
# =========================
def download_resume_pdf(request):
    if request.method == "POST":
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="resume.pdf"'

        doc = SimpleDocTemplate(response)
        styles = getSampleStyleSheet()

        elements = [
            Paragraph(request.POST.get('name'), styles['Title']),
            Spacer(1, 10),
            Paragraph("Email: " + request.POST.get('email'), styles['Normal']),
            Paragraph("Phone: " + request.POST.get('phone'), styles['Normal']),
            Spacer(1, 10),
            Paragraph("Skills: " + request.POST.get('skills'), styles['Normal']),
            Paragraph("Education: " + request.POST.get('education'), styles['Normal']),
            Paragraph("Projects: " + request.POST.get('projects'), styles['Normal']),
        ]

        doc.build(elements)
        return response

    return redirect('resume_templates')


# =========================
# 🔹 CODING LIST PAGE
# =========================
@login_required(login_url='/accounts/login/')
def coding_practice(request):
    query = request.GET.get('q')
    difficulty = request.GET.get('difficulty')

    questions = CodingQuestion.objects.all()

    # 🔍 SEARCH
    if query:
        questions = questions.filter(title__icontains=query)

    # 🎯 FILTER
    if difficulty:
        questions = questions.filter(difficulty__iexact=difficulty)

    # 📄 PAGINATION
    paginator = Paginator(questions, 5)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    # ✔ SESSION INIT
    if 'completed' not in request.session:
        request.session['completed'] = []

    return render(request, 'main/coding_list.html', {
        'page_obj': page_obj
    })


# =========================
# 🔹 CODING DETAIL PAGE
# =========================
@login_required(login_url='/accounts/login/')
def coding_detail(request, id):
    question = CodingQuestion.objects.get(id=id)
    return render(request, 'main/coding_detail.html', {'question': question})


# =========================
# 🔹 RUN CODE (FIXED 🔥)
# =========================
@csrf_exempt
@login_required
def run_code(request):
    if request.method == "POST":
        code = request.POST.get("code")
        question_id = request.POST.get("question_id")

        question = CodingQuestion.objects.get(id=question_id)

        try:
            import subprocess

            with open("temp.py", "w") as f:
                f.write(code)

            result = subprocess.run(
                ["python", "temp.py"],
                input=question.input_data,
                text=True,
                capture_output=True,
                timeout=5
            )

            output = result.stdout.strip()
            expected = question.expected_output.strip()

            # 🔥 CHECK RESULT
            if output == expected:
                status = "Correct"
                message = "✅ Correct Answer"
            else:
                status = "Wrong"
                message = f"❌ Wrong\nExpected: {expected}\nGot: {output}"

            # 🔥 SAVE TO DATABASE (THIS IS KEY)
            Submission.objects.create(
                user=request.user,
                question=question,
                code=code,
                status=status
            )

            return JsonResponse({"result": message})

        except Exception as e:
            return JsonResponse({"error": str(e)})

# =========================
# 🔹 HR QUESTIONS
# =========================
@login_required(login_url='/accounts/login/')
def hr_questions(request):
    questions = list(Question.objects.filter(field__iexact="HR"))
    q_index = int(request.GET.get("q", 0))

    if not questions:
        return HttpResponse("❌ No HR questions available.")

    if q_index == 0:
        request.session["hr_answers"] = []

    if request.method == "POST":
        answer = request.POST.get("answer", "")

        answers = request.session.get("hr_answers", [])
        answers.append(answer)
        request.session["hr_answers"] = answers

        if q_index < len(questions):
            HRAnswer.objects.create(
                user=request.user,
                question=questions[q_index],
                answer_text=answer
            )

        return redirect(f"/hr/?q={q_index+1}")

    if q_index >= len(questions):
        answers = request.session.get("hr_answers", [])
        return render(request, "main/hr_done.html", {
            "answers": answers,
            "total": len(answers)
        })

    return render(request, "main/hr_questions.html", {
        "question": questions[q_index],
        "q_index": q_index
    })

def admin_check(user):
    return user.is_superuser


@user_passes_test(admin_check)
def admin_dashboard(request):
    users = User.objects.all()

    # ✅ RETURN USER LIST
    return render(request, 'main/admin_dashboard.html', {
        'users': users
    })


@user_passes_test(admin_check)
def user_performance(request, user_id):
    user = User.objects.get(id=user_id)

    # =====================
    # CODING DATA
    # =====================
    coding_submissions = Submission.objects.filter(user=user)
    total = coding_submissions.count()
    correct = coding_submissions.filter(status="Correct").count()
    wrong = coding_submissions.filter(status="Wrong").count()
    accuracy = (correct / total * 100) if total > 0 else 0

    coding_data = {
        'user': user.username,
        'total': total,
        'correct': correct,
        'wrong': wrong,
        'accuracy': round(accuracy, 2)
    }

    # =====================
    # INTERVIEW DATA (Aggregated by Field & Category)
    # =====================
    interview_submissions = InterviewSubmission.objects.filter(user=user).order_by('-created_at')
    
    # Group by field and category to show summary
    interview_data = {}
    for submission in interview_submissions:
        key = f"{submission.field}_{submission.category}"
        if key not in interview_data:
            interview_data[key] = {
                'field': submission.field,
                'category': submission.category,
                'total_score': 0,
                'total_questions': 0,
                'date': submission.created_at,
                'submissions': []
            }
        interview_data[key]['total_score'] += submission.score
        interview_data[key]['total_questions'] += 1
        interview_data[key]['submissions'].append(submission)
    
    # Convert to list and sort by date
    interview_data = list(interview_data.values())
    interview_data.sort(key=lambda x: x['date'], reverse=True)

    # =====================
    # HR ANSWERS DATA
    # =====================
    hr_answers_data = HRAnswer.objects.filter(user=user).select_related('question').order_by('-created_at')

    # ✅ IMPORTANT RETURN
    return render(request, 'main/user_performance.html', {
        'user': user,
        'coding_data': coding_data,
        'interview_data': interview_data,
        'hr_answers_data': hr_answers_data
    })
def admin_login(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)

        if user is not None and user.is_superuser:
            login(request, user)
            return redirect('admin_dashboard')
        else:
            messages.error(request, "Only admin can login here")

    return render(request, "main/admin_login.html")


def get_feedback(answer):
    if not answer or len(answer.strip()) < 20:
        return "Too short ❌"
    if any(k in answer.lower() for k in ["experience", "project", "example"]):
        return "Good structured answer 👍"
    return "Add examples for better impact 🔍"
