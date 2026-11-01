from decimal import Decimal

from utils.helpers import (
    close_db_connection,
    get_db_connection,
    serialize_row,
    serialize_rows,
)
from utils.validators import validate_transaction_data

try:
    from mysql.connector import Error
except ModuleNotFoundError:
    class Error(Exception):
        pass


TRANSACTION_FIELDS = {
    "title",
    "category",
    "amount",
    "transaction_date",
    "type",
    "description",
}


def _normalize_transaction_data(data):
    normalized_data = dict(data)

    if "transaction_date" not in normalized_data and "date" in normalized_data:
        normalized_data["transaction_date"] = normalized_data.pop("date")

    return normalized_data


def _format_transaction(row):
    transaction = serialize_row(row)

    if transaction is not None and "transaction_date" in transaction:
        transaction["date"] = transaction["transaction_date"]

    return transaction


def _get_transaction(cursor, transaction_id, user_id):
    cursor.execute(
        """
         SELECT transactions.id, transactions.user_id, users.name AS person_name,
             transactions.title, transactions.category, transactions.amount,
             transactions.transaction_date, transactions.type,
             transactions.description, transactions.created_at
         FROM transactions
         INNER JOIN users ON users.id = transactions.user_id
        WHERE transactions.id = %s AND transactions.user_id = %s
        """,
        (transaction_id, user_id),
    )
    return cursor.fetchone()


def create_transaction(user_id, data):
    if not isinstance(data, dict):
        return False, "Transaction data must be a JSON object", {}, 400

    transaction_data = _normalize_transaction_data(data)
    unknown_fields = set(transaction_data) - TRANSACTION_FIELDS

    if unknown_fields:
        return False, "Invalid transaction fields", {
            "fields": sorted(unknown_fields),
        }, 400

    is_valid, errors = validate_transaction_data(transaction_data)
    if not is_valid:
        return False, "Invalid transaction data", errors, 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            INSERT INTO transactions
                (user_id, title, category, amount,
                 transaction_date, type, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                transaction_data["title"].strip(),
                transaction_data["category"],
                Decimal(str(transaction_data["amount"])),
                transaction_data["transaction_date"],
                transaction_data["type"],
                transaction_data.get("description"),
            ),
        )
        transaction_id = cursor.lastrowid
        connection.commit()

        transaction = _get_transaction(cursor, transaction_id, user_id)
        return True, "Transaction added successfully", {
            "transaction": _format_transaction(transaction),
        }, 201
    except Error:
        if connection is not None:
            connection.rollback()
        return False, "Unable to add transaction", {}, 500
    finally:
        close_db_connection(connection, cursor)


def get_transactions(user_id, filters=None):
    filters = filters or {}
    conditions = ["transactions.user_id = %s"]
    values = [user_id]

    search = filters.get("search", "").strip()
    if search:
        conditions.append("(title LIKE %s OR description LIKE %s)")
        search_value = f"%{search}%"
        values.extend([search_value, search_value])

    transaction_type = filters.get("type")
    if transaction_type:
        conditions.append("type = %s")
        values.append(transaction_type)

    category = filters.get("category")
    if category:
        conditions.append("category = %s")
        values.append(category)

    start_date = filters.get("start_date") or filters.get("date_from")
    if start_date:
        conditions.append("transaction_date >= %s")
        values.append(start_date)

    end_date = filters.get("end_date") or filters.get("date_to")
    if end_date:
        conditions.append("transaction_date <= %s")
        values.append(end_date)

    query = f"""
         SELECT transactions.id, transactions.user_id, users.name AS person_name,
             transactions.title, transactions.category, transactions.amount,
             transactions.transaction_date, transactions.type,
             transactions.description, transactions.created_at
         FROM transactions
         INNER JOIN users ON users.id = transactions.user_id
        WHERE {' AND '.join(conditions)}
        ORDER BY transaction_date DESC, id DESC
    """

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(values))
        transactions = cursor.fetchall()

        return True, "Transactions retrieved successfully", {
            "transactions": [
                _format_transaction(row) for row in transactions
            ],
            "count": len(transactions),
        }, 200
    except Error:
        return False, "Unable to retrieve transactions", {}, 500
    finally:
        close_db_connection(connection, cursor)


def get_transaction_by_id(user_id, transaction_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        transaction = _get_transaction(cursor, transaction_id, user_id)

        if transaction is None:
            return False, "Transaction not found", {}, 404

        return True, "Transaction retrieved successfully", {
            "transaction": _format_transaction(transaction),
        }, 200
    except Error:
        return False, "Unable to retrieve transaction", {}, 500
    finally:
        close_db_connection(connection, cursor)


def update_transaction(user_id, transaction_id, data):
    if not isinstance(data, dict):
        return False, "Transaction data must be a JSON object", {}, 400

    transaction_data = _normalize_transaction_data(data)
    unknown_fields = set(transaction_data) - TRANSACTION_FIELDS

    if unknown_fields:
        return False, "Invalid transaction fields", {
            "fields": sorted(unknown_fields),
        }, 400

    if not transaction_data:
        return False, "At least one field is required", {}, 400

    is_valid, errors = validate_transaction_data(
        transaction_data,
        partial=True,
    )
    if not is_valid:
        return False, "Invalid transaction data", errors, 400

    fields = []
    values = []

    for field in TRANSACTION_FIELDS:
        if field not in transaction_data:
            continue

        fields.append(f"{field} = %s")
        value = transaction_data[field]

        if field == "title":
            value = value.strip()
        elif field == "amount":
            value = Decimal(str(value))

        values.append(value)

    values.extend([transaction_id, user_id])
    query = f"""
        UPDATE transactions
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
            return False, "Transaction not found", {}, 404

        connection.commit()
        transaction = _get_transaction(cursor, transaction_id, user_id)

        return True, "Transaction updated successfully", {
            "transaction": _format_transaction(transaction),
        }, 200
    except Error:
        if connection is not None:
            connection.rollback()
        return False, "Unable to update transaction", {}, 500
    finally:
        close_db_connection(connection, cursor)


def delete_transaction(user_id, transaction_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            DELETE FROM transactions
            WHERE id = %s AND user_id = %s
            """,
            (transaction_id, user_id),
        )

        if cursor.rowcount == 0:
            connection.rollback()
            return False, "Transaction not found", {}, 404

        connection.commit()
        return True, "Transaction deleted successfully", {}, 200
    except Error:
        if connection is not None:
            connection.rollback()
        return False, "Unable to delete transaction", {}, 500
    finally:
        close_db_connection(connection, cursor)
