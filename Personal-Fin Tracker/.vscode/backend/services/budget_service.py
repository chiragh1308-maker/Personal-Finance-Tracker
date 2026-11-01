from datetime import date, timedelta
from decimal import Decimal

from utils.helpers import (
    close_db_connection,
    get_db_connection,
    serialize_row,
)
from utils.validators import validate_budget_data

try:
    from mysql.connector import Error
except ModuleNotFoundError:
    class Error(Exception):
        pass


BUDGET_FIELDS = {"category", "budget_amount", "period"}


def _normalize_budget_data(data):
    normalized_data = dict(data)

    if "budget_amount" not in normalized_data and "amount" in normalized_data:
        normalized_data["budget_amount"] = normalized_data.pop("amount")

    return normalized_data


def _period_dates(period):
    today = date.today()

    if period == "weekly":
        period_start = today - timedelta(days=today.weekday())
        period_end = period_start + timedelta(days=6)
    elif period == "yearly":
        period_start = date(today.year, 1, 1)
        period_end = date(today.year, 12, 31)
    else:
        period_start = date(today.year, today.month, 1)
        if today.month == 12:
            next_month = date(today.year + 1, 1, 1)
        else:
            next_month = date(today.year, today.month + 1, 1)
        period_end = next_month - timedelta(days=1)

    return period_start, period_end


def _get_spent_amount(cursor, user_id, category, period):
    period_start, period_end = _period_dates(period)
    cursor.execute(
        """
        SELECT COALESCE(SUM(amount), 0) AS spent
        FROM transactions
        WHERE user_id = %s
          AND category = %s
          AND type = 'expense'
          AND transaction_date BETWEEN %s AND %s
        """,
        (user_id, category, period_start, period_end),
    )
    result = cursor.fetchone()
    return Decimal(str(result["spent"] or 0))


def _format_budget(cursor, row, user_id):
    budget = serialize_row(row)
    budget_amount = Decimal(str(row["budget_amount"]))
    spent = _get_spent_amount(
        cursor,
        user_id,
        row["category"],
        row["period"],
    )
    remaining = budget_amount - spent
    percentage_used = (
        (spent / budget_amount) * Decimal("100")
        if budget_amount > 0
        else Decimal("0")
    )

    budget["amount"] = float(budget_amount)
    budget["spent"] = float(spent)
    budget["remaining"] = float(remaining)
    budget["percentage_used"] = round(float(percentage_used), 2)
    budget["is_warning"] = percentage_used >= Decimal("80")
    budget["is_exceeded"] = spent > budget_amount

    if spent > budget_amount:
        budget["status"] = "exceeded"
        budget["alert"] = "Budget exceeded"
    elif percentage_used >= Decimal("80"):
        budget["status"] = "warning"
        budget["alert"] = "Budget is close to its limit"
    else:
        budget["status"] = "within_limit"
        budget["alert"] = "Budget is within its limit"

    return budget


def _get_budget(cursor, budget_id, user_id):
    cursor.execute(
        """
        SELECT id, user_id, category, budget_amount, period, created_at
        FROM budgets
        WHERE id = %s AND user_id = %s
        """,
        (budget_id, user_id),
    )
    return cursor.fetchone()


def create_budget(user_id, data):
    if not isinstance(data, dict):
        return False, "Budget data must be a JSON object", {}, 400

    budget_data = _normalize_budget_data(data)
    unknown_fields = set(budget_data) - BUDGET_FIELDS

    if unknown_fields:
        return False, "Invalid budget fields", {
            "fields": sorted(unknown_fields),
        }, 400

    is_valid, errors = validate_budget_data(budget_data)
    if not is_valid:
        return False, "Invalid budget data", errors, 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            INSERT INTO budgets (user_id, category, budget_amount, period)
            VALUES (%s, %s, %s, %s)
            """,
            (
                user_id,
                budget_data["category"],
                Decimal(str(budget_data["budget_amount"])),
                budget_data["period"],
            ),
        )
        budget_id = cursor.lastrowid
        connection.commit()

        budget = _get_budget(cursor, budget_id, user_id)
        return True, "Budget added successfully", {
            "budget": _format_budget(cursor, budget, user_id),
        }, 201
    except Error:
        if connection is not None:
            connection.rollback()
        return False, "Unable to add budget", {}, 500
    finally:
        close_db_connection(connection, cursor)


def get_budgets(user_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, user_id, category, budget_amount, period, created_at
            FROM budgets
            WHERE user_id = %s
            ORDER BY created_at DESC, id DESC
            """,
            (user_id,),
        )
        budgets = cursor.fetchall()
        formatted_budgets = [
            _format_budget(cursor, budget, user_id)
            for budget in budgets
        ]

        return True, "Budgets retrieved successfully", {
            "budgets": formatted_budgets,
            "count": len(formatted_budgets),
        }, 200
    except Error:
        return False, "Unable to retrieve budgets", {}, 500
    finally:
        close_db_connection(connection, cursor)


def get_budget_by_id(user_id, budget_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        budget = _get_budget(cursor, budget_id, user_id)

        if budget is None:
            return False, "Budget not found", {}, 404

        return True, "Budget retrieved successfully", {
            "budget": _format_budget(cursor, budget, user_id),
        }, 200
    except Error:
        return False, "Unable to retrieve budget", {}, 500
    finally:
        close_db_connection(connection, cursor)


def update_budget(user_id, budget_id, data):
    if not isinstance(data, dict):
        return False, "Budget data must be a JSON object", {}, 400

    budget_data = _normalize_budget_data(data)
    unknown_fields = set(budget_data) - BUDGET_FIELDS

    if unknown_fields:
        return False, "Invalid budget fields", {
            "fields": sorted(unknown_fields),
        }, 400

    if not budget_data:
        return False, "At least one field is required", {}, 400

    is_valid, errors = validate_budget_data(budget_data, partial=True)
    if not is_valid:
        return False, "Invalid budget data", errors, 400

    fields = []
    values = []

    for field in BUDGET_FIELDS:
        if field not in budget_data:
            continue

        fields.append(f"{field} = %s")
        value = budget_data[field]
        if field == "budget_amount":
            value = Decimal(str(value))
        values.append(value)

    values.extend([budget_id, user_id])
    query = f"""
        UPDATE budgets
        SET {', '.join(fields)}
        WHERE id = %s AND user_id = %s
    """

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(values))

        if cursor.rowcount == 0:
            connection.rollback()
            return False, "Budget not found", {}, 404

        connection.commit()
        budget = _get_budget(cursor, budget_id, user_id)

        return True, "Budget updated successfully", {
            "budget": _format_budget(cursor, budget, user_id),
        }, 200
    except Error:
        if connection is not None:
            connection.rollback()
        return False, "Unable to update budget", {}, 500
    finally:
        close_db_connection(connection, cursor)


def delete_budget(user_id, budget_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            DELETE FROM budgets
            WHERE id = %s AND user_id = %s
            """,
            (budget_id, user_id),
        )

        if cursor.rowcount == 0:
            connection.rollback()
            return False, "Budget not found", {}, 404

        connection.commit()
        return True, "Budget deleted successfully", {}, 200
    except Error:
        if connection is not None:
            connection.rollback()
        return False, "Unable to delete budget", {}, 500
    finally:
        close_db_connection(connection, cursor)
