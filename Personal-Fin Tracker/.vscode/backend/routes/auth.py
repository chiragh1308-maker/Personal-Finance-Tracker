from flask import Blueprint, request

from services.auth_service import (
    get_authenticated_user,
    login_user,
    logout_user,
    register_user,
)
from utils.helpers import error_response, success_response


auth_bp = Blueprint("auth", __name__)


def _request_data():
    return request.get_json(silent=True) or {}


@auth_bp.post("/register")
def register():
    data = _request_data()
    required_fields = ("name", "email", "password")

    missing_fields = [
        field for field in required_fields
        if field not in data
    ]

    if missing_fields:
        return error_response(
            "Missing required fields",
            400,
            {"missing_fields": missing_fields},
        )

    success, message, response_data, status_code = register_user(
        data["name"],
        data["email"],
        data["password"],
    )

    if not success:
        return error_response(message, status_code, response_data)

    return success_response(message, response_data, status_code)


@auth_bp.post("/login")
def login():
    data = _request_data()

    if "email" not in data or "password" not in data:
        return error_response(
            "Email and password are required",
            400,
        )

    success, message, response_data, status_code = login_user(
        data["email"],
        data["password"],
    )

    if not success:
        return error_response(message, status_code, response_data)

    return success_response(message, response_data, status_code)


@auth_bp.post("/logout")
def logout():
    success, message, response_data, status_code = logout_user()
    return success_response(message, response_data, status_code)


@auth_bp.get("/check")
@auth_bp.get("/me")
def check_authentication():
    success, message, response_data, status_code = get_authenticated_user()

    if not success:
        return error_response(message, status_code, response_data)

    return success_response(message, response_data, status_code)
