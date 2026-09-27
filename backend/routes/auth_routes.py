from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from database import db_session
from models import User, Business

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    role = data.get("role", "business_owner")

    if not email or not password or not full_name:
        return jsonify({"error": "Email, password, and full name are required."}), 400

    existing = db_session.query(User).filter_by(email=email).first()
    if existing:
        return jsonify({"error": "User with this email already exists."}), 409

    # Default business if none attached
    biz = db_session.query(Business).first()
    biz_id = biz.id if biz else None

    user = User(
        email=email,
        password_hash=generate_password_hash(password),
        full_name=full_name,
        role=role,
        business_id=biz_id
    )
    db_session.add(user)
    db_session.commit()

    return jsonify({
        "message": "User registered successfully",
        "user": user.to_dict()
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    user = db_session.query(User).filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or credentials."}), 401

    return jsonify({
        "message": "Login successful",
        "user": user.to_dict()
    }), 200

@auth_bp.route("/me", methods=["GET"])
def get_current_user():
    user = db_session.query(User).first()
    if not user:
        return jsonify({"user": None}), 200
    return jsonify({"user": user.to_dict()}), 200

@auth_bp.route("/users", methods=["GET"])
def list_users():
    """Returns all registered users for Company Administrator visibility."""
    users = db_session.query(User).all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200

@auth_bp.route("/switch-role", methods=["POST"])
def switch_role():
    """Allows testing capabilities across the 4 specified user roles."""
    data = request.get_json() or {}
    role = data.get("role")
    valid_roles = ["business_owner", "marketing_manager", "business_analyst", "company_admin"]
    if role not in valid_roles:
        return jsonify({"error": f"Invalid role. Must be one of: {valid_roles}"}), 400

    user = db_session.query(User).filter_by(role=role).first()
    if not user:
        user = db_session.query(User).first()
        if user:
            user.role = role
            db_session.commit()

    return jsonify({
        "message": f"Switched to {role}",
        "user": user.to_dict() if user else None
    }), 200
