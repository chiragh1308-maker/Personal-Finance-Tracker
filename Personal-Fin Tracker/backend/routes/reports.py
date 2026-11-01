from flask import Blueprint, g, request

from services.report_service import get_dashboard, get_report
from utils.helpers import error_response, login_required, parse_date, success_response


reports_bp = Blueprint("reports", __name__)


def _date_filters():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    for field_name, value in (
        ("start_date", start_date),
        ("end_date", end_date),
    ):
        if value:
            try:
                parse_date(value)
            except ValueError:
                return None, None, f"{field_name} must use YYYY-MM-DD format"

    if start_date and end_date and start_date > end_date:
        return None, None, "start_date cannot be after end_date"

    return start_date, end_date, ""


def _service_response(result):
    success, message, data, status_code = result

    if not success:
        return error_response(message, status_code, data)

    return success_response(message, data, status_code)


@reports_bp.get("")
@reports_bp.get("/")
@reports_bp.get("/summary")
@login_required
def report_summary():
    start_date, end_date, date_error = _date_filters()

    if date_error:
        return error_response(date_error, 400)

    return _service_response(
        get_report(g.user_id, start_date, end_date)
    )


@reports_bp.get("/dashboard")
@login_required
def dashboard():
    return _service_response(get_dashboard(g.user_id))


@reports_bp.get("/insights")
@login_required
def insights():
    start_date, end_date, date_error = _date_filters()

    if date_error:
        return error_response(date_error, 400)

    success, message, data, status_code = get_report(
        g.user_id,
        start_date,
        end_date,
    )

    if success:
        data = {
            "financial_insights": data.get("financial_insights", []),
        }

    return _service_response((success, message, data, status_code))
