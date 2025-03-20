from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import random
import time
import json
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Required for sessions

# Load questions from a JSON file
def load_questions():
    with open('questions.json', 'r') as file:
        return json.load(file)

# Save leaderboard data
def save_leaderboard(leaderboard):
    with open('leaderboard.json', 'w') as file:
        json.dump(leaderboard, file)

# Load leaderboard data
def load_leaderboard():
    if not os.path.exists('leaderboard.json'):
        return []
    with open('leaderboard.json', 'r') as file:
        return json.load(file)

@app.route('/')
def home():
    # Get available categories
    all_questions = load_questions()
    categories = list(set(q['category'] for q in all_questions))
    return render_template('home.html', categories=categories)

@app.route('/quiz', methods=['GET', 'POST'])
def quiz():
    if request.method == 'POST':
        # Process category selection
        category = request.form.get('category')
        all_questions = load_questions()
        
        # Filter questions by category if selected
        if category and category != 'all':
            questions = [q for q in all_questions if q['category'] == category]
        else:
            questions = all_questions
            
        # Randomize questions and select up to 5
        random.shuffle(questions)
        questions = questions[:5]
        
        # Set up session data
        session['questions'] = questions
        session['start_time'] = time.time()
        session['category'] = category if category != 'all' else 'All Categories'
        
        return render_template('index.html', questions=questions, enumerate=enumerate, category=session['category'])
    
    # If someone accesses /quiz directly without selecting a category
    return redirect(url_for('home'))

@app.route('/submit', methods=['POST'])
def submit():
    if 'questions' not in session:
        return redirect(url_for('home'))
    
    questions = session['questions']
    score = 0
    total = len(questions)
    user_answers = {}
    
    # Calculate score
    for i, question in enumerate(questions):
        user_answer = request.form.get(f'answer-{i}')
        user_answers[str(i)] = user_answer
        if user_answer == question['answer']:
            score += 1
    
    # Calculate time taken
    end_time = time.time()
    time_taken = int(end_time - session['start_time'])
    minutes = time_taken // 60
    seconds = time_taken % 60
    
    # Save to leaderboard if name provided
    user_name = request.form.get('user_name')
    if user_name:
        leaderboard = load_leaderboard()
        leaderboard.append({
            'name': user_name,
            'score': score,
            'total': total,
            'time': time_taken,
            'category': session['category'],
            'date': datetime.now().strftime("%Y-%m-%d %H:%M")
        })
        # Sort by score (descending) and time (ascending)
        leaderboard.sort(key=lambda x: (-x['score'], x['time']))
        # Keep only top 10
        leaderboard = leaderboard[:10]
        save_leaderboard(leaderboard)
    
    return render_template(
    'result.html', 
    score=score, 
    total=total, 
    time_min=minutes, 
    time_sec=seconds,
    category=session['category'],
    questions=questions,
    user_answers=user_answers,
    enumerate=enumerate  # Pass enumerate explicitly
)


@app.route('/leaderboard')
def leaderboard():
    leaderboard_data = load_leaderboard()
    return render_template('leaderboard.html', leaderboard=leaderboard_data, enumerate=enumerate)  # Pass enumerate

if __name__ == '__main__':
    # Create sample questions file if it doesn't exist
    if not os.path.exists('questions.json'):
        sample_questions = [
            # {
            #     'question': 'What is 2 + 2?',
            #     'options': ['3', '4', '5', '6'],
            #     'answer': '4',
            #     'category': 'Math'
            # },
            # {
            #     'question': 'What is the capital of France?',
            #     'options': ['London', 'Berlin', 'Paris', 'Madrid'],
            #     'answer': 'Paris',
            #     'category': 'Geography'
            # },
            # {
            #     'question': 'Which planet is known as the Red Planet?',
            #     'options': ['Earth', 'Mars', 'Jupiter', 'Venus'],
            #     'answer': 'Mars',
            #     'category': 'Science'
            # },
            # {
            #     'question': 'Who wrote "Romeo and Juliet"?',
            #     'options': ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
            #     'answer': 'William Shakespeare',
            #     'category': 'Literature'
            # },
            # {
            #     'question': 'What is the chemical symbol for water?',
            #     'options': ['H2O', 'CO2', 'NaCl', 'O2'],
            #     'answer': 'H2O',
            #     'category': 'Science'
            # },
            # {
            #     'question': 'What is 7 × 8?',
            #     'options': ['54', '56', '64', '49'],
            #     'answer': '56',
            #     'category': 'Math'
            # },
            # {
            #     'question': 'What is the largest ocean on Earth?',
            #     'options': ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
            #     'answer': 'Pacific Ocean',
            #     'category': 'Geography'
            # }
        ]
        with open('questions.json', 'w') as file:
            json.dump(sample_questions, file)
    
    app.run(debug=True)