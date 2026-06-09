import re


def validate_question(question: str) -> str:
    if question is None or not question.strip():
        raise ValueError("Question must not be empty")

    return question.strip()


def clean_text(text: str) -> str:
    text = re.sub(r"-\s*\n", "", text)
    text = re.sub(r"Page\s+\d+", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()
