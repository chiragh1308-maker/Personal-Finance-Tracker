from werkzeug.security import check_password_hash, generate_password_hash

from utils.helpers import (
    close_db_connection,
    get_current_user_id,
    get_db_connection,
    serialize_row,
)
from utils.validators import validate_email, validate_password

try:
    from mysql.connector import Error
except ModuleNotFoundError:
    class Error(Exception):
        pass


def register_user(name, email, password):
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 100:
        return False, "Name must contain 1 to 100 characters", {}, 400

    email_is_valid, email_error = validate_email(email)
    if not email_is_valid:
        return False, email_error, {}, 400

    password_is_valid, password_error = validate_password(password)
    if not password_is_valid:
        return False, password_error, {}, 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT id FROM users WHERE email = %s",
            (email.strip().lower(),),
        )
        if cursor.fetchone() is not None:
            return False, "An account with this email already exists", {}, 409

        password_hash = generate_password_hash(password)
        cursor.execute(
            """
            INSERT INTO users (name, email, password)
            VALUES (%s, %s, %s)
            """,
            (name.strip(), email.strip().lower(), password_hash),
        )
        connection.commit()

        return True, "User registered successfully", {
            "user_id": cursor.lastrowid,
            "name": name.strip(),
            "email": email.strip().lower(),
        }, 201
    except Exception:
        if connection is not None:
            connection.rollback()
        return False, "Unable to register user. Please make sure MySQL is running.", {}, 503
    finally:
        close_db_connection(connection, cursor)


def login_user(email, password):
    email_is_valid, email_error = validate_email(email)
    if not email_is_valid:
        return False, email_error, {}, 400

    if not isinstance(password, str) or not password:
        return False, "Password is required", {}, 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, name, email, password, created_at
            FROM users
            WHERE email = %s
            """,
            (email.strip().lower(),),
        )
        user = cursor.fetchone()

        if user is None or not check_password_hash(user["password"], password):
            return False, "Invalid email or password", {}, 401

        from flask import session
        session["user_id"] = user["id"]

        user.pop("password", None)
        return True, "Login successful", serialize_row(user), 200
    except Exception:
        return False, "Unable to log in. Please make sure MySQL is running.", {}, 503
    finally:
        close_db_connection(connection, cursor)


def logout_user():
    from flask import session
    session.clear()
    return True, "Logout successful", {}, 200


def get_authenticated_user():
    user_id = get_current_user_id()
    if user_id is None:
        return False, "Authentication is required", {}, 401

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, name, email, created_at
            FROM users
            WHERE id = %s
            """,
            (user_id,),
        )
        user = cursor.fetchone()

        if user is None:
            return False, "User account was not found", {}, 404

        return True, "Authenticated user", serialize_row(user), 200
    except Exception:
        return False, "Unable to check authentication. Please make sure MySQL is running.", {}, 503
    finally:
        close_db_connection(connection, cursor)
