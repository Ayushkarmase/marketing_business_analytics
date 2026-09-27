import os
import sys
from pathlib import Path

# Ensure backend root is in python path
sys.path.append(str(Path(__file__).resolve().parent))

from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from database import init_db, db_session
from routes import auth_bp, business_bp, datasource_bp, analytics_bp, ml_bp, report_bp
from models import Business
from seed.demo_data_generator import seed_demo_environment

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable Cross-Origin Resource Sharing
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Teardown database session
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(business_bp, url_prefix="/api/business")
    app.register_blueprint(datasource_bp, url_prefix="/api/datasources")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(ml_bp, url_prefix="/api/ml")
    app.register_blueprint(report_bp, url_prefix="/api/reports")

    @app.route("/", methods=["GET"])
    @app.route("/api", methods=["GET"])
    def root():
        """Root route — the dashboard frontend runs on http://localhost:5173/"""
        return jsonify({
            "message": "Marketing Business Analytics Tool — Backend API",
            "academic_year": "2026-2027",
            "dashboard_frontend": "http://localhost:5173/",
            "api_health": "http://127.0.0.1:5000/api/health",
            "note": "Open http://localhost:5173/ in your browser to access the dashboard."
        }), 200

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "project": "Marketing Business Analytics Tool",
            "academic_year": "2026-2027",
            "version": "1.0.0"
        }), 200

    # Initialize tables and seed demo data if fresh
    with app.app_context():
        init_db()
        if not db_session.query(Business).first():
            print("Fresh database detected. Seeding sample demo environment...")
            seed_demo_environment()

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"Starting Marketing Business Analytics API server on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=True)
