from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from config import Config
from routes.auth import auth_bp
from routes.transactions import transactions_bp
from routes.budget import budget_bp
from routes.reports import reports_bp


PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIRECTORY = PROJECT_ROOT / "front-end"
CSS_DIRECTORY = PROJECT_ROOT / "CSS"


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(transactions_bp, url_prefix="/api/transactions")
    app.register_blueprint(budget_bp, url_prefix="/api/budgets")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    @app.get("/")
    def home():
        return send_from_directory(FRONTEND_DIRECTORY, "dashboard.html")

    @app.get("/CSS/<path:filename>")
    def serve_css(filename):
        return send_from_directory(CSS_DIRECTORY, filename)

    @app.get("/css/<path:filename>")
    def serve_frontend_css(filename):
        return send_from_directory(FRONTEND_DIRECTORY / "css", filename)

    @app.get("/js/<path:filename>")
    def serve_frontend_js(filename):
        return send_from_directory(FRONTEND_DIRECTORY / "js", filename)

    @app.get("/assets/<path:filename>")
    def serve_assets(filename):
        return send_from_directory(FRONTEND_DIRECTORY / "assets", filename)

    @app.get("/<path:page>")
    def serve_frontend_page(page):
        if not page.endswith(".html"):
            return handle_not_found(None)

        return send_from_directory(FRONTEND_DIRECTORY, page)

    @app.get("/api/health")
    def health_check():
        return jsonify({
            "success": True,
            "message": "API is healthy",
            "data": {}
        }), 200

    @app.errorhandler(404)
    def handle_not_found(error):
        return jsonify({
            "success": False,
            "message": "The requested endpoint was not found"
        }), 404

    @app.errorhandler(500)
    def handle_server_error(error):
        return jsonify({
            "success": False,
            "message": "An internal server error occurred"
        }), 500

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=app.config.get("PORT", 5000),
        debug=app.config.get("DEBUG", False)
    )
