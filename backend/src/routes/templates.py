from flask import Blueprint, jsonify, request
from ..models import WorkoutTemplate, WorkoutTemplateExercise, db

templates_bp = Blueprint('templates', __name__)

@templates_bp.route('/templates', methods=['GET'])
def get_templates():
    templates = WorkoutTemplate.query.all()
    # Ensure exercises are sorted
    return jsonify([t.to_dict() for t in templates])

@templates_bp.route('/templates/<int:template_id>', methods=['GET'])
def get_template(template_id):
    template = WorkoutTemplate.query.get_or_404(template_id)
    return jsonify(template.to_dict())
