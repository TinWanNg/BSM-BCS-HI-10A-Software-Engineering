import unittest

from src.text_tools import clean_text, validate_question

class TestTextTools(unittest.TestCase):
    def test_clean_text(self):
        text = "This is a hyphen-\nated word.   Page 4\nToo   many spaces."

        result = clean_text(text)

        self.assertEqual(result, "This is a hyphenated word. Too many spaces.")

    def test_validate_question_accepts_valid_question(self):
        result = validate_question("  What is RAG?  ")

        self.assertEqual(result, "What is RAG?")

    def test_validate_question_raises_exception_for_empty_question(self):
        with self.assertRaisesRegex(ValueError, "Question must not be empty"):
            validate_question("   ")


if __name__ == "__main__":
    unittest.main()
