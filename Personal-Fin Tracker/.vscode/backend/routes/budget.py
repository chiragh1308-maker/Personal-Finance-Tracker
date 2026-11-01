from flask import Blueprint, g, request

from services.budget_service import (
    create_budget,
    delete_budget,
    get_budget_by_id,
    get_budgets,
    update_budget,
)
from utils.helpers import error_response, login_required, success_response


budget_bp = Blueprint("budget", __name__)


def _request_data():
    return request.get_json(silent=True)


def _service_response(result):
    success, message, data, status_code = result

    if not success:
        return error_response(message, status_code, data)

    return success_response(message, data, status_code)


@budget_bp.post("")
@budget_bp.post("/")
@login_required
def add_budget():
    data = _request_data()

    if data is None:
        return error_response("Request body must contain JSON data", 400)

    return _service_response(create_budget(g.user_id, data))


@budget_bp.get("")
@budget_bp.get("/")
@login_required
def list_budgets():
    return _service_response(get_budgets(g.user_id))


@budget_bp.get("/<int:budget_id>")
@login_required
def budget_details(budget_id):
    return _service_response(get_budget_by_id(g.user_id, budget_id))


@budget_bp.put("/<int:budget_id>")
@budget_bp.patch("/<int:budget_id>")
@login_required
def edit_budget(budget_id):
    data = _request_data()

    if data is None:
        return error_response("Request body must contain JSON data", 400)

    return _service_response(
        update_budget(g.user_id, budget_id, data)
    )


@budget_bp.delete("/<int:budget_id>")
@login_required
def remove_budget(budget_id):
    return _service_response(delete_budget(g.user_id, budget_id))
