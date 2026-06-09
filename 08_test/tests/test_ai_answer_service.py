import unittest
from types import SimpleNamespace

from src.ai_answer_service import answer


class FakeAIClient:

    def __init__(self, response_text: str):
        self._response_text = response_text
        self.last_messages = []

    @property
    def chat(self):
        return self

    @property
    def completions(self):
        return self

    def create(self, *, messages):
        self.last_messages = messages
        return SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=self._response_text))]
        )


class TestAiAnswerService(unittest.TestCase):
    def test_answer_returns_ai_response(self):
        client = FakeAIClient("RAG means Retrieval-Augmented Generation.")

        result = answer("What does RAG mean?", client)

        self.assertEqual(result, "RAG means Retrieval-Augmented Generation.")

    def test_answer_passes_question_to_ai(self):
        client = FakeAIClient("Some answer.")

        answer("What does RAG mean?", client)

        user_message = client.last_messages[0]
        self.assertIn("What does RAG mean?", user_message["content"])

    def test_answer_raises_for_empty_question(self):
        client = FakeAIClient("irrelevant")

        with self.assertRaisesRegex(ValueError, "Question must not be empty"):
            answer("", client)


if __name__ == "__main__":
    unittest.main()
