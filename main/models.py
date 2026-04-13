from django.db import models
from django.contrib.auth.models import User

from django.utils import timezone

class CodingQuestion(models.Model):
    title = models.CharField(max_length=200)
    difficulty = models.CharField(max_length=20, default="Easy")
    description = models.TextField()

    input_data = models.TextField(default="")
    expected_output = models.TextField(default="")

    def __str__(self):
        return self.title
    
class Submission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.ForeignKey(CodingQuestion, on_delete=models.CASCADE)

    code = models.TextField()
    status = models.CharField(max_length=20)  # Correct / Wrong

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.question.title} - {self.status}"
    
    


class Question(models.Model):
    question_text = models.TextField()

    # 🆕 ADD THESE (keep blank=True)
    option1 = models.CharField(max_length=200, blank=True, null=True)
    option2 = models.CharField(max_length=200, blank=True, null=True)
    option3 = models.CharField(max_length=200, blank=True, null=True)
    option4 = models.CharField(max_length=200, blank=True, null=True)

    correct_answer = models.CharField(max_length=200, blank=True, null=True)

    field = models.CharField(max_length=50)
    category = models.CharField(max_length=50)
    


class InterviewSubmission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    field = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    score = models.IntegerField()

    created_at = models.DateTimeField(auto_now_add=True)
    
from django.contrib.auth.models import User
from django.db import models

class HRAnswer(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.ForeignKey('Question', on_delete=models.CASCADE)
    answer_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
