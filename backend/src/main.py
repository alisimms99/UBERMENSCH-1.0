import os
from flask import Flask
from flask_cors import CORS
from .models import db

def create_app():
    app = Flask(__name__)
    
    # Database configuration (FIXED)
    basedir = os.path.abspath(os.path.dirname(__file__))  # THIS WAS MISSING
    database_path = os.path.join(basedir, 'database', 'app.db')
    os.makedirs(os.path.dirname(database_path), exist_ok=True)  # Ensure directory exists
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{database_path}'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['VIDEO_ROOT_PATH'] = os.environ.get('VIDEO_ROOT_PATH')
    
    db.init_app(app)
    
    with app.app_context():
        # Import blueprints
        from .routes.user import user_bp
        from .routes.workouts import workouts_bp
        from .routes.progress import progress_bp
        from .routes.exercises import exercises_bp
        from .routes.data_management import data_management_bp
        from .routes.templates import templates_bp
        from .routes.video_server import video_bp
        from .routes.supplements import supplements_bp
        from .routes.metrics import metrics_bp
        from .routes.diary import diary_bp
        
        # Register blueprints
        app.register_blueprint(user_bp, url_prefix='/api')
        app.register_blueprint(workouts_bp, url_prefix='/api')
        app.register_blueprint(progress_bp, url_prefix='/api')
        app.register_blueprint(exercises_bp, url_prefix='/api')
        app.register_blueprint(data_management_bp, url_prefix='/api')
        app.register_blueprint(templates_bp, url_prefix='/api')
        app.register_blueprint(video_bp)
        app.register_blueprint(supplements_bp, url_prefix='/api/supplements')
        app.register_blueprint(metrics_bp, url_prefix='/api/metrics')
        app.register_blueprint(diary_bp, url_prefix='/api/diary')
        # Initialize CORS after registering blueprints
        CORS(app)
        
        db.create_all()  # Create tables if they don't exist
    
    return app