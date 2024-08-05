from transformers import pipeline
import random
import openai
import os
from dotenv import load_dotenv
import requests
import time

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

def deberta(question, id, abstract):
    # Replace this with your own checkpoint
    device = "cpu"
    model_checkpoint = "deepset/deberta-v3-large-squad2" # best performing
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
    openai_api_key = os.environ.get('OPENAI_API', os.getenv('OPENAI_API_KEY'))
    

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

    try:
        response = client.chat.completions.create(
            model="gpt-4o", # 0.15 per 1M tokens
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

    
    except openai.APIConnectionError as e:
        #Handle connection error here
        print(f"Failed to connect to OpenAI API: {e}, retrying in 30s")
        time.sleep(30)
        return chatgpt(question, id, abstract)
    except openai.RateLimitError as e:
        #Handle rate limit error (we recommend using exponential backoff)
        print(f"OpenAI API request exceeded rate limit: {e}, retrying in 30s")
        time.sleep(30)
        return chatgpt(question, id, abstract)
    except openai.APIError as e:
        #Handle API error here, e.g. retry or log
        print(f"OpenAI API returned an API Error: {e}")
        return None
    except Exception as e:
        # Handle any other exceptions
        print(f"An unexpected error occurred: {e}")
        return None




def chatgptmini(question, id, abstract):
    # Load environment variables from the .env file
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    load_dotenv(dotenv_path=env_path)
    
    # Get the OpenAI API key from the environment variables
    openai_api_key = os.environ.get('OPENAI_API', os.getenv('OPENAI_API_KEY'))
    

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

    try:
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

    except openai.APIConnectionError as e:
        #Handle connection error here
        print(f"Failed to connect to OpenAI API: {e}, retrying in 30s")
        time.sleep(30)
        return chatgpt(question, id, abstract)
    except openai.RateLimitError as e:
        #Handle rate limit error (we recommend using exponential backoff)
        print(f"OpenAI API request exceeded rate limit: {e}, retrying in 30s")
        time.sleep(30)
        return chatgpt(question, id, abstract)
    except openai.APIError as e:
        #Handle API error here, e.g. retry or log
        print(f"OpenAI API returned an API Error: {e}")
        return None
    except Exception as e:
        # Handle any other exceptions
        print(f"An unexpected error occurred: {e}")
        return None

def hf_electra(question, id, abstract):
    # Load environment variables from the .env file
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    load_dotenv(dotenv_path=env_path)
    hf_api_key = os.environ.get('HF_API', os.getenv('HF_API_KEY'))

    if not hf_api_key:
        raise ValueError("API key not found. Please set the HF_API_KEY in the .env file.")

    # API_URL = "https://api-inference.huggingface.co/models/ahotrod/electra_large_discriminator_squad2_512" # Serverless inference
    # API_URL = "https://ckjzljiuf0f0lvnd.us-east-1.aws.endpoints.huggingface.cloud" # Dedicated endpoint
    API_URL = os.environ.get('HF_URL', os.getenv('HF_URL'))
    headers = {"Authorization": f"Bearer {hf_api_key}"} 

    payload = {
	"inputs": {
	"question": question,
	"context": abstract
    },
    }

    req = requests.post(API_URL, headers=headers, json=payload)

    if req.status_code == 200:
        response = req.json()
        response["id"] = id 
        return response
    elif req.status_code == 503:
        print("HF server booting, resending in 30s")
        print(req.json())
        time.sleep(30)
        return hf_electra(question, id, abstract)
    elif req.status_code == 500:
        print("HF server booting, resending in 30s")
        print(req.json())
        time.sleep(30)
        return hf_electra(question, id, abstract)
    else:
        print(req.json())
        raise ValueError("Request failed with status code:", req.status_code)
        return None