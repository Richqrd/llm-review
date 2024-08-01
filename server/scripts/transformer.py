from transformers import pipeline
import random
import openai
import os
from dotenv import load_dotenv

def roberta(question, id, abstract):
    # Replace this with your own checkpoint
    device = "cpu"
    # model_checkpoint = "deepset/roberta-base-squad2" # average performing
    # model_checkpoint = "deepset/deberta-v3-large-squad2" # best performing
    model_checkpoint = "deepset/tinyroberta-squad2" # fastest, for debugging
    question_answerer = pipeline("question-answering", model=model_checkpoint, device=device)

    response = question_answerer(question=question, context=abstract)
    response['id'] = id

    return response #default response is an object containing keys: answer (NEEDED), score, start, and end

def dummy(question, id, abstract):
    if len(abstract) < 10:
        raise ValueError("Input string must be at least 10 characters long.")
    start_index = random.randint(0, len(abstract) - 10)
    return {'answer': abstract[start_index:start_index + 10], 'id': id}

# 10k tokens per question per 25 articles, ~0.15c using gpt-4o-mini or 1c/6qs <-> 33c/6qs for gpt-4o
def chatgpt(question, id, abstract):
    # Load environment variables from the .env file
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    load_dotenv(dotenv_path=env_path)
    
    # Get the OpenAI API key from the environment variables
    openai_api_key = os.getenv('OPENAI_API_KEY')

    if not openai_api_key:
        raise ValueError("API key not found. Please set the OPENAI_API_KEY in the .env file.")

    # Set the API key for the OpenAI client
    openai.api_key = openai_api_key

    # Create prompt
    prompt = "Please answer the following question by extracting text (word for word, don't include anything else in your response, not even surrounding quotations) from the context that will follow the question: "
    prompt += question 
    prompt += "\n\n"
    prompt += abstract

    # Create request
    client = openai.OpenAI()
    response = client.chat.completions.create(
        model="gpt-4o-mini", # 0.15 per 1M tokens
        # model="gpt-4o", # 5.00 per 1M tokens
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt},
        ],
        max_tokens=100
    )
    choice = response.choices[0].message.content
    usage = response.usage.total_tokens
    print(usage)
    # print(choice)
    return {'answer': choice, 'id': id}

