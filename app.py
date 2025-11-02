from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from models import db, User, Alert, Resource, Request

app = Flask(__name__)
app.config['SECRET_KEY'] = 'flood-friend-secret-key-2024'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///floodfriend.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def is_admin():
    return current_user.is_authenticated and current_user.role == "admin"

def is_user():
    return current_user.is_authenticated and current_user.role == "user"

def create_default_admin():
    db.create_all()
    admin = User.query.filter_by(username="admin").first()
    if not admin:
        admin = User(username="admin", email="admin@site.com", role="admin")
        admin.set_password("admin123")
        db.session.add(admin)
        db.session.commit()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user, remember=False)
            return redirect(url_for('index'))
        else:
            flash('Invalid username or password', 'error')
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out', 'success')
    return redirect(url_for('index'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'error')
            return render_template('register.html')
        if User.query.filter_by(email=email).first():
            flash('Email already exists', 'error')
            return render_template('register.html')
        user = User(username=username, email=email, role="user")
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        login_user(user, remember=False)
        flash('Account created successfully!', 'success')
        return redirect(url_for('index'))
    return render_template('register.html')

@app.route('/admin/users', methods=['GET', 'POST'])
@login_required
def admin_users():
    if not is_admin():
        flash('Only admin can access user management.', 'error')
        return redirect(url_for('index'))
    users = User.query.order_by(User.id).all()
    if request.method == 'POST':
        to_admin_id = request.form.get('user_id')
        user_to_admin = User.query.get(to_admin_id)
        if user_to_admin and user_to_admin.role != 'admin':
            user_to_admin.role = 'admin'
            db.session.commit()
            flash(f"User {user_to_admin.username} promoted to admin.", 'success')
        return redirect(url_for('admin_users'))
    return render_template('admin_users.html', users=users)

@app.route('/resources')
def resources():
    resources_list = Resource.query.all()
    return render_template('resources.html', resources=resources_list)

@app.route('/resources/add', methods=['POST'])
@login_required
def add_resource():
    if not is_admin():
        return jsonify({'error': 'Only admin can add resources'}), 403
    try:
        data = request.get_json()
        resource = Resource(
            name=data['name'],
            type=data['type'],
            location=data['location'],
            description=data.get('description', ''),
            latitude=float(data['latitude']),
            longitude=float(data['longitude']),
            capacity=int(data.get('capacity', 0)) if data.get('capacity') else None,
            contact=data.get('contact', ''),
            userid=current_user.id,
            timestamp=datetime.utcnow()
        )
        db.session.add(resource)
        db.session.commit()
        return jsonify({'message': 'Resource added successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/resources/delete/<int:resource_id>', methods=['POST'])
@login_required
def delete_resource(resource_id):
    resource = Resource.query.get_or_404(resource_id)
    if not is_admin():
        return jsonify({'error': 'Only admin can delete resources'}), 403
    db.session.delete(resource)
    db.session.commit()
    return jsonify({'message': 'Resource deleted successfully'})

@app.route('/alerts')
def alerts():
    alerts_list = Alert.query.order_by(Alert.timestamp.desc()).all()
    return render_template('alerts.html', alerts=alerts_list)

@app.route('/alerts/add', methods=['POST'])
@login_required
def add_alert():
    if not is_admin():
        return jsonify({'error': 'Only admin can add alerts'}), 403
    try:
        data = request.get_json()
        alert = Alert(
            title=data['title'],
            location=data['location'],
            severity=data['severity'],
            description=data['description'],
            latitude=float(data['latitude']),
            longitude=float(data['longitude']),
            userid=current_user.id,
            timestamp=datetime.utcnow()
        )
        db.session.add(alert)
        db.session.commit()
        return jsonify({'message': 'Alert added successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/alerts/delete/<int:alert_id>', methods=['POST'])
@login_required
def delete_alert(alert_id):
    alert = Alert.query.get_or_404(alert_id)
    if not is_admin():
        return jsonify({'error': 'Only admin can delete alerts'}), 403
    db.session.delete(alert)
    db.session.commit()
    return jsonify({'message': 'Alert deleted successfully'})

@app.route('/analysis')
def analysis():
    alerts_by_severity = db.session.query(Alert.severity, db.func.count(Alert.id)).group_by(Alert.severity).all()
    resources_by_type = db.session.query(Resource.type, db.func.count(Resource.id)).group_by(Resource.type).all()
    recent_alerts = Alert.query.order_by(Alert.timestamp.desc()).limit(10).all()
    return render_template(
        'analysis.html',
        alerts_by_severity=alerts_by_severity,
        resources_by_type=resources_by_type,
        recent_alerts=recent_alerts
    )

@app.route('/map')
def map_page():
    alerts = Alert.query.all()
    resources = Resource.query.all()
    alerts_dict = [{
        'id': alert.id,
        'title': alert.title,
        'location': alert.location,
        'severity': alert.severity,
        'description': alert.description,
        'latitude': alert.latitude,
        'longitude': alert.longitude,
        'timestamp': alert.timestamp.isoformat() if alert.timestamp else None
    } for alert in alerts]
    resources_dict = [{
        'id': resource.id,
        'name': resource.name,
        'type': resource.type,
        'location': resource.location,
        'description': resource.description,
        'latitude': resource.latitude,
        'longitude': resource.longitude,
        'capacity': resource.capacity,
        'contact': resource.contact
    } for resource in resources]
    return render_template('map.html', alerts=alerts_dict, resources=resources_dict)

@app.route('/requests')
@login_required
def requests_page():
    if is_admin():
        requests_list = Request.query.order_by(Request.timestamp.desc()).all()
    else:
        requests_list = Request.query.filter_by(user_id=current_user.id).order_by(Request.timestamp.desc()).all()
    return render_template('requests.html', requests=requests_list)

@app.route('/request/create', methods=['POST'])
@login_required
def create_request():
    if not is_user():
        return jsonify({'error': 'Only normal users can create requests'}), 403
    data = request.get_json()
    request_entry = Request(
        user_id=current_user.id,
        resource_type=data['resource_type'],
        description=data['description'],
        status='pending',
        timestamp=datetime.utcnow()
    )
    db.session.add(request_entry)
    db.session.commit()
    return jsonify({'message': 'Request submitted successfully'}), 200

@app.route('/request/update/<int:request_id>', methods=['POST'])
@login_required
def update_request(request_id):
    if not is_admin():
        return jsonify({'error': 'Only admin can update requests'}), 403
    req = Request.query.get_or_404(request_id)
    data = request.get_json()
    if not data or 'status' not in data:
        return jsonify({'error': 'Status is required'}), 400
    req.status = data['status']
    if req.status in ['approved', 'delivered', 'rejected']:
        req.approved_by = current_user.id
    db.session.commit()
    return jsonify({'message': 'Request updated successfully'}), 200

if __name__ == '__main__':
    with app.app_context():
        create_default_admin()





