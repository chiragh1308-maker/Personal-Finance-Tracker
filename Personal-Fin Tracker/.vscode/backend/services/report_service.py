from decimal import Decimal

from utils.helpers import close_db_connection, get_db_connection, serialize_rows

try:
    from mysql.connector import Error
except ModuleNotFoundError:
    class Error(Exception):
        pass


def _decimal(value):
    return Decimal(str(value or 0))


def _date_conditions(start_date=None, end_date=None):
    conditions = ["user_id = %s"]
    values = []

    if start_date:
        conditions.append("transaction_date >= %s")
        values.append(start_date)

    if end_date:
        conditions.append("transaction_date <= %s")
        values.append(end_date)

    return " AND ".join(conditions), values


def _insights(total_income, total_expenses, savings_percentage):
    insights = []

    if total_income == 0 and total_expenses == 0:
        insights.append("Add income and expense records to receive insights.")
    elif total_expenses > total_income:
        insights.append("Your expenses are higher than your income.")
    elif savings_percentage >= 20:
        insights.append("You are maintaining a healthy savings rate.")
    else:
        insights.append("Try to save more by reviewing your largest expenses.")

    if total_income > 0 and total_expenses / total_income >= Decimal("0.8"):
        insights.append("Your expenses use most of your income this period.")

    return insights


def get_report(user_id, start_date=None, end_date=None):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        condition_sql, date_values = _date_conditions(start_date, end_date)

        cursor.execute(
            f"""
            SELECT
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)
                    AS total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
                    AS total_expenses,
                COUNT(*) AS transaction_count
            FROM transactions
            WHERE {condition_sql}
            """,
            tuple([user_id] + date_values),
        )
        summary = cursor.fetchone()
        total_income = _decimal(summary["total_income"])
        total_expenses = _decimal(summary["total_expenses"])
        balance = total_income - total_expenses
        savings_percentage = (
            (balance / total_income) * Decimal("100")
            if total_income > 0
            else Decimal("0")
        )

        cursor.execute(
            f"""
            SELECT category, SUM(amount) AS amount
            FROM transactions
            WHERE {condition_sql} AND type = 'expense'
            GROUP BY category
            ORDER BY amount DESC
            """,
            tuple([user_id] + date_values),
        )
        expense_categories = [
            {
                "category": row["category"],
                "amount": float(_decimal(row["amount"])),
            }
            for row in cursor.fetchall()
        ]

        cursor.execute(
            f"""
            SELECT type, SUM(amount) AS amount
            FROM transactions
            WHERE {condition_sql}
            GROUP BY type
            """,
            tuple([user_id] + date_values),
        )
        income_vs_expense = [
            {
                "type": row["type"],
                "amount": float(_decimal(row["amount"])),
            }
            for row in cursor.fetchall()
        ]

        cursor.execute(
            f"""
            SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month,
                   type, SUM(amount) AS amount
            FROM transactions
            WHERE {condition_sql}
            GROUP BY month, type
            ORDER BY month ASC
            """,
            tuple([user_id] + date_values),
        )
        monthly_rows = cursor.fetchall()
        monthly_income = []
        monthly_expenses = []
        for row in monthly_rows:
            item = {
                "month": row["month"],
                "amount": float(_decimal(row["amount"])),
            }
            if row["type"] == "income":
                monthly_income.append(item)
            else:
                monthly_expenses.append(item)

        report_data = {
            "total_income": float(total_income),
            "total_expenses": float(total_expenses),
            "balance": float(balance),
            "savings": float(balance),
            "savings_percentage": round(float(savings_percentage), 2),
            "total_transactions": summary["transaction_count"],
            "expenses_by_category": expense_categories,
            "income_vs_expense": income_vs_expense,
            "monthly_income": monthly_income,
            "monthly_expenses": monthly_expenses,
            "financial_insights": _insights(
                total_income,
                total_expenses,
                savings_percentage,
            ),
        }
        return True, "Report generated successfully", report_data, 200
    except Error:
        return False, "Unable to generate report", {}, 500
    finally:
        close_db_connection(connection, cursor)


def get_dashboard(user_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        success, message, report_data, status_code = get_report(user_id)
        if not success:
            return success, message, report_data, status_code

        cursor.execute(
            """
            SELECT id, title, category, amount, transaction_date,
                   type, description, created_at
            FROM transactions
            WHERE user_id = %s
            ORDER BY transaction_date DESC, id DESC
            LIMIT 5
            """,
            (user_id,),
        )
        recent_transactions = serialize_rows(cursor.fetchall())
        for transaction in recent_transactions:
            transaction["date"] = transaction["transaction_date"]

        cursor.execute(
            """
            SELECT id, category, budget_amount, period
            FROM budgets
            WHERE user_id = %s
            ORDER BY id DESC
            """,
            (user_id,),
        )
        budget_summary = []
        for budget in cursor.fetchall():
            cursor.execute(
                """
                SELECT COALESCE(SUM(amount), 0) AS spent
                FROM transactions
                WHERE user_id = %s AND category = %s
                  AND type = 'expense'
                  AND transaction_date >= CASE
                      WHEN %s = 'weekly'
                          THEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
                      WHEN %s = 'yearly'
                          THEN MAKEDATE(YEAR(CURDATE()), 1)
                      ELSE DATE_FORMAT(CURDATE(), '%Y-%m-01')
                  END
                """,
                (
                    user_id,
                    budget["category"],
                    budget["period"],
                    budget["period"],
                ),
            )
            spent = _decimal(cursor.fetchone()["spent"])
            amount = _decimal(budget["budget_amount"])
            budget_summary.append({
                "id": budget["id"],
                "category": budget["category"],
                "amount": float(amount),
                "budget_amount": float(amount),
                "period": budget["period"],
                "spent": float(spent),
                "remaining": float(amount - spent),
                "percentage_used": round(
                    float((spent / amount) * 100) if amount else 0,
                    2,
                ),
            })

        report_data["recent_transactions"] = recent_transactions
        report_data["budget_summary"] = budget_summary
        return True, "Dashboard data retrieved successfully", report_data, 200
    except Error:
        return False, "Unable to retrieve dashboard data", {}, 500
    finally:
        close_db_connection(connection, cursor)
