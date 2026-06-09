### Background
This example is also from a semester project (Django quiz). The original `quiz()` view handles too many things at once: loading the quiz, checking the request method, creating a result, checking answers, calculating the score, saving user answers, and redirecting to the result page.

### original code

```python
from django.shortcuts import render, get_object_or_404, redirect
from .models import *
from django.utils import timezone 
from .forms import *


def quiz(request, quiz_id):
    quiz = get_object_or_404(Quiz, id=quiz_id)
    questions = quiz.questions.all().order_by("?")  # Randomize questions

    if request.method == 'POST':

        result = Result.objects.create(
            user=request.user, quiz=quiz, attempted_at=timezone.now()
            )
        
        user_score = 0
        for question in questions:
            correct_answer = question.answers.filter(is_correct=True).first()
            user_answer_id = request.POST.get(f'question_{question.id}')
            answer = question.answers.filter(id=user_answer_id).first()

            if answer:
                UserAnswer.objects.create(
                    result=result, question=question, answer=answer
                    )

            if str(correct_answer.id) == user_answer_id:
                user_score += question.score

        result.score=user_score
        result.save()

        return redirect('result', result_id=result.id)
    
    elif request.method == 'GET':
        context = {'quiz': quiz, 'questions': questions}
        return render(request, 'quiz.html', context)
```

### refactored code

```python
from django.shortcuts import render, get_object_or_404, redirect
from django.utils import timezone

from .models import Quiz, Result, UserAnswer


def get_quiz_questions(quiz):
    return quiz.questions.all().order_by("?")


def create_result_for_user(user, quiz):
    return Result.objects.create(
        user=user,
        quiz=quiz,
        attempted_at=timezone.now(),
    )


def grade_quiz_submission(result, questions, submitted_answers):
    user_score = 0

    for question in questions:
        user_answer_id = submitted_answers.get(f"question_{question.id}")
        correct_answer = question.answers.filter(is_correct=True).first()
        selected_answer = question.answers.filter(id=user_answer_id).first()

        if selected_answer:
            UserAnswer.objects.create(
                result=result,
                question=question,
                answer=selected_answer,
            )

        if correct_answer and str(correct_answer.id) == user_answer_id:
            user_score += question.score

    result.score = user_score
    result.save()

    return result


def quiz(request, quiz_id):
    quiz = get_object_or_404(Quiz, id=quiz_id)
    questions = get_quiz_questions(quiz)

    if request.method == "POST":
        result = create_result_for_user(request.user, quiz)
        grade_quiz_submission(result, questions, request.POST)
        return redirect("result", result_id=result.id)

    return render(request, "quiz.html", {
        "quiz": quiz,
        "questions": questions,
    })
```

### Explanation

It now separates the work into smaller functions. `quiz()` now mainly handles the request and response. `create_result_for_user()` creates the result, and `grade_quiz_submission()` handles the scoring and saving user answers.

This improves readability because each function has one clear job. It also makes the quiz grading logic easier to test or change later without touching the whole Django view.
