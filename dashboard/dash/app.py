import os
import logging
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "university-dashboard-secret-key")

# In-memory data storage
students = [
    {"id": 1, "name": "Arjun Sharma", "email": "arjun.sharma@university.edu"},
    {"id": 2, "name": "Priya Patel", "email": "priya.patel@university.edu"},
    {"id": 3, "name": "Rahul Kumar", "email": "rahul.kumar@university.edu"},
    {"id": 4, "name": "Sneha Singh", "email": "sneha.singh@university.edu"},
    {"id": 5, "name": "Vikram Reddy", "email": "vikram.reddy@university.edu"},
    {"id": 6, "name": "Ananya Gupta", "email": "ananya.gupta@university.edu"},
    {"id": 7, "name": "Karthik Nair", "email": "karthik.nair@university.edu"},
    {"id": 8, "name": "Meera Joshi", "email": "meera.joshi@university.edu"}
]

questions = [
    {
        'id': 1,
        'type': 'coding',
        'title': 'Two Sum Problem',
        'description': 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
        'difficulty': 'Easy',
        'created_at': '2025-08-07 12:00:00',
        'assigned_to': 'all'
    },
    {
        'id': 2,
        'type': 'interview',
        'title': 'Explain OOP Principles',
        'description': 'Explain the four main principles of Object-Oriented Programming (OOP) with examples. Discuss how each principle helps in software development.',
        'difficulty': 'Medium',
        'created_at': '2025-08-07 12:15:00',
        'assigned_to': 'all'
    },
    {
        'id': 3,
        'type': 'coding',
        'title': 'Binary Search Implementation',
        'description': 'Implement binary search algorithm to find a target value in a sorted array. The function should return the index of the target if found, otherwise return -1.',
        'difficulty': 'Medium',
        'created_at': '2025-08-07 12:30:00',
        'assigned_to': 'all'
    }
]

submissions = []
feedback = []

# Peer Collaboration Data
study_groups = [
    {
        'id': 1,
        'name': 'Delhi Code Warriors',
        'description': 'Advanced DSA problem solving and competitive programming practice',
        'members': [1, 2, 3],
        'created_by': 1,
        'created_at': '2025-08-07 10:00:00',
        'active': True
    },
    {
        'id': 2,
        'name': 'Mumbai Tech Circle',
        'description': 'System design interviews and tech discussion group',
        'members': [2, 4, 6],
        'created_by': 2,
        'created_at': '2025-08-07 11:30:00',
        'active': True
    },
    {
        'id': 3,
        'name': 'Bangalore AI Study Group',
        'description': 'Machine learning, AI concepts, and Python programming',
        'members': [5, 7, 8],
        'created_by': 5,
        'created_at': '2025-08-07 12:00:00',
        'active': True
    }
]

pair_programming_sessions = []
code_shares = [
    {
        'id': 1,
        'student_id': 1,
        'student_name': 'Arjun Sharma',
        'title': 'Binary Tree Inorder Traversal',
        'code': 'def inorderTraversal(root):\n    if not root:\n        return []\n    return inorderTraversal(root.left) + [root.val] + inorderTraversal(root.right)',
        'description': 'Simple recursive solution for inorder traversal. Need help optimizing for space complexity.',
        'help_needed': True,
        'created_at': '2025-08-07 11:00:00',
        'comments': []
    },
    {
        'id': 2,
        'student_id': 3,
        'student_name': 'Rahul Kumar', 
        'title': 'Quick Sort Algorithm',
        'code': 'def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)',
        'description': 'Clean implementation of quicksort with good partition strategy.',
        'help_needed': False,
        'created_at': '2025-08-07 11:30:00', 
        'comments': []
    }
]
group_messages = []

# Global counter for IDs
next_question_id = 4
next_submission_id = 1
next_feedback_id = 1
next_group_id = 4
next_session_id = 1
next_share_id = 3
next_message_id = 1

@app.route('/')
def index():
    """Landing page with role selection"""
    return render_template('index.html')

@app.route('/professor')
def professor():
    """Professor login page"""
    return render_template('professor_login.html')

@app.route('/professor/portal')
def professor_portal():
    """Professor main portal with navigation options"""
    return render_template('professor.html')

@app.route('/student')
def student():
    """Student main page with login form"""
    return render_template('student_login.html', students=students)

