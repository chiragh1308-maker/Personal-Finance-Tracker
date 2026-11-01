from flask import Blueprint, g, request

from services.transaction_service import (
    create_transaction,
    delete_transaction,
    get_transaction_by_id,
    get_transactions,
    update_transaction,
)
from utils.helpers import error_response, login_required, success_response
from utils.validators import (
    TRANSACTION_CATEGORIES,
    TRANSACTION_TYPES,
)


transactions_bp = Blueprint("transactions", __name__)


def _request_data():
    return request.get_json(silent=True)


def _get_filters():
    filters = {
        key: value.strip()
        for key, value in request.args.items()
        if value.strip()
    }

    transaction_type = filters.get("type")
    if transaction_type and transaction_type not in TRANSACTION_TYPES:
        return None, "Invalid transaction type filter"

    category = filters.get("category")
    if category and category not in TRANSACTION_CATEGORIES:
        return None, "Invalid transaction category filter"

    for date_key in ("start_date", "end_date", "date_from", "date_to"):
        date_value = filters.get(date_key)
        if date_value:
            try:
                from utils.helpers import parse_date
                parse_date(date_value)
            except ValueError:
                return None, f"{date_key} must use YYYY-MM-DD format"

    return filters, ""


def _service_response(result):
    success, message, data, status_code = result

    if not success:
        return error_response(message, status_code, data)

    return success_response(message, data, status_code)


@transactions_bp.post("")
@transactions_bp.post("/")
@login_required
def add_transaction():
    data = _request_data()

    if data is None:
        return error_response("Request body must contain JSON data", 400)

    return _service_response(create_transaction(g.user_id, data))


@transactions_bp.get("")
@transactions_bp.get("/")
@login_required
def list_transactions():
    filters, filter_error = _get_filters()

    if filters is None:
        return error_response(filter_error, 400)

    return _service_response(get_transactions(g.user_id, filters))


@transactions_bp.get("/<int:transaction_id>")
@login_required
def transaction_details(transaction_id):
    return _service_response(
        get_transaction_by_id(g.user_id, transaction_id)
    )


@transactions_bp.put("/<int:transaction_id>")
@transactions_bp.patch("/<int:transaction_id>")
@login_required
def edit_transaction(transaction_id):
    data = _request_data()

    if data is None:
        return error_response("Request body must contain JSON data", 400)

    return _service_response(
        update_transaction(g.user_id, transaction_id, data)
    )


@transactions_bp.delete("/<int:transaction_id>")
@login_required
def remove_transaction(transaction_id):
    return _service_response(
        delete_transaction(g.user_id, transaction_id)
    )
