import os
from flask import Flask
from flask_cors import CORS
from .models import db  # Relative import works when run as package

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Database config
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database/app.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    # Import blueprints within app context
    with app.app_context():
        from .routes.user import user_bp
        from .routes.workouts import workouts_bp
        from .routes.progress import progress_bp
        from .routes.exercises import exercises_bp
        from .routes.data_management import data_management_bp
        from .routes.templates import templates_bp
        from .routes.video_server import video_bp
        
        app.register_blueprint(user_bp, url_prefix='/api')
        app.register_blueprint(workouts_bp, url_prefix='/api')
        app.register_blueprint(progress_bp, url_prefix='/api')
        app.register_blueprint(exercises_bp, url_prefix='/api')
        app.register_blueprint(data_management_bp, url_prefix='/api')
        app.register_blueprint(templates_bp, url_prefix='/api')
        app.register_blueprint(video_bp)
        
    return app