@app.route('/professor/dashboard')
def professor_dashboard():
    """Professor dashboard with overview and analytics"""
    # Calculate analytics
    total_questions = len(questions)
    total_submissions = len(submissions)
    total_students = len(students)
    
    # Student progress data
    student_progress = []
    for student in students:
        student_submissions = [s for s in submissions if s['student_id'] == student['id']]
        student_feedback = [f for f in feedback if f['student_id'] == student['id']]
        
        progress = {
            'student': student,
            'submissions_count': len(student_submissions),
            'feedback_count': len(student_feedback),
            'completion_rate': (len(student_submissions) / max(total_questions, 1)) * 100
        }
        student_progress.append(progress)
    
    return render_template('professor_dashboard.html', 
                         questions=questions,
                         student_progress=student_progress,
                         total_questions=total_questions,
                         total_submissions=total_submissions,
                         total_students=total_students)

@app.route('/professor/assign_question', methods=['GET', 'POST'])
def assign_question():
    """Assign new coding/interview question"""
    global next_question_id
    
    if request.method == 'POST':
        question_type = request.form.get('type')
        title = request.form.get('title')
        description = request.form.get('description')
        difficulty = request.form.get('difficulty')
        
        if not all([question_type, title, description, difficulty]):
            flash('All fields are required!', 'error')
            return redirect(url_for('assign_question'))
        
        new_question = {
            'id': next_question_id,
            'type': question_type,
            'title': title,
            'description': description,
            'difficulty': difficulty,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'assigned_to': 'all'  # For simplicity, assign to all students
        }
        
        questions.append(new_question)
        next_question_id += 1
        
        flash(f'{question_type.title()} question "{title}" assigned successfully!', 'success')
        return redirect(url_for('professor_dashboard'))
    
    return render_template('professor.html', show_assign_form=True)

@app.route('/professor/view_questions')
def view_questions():
    """View all assigned questions"""
    return render_template('professor.html', questions=questions, show_questions=True)

@app.route('/professor/view_submissions/<int:question_id>')
def view_submissions(question_id):
    """View submissions for a specific question"""
    question = next((q for q in questions if q['id'] == question_id), None)
    if not question:
        flash('Question not found!', 'error')
        return redirect(url_for('professor_dashboard'))
    
    question_submissions = [s for s in submissions if s['question_id'] == question_id]
    
    # Get student names for submissions
    for submission in question_submissions:
        student = next((s for s in students if s['id'] == submission['student_id']), None)
        submission['student_name'] = student['name'] if student else 'Unknown'
        
        # Get feedback for this submission
        submission_feedback = [f for f in feedback if f['submission_id'] == submission['id']]
        submission['feedback'] = submission_feedback[0] if submission_feedback else None
    
    return render_template('view_submissions.html', 
                         question=question, 
                         submissions=question_submissions)

