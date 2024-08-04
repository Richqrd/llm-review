from flask import Flask, jsonify, request
from flask_cors import CORS

from scripts.transformer import *

import asyncio
from concurrent.futures import ThreadPoolExecutor
import os

app = Flask(__name__)
CORS(app) # This will enable CORS for all routes

model_choice = os.environ.get('MODEL', 'ChatGPTmini')
models = {
    'Roberta': roberta,
    'Deberta': deberta,
    'ChatGPT': chatgpt,
    'ChatGPTmini': chatgptmini,
    'Dummy': dummy,
    'HFElectra': hf_electra
}
transformer = models[model_choice]

@app.route('/')
def home():
    data = {'message': 'Hello world.'}
    return jsonify(data)

@app.route('/api/data', methods=['GET'])
def get_data():
    data = {'message': 'Hello from me!'}
    return jsonify(data)

@app.route('/api/model', methods=['GET'])
def get_model():
    data = {'model': model_choice}
    return jsonify(data)

@app.route('/api/submit', methods=['POST'])
def submit():
    data = request.json

    # Extract questions and extractedTexts from the received data
    questions = data.get('questions', [])
    ids = data.get('ids', [])
    extracted_texts = data.get('extractedTexts', [])

    # Print the first question and the first extracted text to the console
    if questions:
        print('First question:', questions[0])
    else:
        print('No questions provided.')

    if extracted_texts:
        print('First extracted text:', extracted_texts[0][0:15])
    else:
        print('No extracted texts provided.')

    para_answers = get_question_answers(questions, ids, extracted_texts)
    print('First generated answer', para_answers[0])

    # Return a JSON response
    response = {
        'para_answers': para_answers
    }
    return jsonify(response), 200


async def run_transformer(executor, question, id, text):
    loop = asyncio.get_event_loop()
    qa = await loop.run_in_executor(executor, transformer, question, id, text)
    # n = await loop.run_in_executor(executor, chatgpt, question, text)
    return qa

async def process_questions_and_texts(questions, ids, extracted_texts):
    para_answers = []
    if questions and extracted_texts:
        print("Running model" + "*"*10 + model_choice)
        executor = ThreadPoolExecutor(max_workers=10)  # Adjust the number of workers based on your needs
        tasks = []

        for textIndex in range(len(extracted_texts)):
            for question in questions:
                id = ids[textIndex]
                text = extracted_texts[textIndex]
                task = run_transformer(executor, question, id, text)
                tasks.append(task)

        results = await asyncio.gather(*tasks)

        # Organize results into question_answers
        result_index = 0
        for text in extracted_texts:
            text_answers = []
            for _ in questions:
                text_answers.append(results[result_index])
                result_index += 1
            para_answers.append(text_answers)
    
    return para_answers

def get_question_answers(questions, ids, extracted_texts):
    return asyncio.run(process_questions_and_texts(questions, ids, extracted_texts))



if __name__ == '__main__':
    app.run(debug=True, port=8080) # for Docker, otherwise only param is debug=True

    


