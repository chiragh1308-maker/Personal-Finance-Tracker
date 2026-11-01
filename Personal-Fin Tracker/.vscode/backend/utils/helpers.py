from datetime import date, datetime
from decimal import Decimal
from functools import wraps

from flask import g, jsonify, session

from config import Config

try:
    import mysql.connector as mysql_connector
except ModuleNotFoundError:
    mysql_connector = None


def get_db_connection():
    """Create and return a MySQL database connection."""
    if mysql_connector is None:
        raise RuntimeError(
            "MySQL connector is not installed. Run: python -m pip install -r requirements.txt"
        )

    return mysql_connector.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE,
        use_pure=True,
    )


def close_db_connection(connection, cursor=None):
    """Close a cursor and connection when they are no longer needed."""
    if cursor is not None:
        cursor.close()
    if connection is not None and connection.is_connected():
        connection.close()


def success_response(message, data=None, status_code=200):
    response_data = {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }
    return jsonify(response_data), status_code


def error_response(message, status_code=400, data=None):
    response_data = {
        "success": False,
        "message": message,
    }
    if data is not None:
        response_data["data"] = data
    return jsonify(response_data), status_code


def serialize_value(value):
    """Convert common MySQL values into JSON-compatible values."""
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def serialize_row(row):
    if row is None:
        return None
    return {key: serialize_value(value) for key, value in row.items()}


def serialize_rows(rows):
    return [serialize_row(row) for row in rows]


def parse_date(date_value):
    """Parse a YYYY-MM-DD string into a date object."""
    return datetime.strptime(date_value, "%Y-%m-%d").date()


def today_as_string():
    return date.today().isoformat()


def get_current_user_id():
    return session.get("user_id")


def login_required(function):
    """Allow a route only when a user is logged in."""
    @wraps(function)
    def decorated_function(*args, **kwargs):
        user_id = get_current_user_id()
        if user_id is None:
            return error_response("Authentication is required", 401)

        g.user_id = user_id
        return function(*args, **kwargs)

    return decorated_function