@app.route('/professor/provide_feedback', methods=['POST'])
def provide_feedback():
    """Provide feedback for a student submission"""
    global next_feedback_id
    
    submission_id = int(request.form.get('submission_id'))
    feedback_text = request.form.get('feedback')
    score = request.form.get('score')
    
    if not all([submission_id, feedback_text, score]):
        flash('All feedback fields are required!', 'error')
        return redirect(request.referrer)
    
    submission = next((s for s in submissions if s['id'] == submission_id), None)
    if not submission:
        flash('Submission not found!', 'error')
        return redirect(request.referrer)
    
    # Remove existing feedback for this submission
    global feedback
    feedback = [f for f in feedback if f['submission_id'] != submission_id]
    
    new_feedback = {
        'id': next_feedback_id,
        'submission_id': submission_id,
        'student_id': submission['student_id'],
        'question_id': submission['question_id'],
        'feedback': feedback_text,
        'score': int(score),
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    feedback.append(new_feedback)
    next_feedback_id += 1
    
    flash('Feedback provided successfully!', 'success')
    return redirect(request.referrer)

@app.route('/student/dashboard/<int:student_id>')
def student_dashboard(student_id):
    """Student personal dashboard"""
    student = next((s for s in students if s['id'] == student_id), None)
    if not student:
        flash('Student not found!', 'error')
        return redirect(url_for('student'))
    
    # Get student's submissions and feedback
    student_submissions = [s for s in submissions if s['student_id'] == student_id]
    student_feedback = [f for f in feedback if f['student_id'] == student_id]
    
    # Calculate analytics
    total_questions = len(questions)
    completed_questions = len(student_submissions)
    average_score = 0
    
    if student_feedback:
        average_score = sum(f['score'] for f in student_feedback) / len(student_feedback)
    
    # Get question details for submissions
    for submission in student_submissions:
        question = next((q for q in questions if q['id'] == submission['question_id']), None)
        submission['question_title'] = question['title'] if question else 'Unknown'
        submission['question_type'] = question['type'] if question else 'Unknown'
        
        # Get feedback for this submission
        submission_feedback = next((f for f in feedback if f['submission_id'] == submission['id']), None)
        submission['feedback'] = submission_feedback
    
    return render_template('student_dashboard.html',
                         student=student,
                         submissions=student_submissions,
                         total_questions=total_questions,
                         completed_questions=completed_questions,
                         average_score=average_score,
                         questions=questions)

@app.route('/student/view_questions/<int:student_id>')
def view_student_questions(student_id):
    """View available questions for student"""
    student = next((s for s in students if s['id'] == student_id), None)
    if not student:
        flash('Student not found!', 'error')
        return redirect(url_for('student'))
    
    # Mark which questions have been submitted
    student_submissions = [s for s in submissions if s['student_id'] == student_id]
    submitted_question_ids = [s['question_id'] for s in student_submissions]
    
    questions_with_status = []
    for question in questions:
        question_copy = question.copy()
        question_copy['submitted'] = question['id'] in submitted_question_ids
        
        # Get feedback if submitted
        if question_copy['submitted']:
            submission = next((s for s in student_submissions if s['question_id'] == question['id']), None)
            if submission:
                question_feedback = next((f for f in feedback if f['submission_id'] == submission['id']), None)
                question_copy['feedback'] = question_feedback
        
        questions_with_status.append(question_copy)
    
    return render_template('student.html',
                         student=student,
                         questions=questions_with_status,
                         show_questions=True)

@app.route('/student/submit_answer', methods=['POST'])
def submit_answer():
    """Submit answer for a question"""
    global next_submission_id
    
    student_id = int(request.form.get('student_id'))
    question_id = int(request.form.get('question_id'))
    answer = request.form.get('answer')
    
    if not all([student_id, question_id, answer]):
        flash('All fields are required!', 'error')
        return redirect(request.referrer)
    
    # Check if student has already submitted for this question
    existing_submission = next((s for s in submissions 
                              if s['student_id'] == student_id and s['question_id'] == question_id), None)
    
    if existing_submission:
        flash('You have already submitted an answer for this question!', 'error')
        return redirect(request.referrer)
    
    new_submission = {
        'id': next_submission_id,
        'student_id': student_id,
        'question_id': question_id,
        'answer': answer,
        'submitted_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    submissions.append(new_submission)
    next_submission_id += 1
    
    flash('Answer submitted successfully!', 'success')
    return redirect(url_for('view_student_questions', student_id=student_id))

@app.route('/api/analytics_data')
def analytics_data():
    """API endpoint for chart data"""
    # Student completion rates
    student_data = []
    labels = []
    completion_rates = []
    
    for student in students:
        student_submissions = [s for s in submissions if s['student_id'] == student['id']]
        completion_rate = (len(student_submissions) / max(len(questions), 1)) * 100
        
        labels.append(student['name'])
        completion_rates.append(completion_rate)
    
    return jsonify({
        'labels': labels,
        'completion_rates': completion_rates,
        'total_questions': len(questions),
        'total_submissions': len(submissions)
    })

# Peer Collaboration Routes
@app.route('/collaboration')
def collaboration():
    """Main collaboration hub"""
    return render_template('collaboration.html', 
                         students=students,
                         study_groups=study_groups)

@app.route('/collaboration/<int:student_id>')
def student_collaboration(student_id):
    """Student-specific collaboration dashboard"""
    student = next((s for s in students if s['id'] == student_id), None)
    if not student:
        flash('Student not found!', 'error')
        return redirect(url_for('collaboration'))
    
    # Get student's groups
    student_groups = [g for g in study_groups if student_id in g['members']]
    
    # Get recent code shares
    student_shares = [s for s in code_shares if s['student_id'] == student_id][-5:]
    
    # Get active pair programming sessions
    active_sessions = [s for s in pair_programming_sessions if s['active'] and student_id in [s['student1_id'], s['student2_id']]]
    
    return render_template('student_collaboration.html',
                         student=student,
                         students=students,
                         study_groups=student_groups,
                         all_groups=study_groups,
                         code_shares=student_shares,
                         active_sessions=active_sessions)

@app.route('/collaboration/create_group', methods=['POST'])
def create_study_group():
    """Create a new study group"""
    global next_group_id
    
    group_name = request.form.get('group_name')
    description = request.form.get('description')
    creator_id = int(request.form.get('creator_id'))
    
    if not all([group_name, description, creator_id]):
        flash('All fields are required!', 'error')
        return redirect(request.referrer)
    
    new_group = {
        'id': next_group_id,
        'name': group_name,
        'description': description,
        'members': [creator_id],
        'created_by': creator_id,
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'active': True
    }
    
    study_groups.append(new_group)
    next_group_id += 1
    
    flash(f'Study group "{group_name}" created successfully!', 'success')
    return redirect(url_for('student_collaboration', student_id=creator_id))

@app.route('/collaboration/join_group', methods=['POST'])
def join_study_group():
    """Join an existing study group"""
    group_id = int(request.form.get('group_id'))
    student_id = int(request.form.get('student_id'))
    
    group = next((g for g in study_groups if g['id'] == group_id), None)
    if not group:
        flash('Study group not found!', 'error')
        return redirect(request.referrer)
    
    if student_id not in group['members']:
        group['members'].append(student_id)
        flash(f'Successfully joined "{group["name"]}"!', 'success')
    else:
        flash('You are already a member of this group!', 'warning')
    
    return redirect(url_for('student_collaboration', student_id=student_id))

@app.route('/collaboration/pair_programming', methods=['GET', 'POST'])
def pair_programming():
    """Start or join pair programming session"""
    if request.method == 'POST':
        global next_session_id
        
        student1_id = int(request.form.get('student1_id'))
        student2_id = int(request.form.get('student2_id'))
        problem_title = request.form.get('problem_title')
        
        if not all([student1_id, student2_id, problem_title]):
            flash('All fields are required!', 'error')
            return redirect(request.referrer)
        
        new_session = {
            'id': next_session_id,
            'student1_id': student1_id,
            'student2_id': student2_id,
            'problem_title': problem_title,
            'code': '# Start coding here...\n\n',
            'started_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'active': True
        }
        
        pair_programming_sessions.append(new_session)
        next_session_id += 1
        
        flash('Pair programming session started!', 'success')
        return redirect(url_for('pair_session', session_id=new_session['id']))
    
    return render_template('pair_programming.html', students=students)

@app.route('/collaboration/pair_session/<int:session_id>')
def pair_session(session_id):
    """Live pair programming session"""
    session = next((s for s in pair_programming_sessions if s['id'] == session_id), None)
    if not session:
        flash('Session not found!', 'error')
        return redirect(url_for('pair_programming'))
    
    # Get student names
    student1 = next((s for s in students if s['id'] == session['student1_id']), None)
    student2 = next((s for s in students if s['id'] == session['student2_id']), None)
    
    return render_template('pair_session.html', 
                         session=session,
                         student1=student1,
                         student2=student2)

@app.route('/collaboration/share_code', methods=['POST'])
def share_code():
    """Share code with peers"""
    global next_share_id
    
    student_id = int(request.form.get('student_id'))
    title = request.form.get('title')
    code = request.form.get('code')
    description = request.form.get('description')
    help_needed = request.form.get('help_needed') == 'on'
    
    if not all([student_id, title, code]):
        flash('Title and code are required!', 'error')
        return redirect(request.referrer)
    
    new_share = {
        'id': next_share_id,
        'student_id': student_id,
        'title': title,
        'code': code,
        'description': description or '',
        'help_needed': help_needed,
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'comments': []
    }
    
    code_shares.append(new_share)
    next_share_id += 1
    
    flash('Code shared successfully!', 'success')
    return redirect(url_for('student_collaboration', student_id=student_id))

@app.route('/collaboration/code_gallery')
def code_gallery():
    """View all shared code"""
    # Get student names for each share
    for share in code_shares:
        student = next((s for s in students if s['id'] == share['student_id']), None)
        share['student_name'] = student['name'] if student else 'Unknown'
    
    return render_template('code_gallery.html', 
                         code_shares=code_shares,
                         students=students)

@app.route('/api/update_pair_code', methods=['POST'])
def update_pair_code():
    """API endpoint to update pair programming code in real-time"""
    session_id = int(request.json.get('session_id'))
    code = request.json.get('code')
    
    session = next((s for s in pair_programming_sessions if s['id'] == session_id), None)
    if session:
        session['code'] = code
        return jsonify({'success': True})
    
    return jsonify({'success': False, 'error': 'Session not found'})

@app.route('/api/get_pair_code/<int:session_id>')
def get_pair_code(session_id):
    """API endpoint to get current pair programming code"""
    session = next((s for s in pair_programming_sessions if s['id'] == session_id), None)
    if session:
        return jsonify({'code': session['code']})
    
    return jsonify({'error': 'Session not found'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
