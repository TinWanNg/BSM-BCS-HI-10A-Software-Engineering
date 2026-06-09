from src.text_tools import validate_question


def answer(question: str, openai_client) -> str:
    clean_question = validate_question(question)

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": f"Answer this question:\n\n{clean_question}",
            }
        ],
        max_tokens=500,
    )

    return response.choices[0].message.content.strip()

