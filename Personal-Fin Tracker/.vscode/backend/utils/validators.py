import re
from datetime import datetime
from decimal import Decimal, InvalidOperation


TRANSACTION_TYPES = {"income", "expense"}

TRANSACTION_CATEGORIES = {
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Education",
    "Health",
    "Salary",
    "Freelance",
    "Other",
}

BUDGET_PERIODS = {"weekly", "monthly", "yearly"}

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def is_valid_email(email):
    """Return True when email has a basic valid format."""
    return isinstance(email, str) and bool(EMAIL_PATTERN.fullmatch(email.strip()))


def validate_email(email):
    if not is_valid_email(email):
        return False, "Please provide a valid email address"
    return True, ""


def validate_password(password):
    if not isinstance(password, str):
        return False, "Password must be text"
    if len(password) < 6:
        return False, "Password must contain at least 6 characters"
    if len(password) > 128:
        return False, "Password must not exceed 128 characters"
    return True, ""


def validate_amount(amount):
    if isinstance(amount, bool) or amount is None:
        return False, "Amount must be a positive number"

    try:
        decimal_amount = Decimal(str(amount))
    except (InvalidOperation, ValueError):
        return False, "Amount must be a valid number"

    if not decimal_amount.is_finite() or decimal_amount <= 0:
        return False, "Amount must be greater than zero"

    if decimal_amount.as_tuple().exponent < -2:
        return False, "Amount cannot have more than two decimal places"

    return True, ""


def _validate_date(date_value):
    if not isinstance(date_value, str):
        return False
    try:
        datetime.strptime(date_value, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def _validate_title(title):
    return isinstance(title, str) and 1 <= len(title.strip()) <= 100


def validate_transaction_data(data, partial=False):
    """Validate transaction fields and return (is_valid, errors)."""
    if not isinstance(data, dict):
        return False, {"data": "Request data must be a JSON object"}

    errors = {}
    required_fields = [
        "title",
        "category",
        "amount",
        "transaction_date",
        "type",
    ]

    if not partial:
        for field in required_fields:
            if field not in data:
                errors[field] = "This field is required"

    if "title" in data and not _validate_title(data["title"]):
        errors["title"] = "Title must contain 1 to 100 characters"

    if "category" in data and data["category"] not in TRANSACTION_CATEGORIES:
        errors["category"] = "Invalid transaction category"

    if "amount" in data:
        amount_is_valid, amount_error = validate_amount(data["amount"])
        if not amount_is_valid:
            errors["amount"] = amount_error

    if "transaction_date" in data and not _validate_date(data["transaction_date"]):
        errors["transaction_date"] = "Date must use YYYY-MM-DD format"

    if "type" in data and data["type"] not in TRANSACTION_TYPES:
        errors["type"] = "Transaction type must be income or expense"

    if "description" in data:
        description = data["description"]
        if description is not None and (
            not isinstance(description, str) or len(description) > 500
        ):
            errors["description"] = "Description must not exceed 500 characters"

    return not errors, errors


def validate_budget_data(data, partial=False):
    """Validate budget fields and return (is_valid, errors)."""
    if not isinstance(data, dict):
        return False, {"data": "Request data must be a JSON object"}

    errors = {}
    required_fields = ["category", "budget_amount", "period"]

    if not partial:
        for field in required_fields:
            if field not in data:
                errors[field] = "This field is required"

    if "category" in data and data["category"] not in TRANSACTION_CATEGORIES:
        errors["category"] = "Invalid budget category"

    if "budget_amount" in data:
        amount_is_valid, amount_error = validate_amount(data["budget_amount"])
        if not amount_is_valid:
            errors["budget_amount"] = amount_error

    if "period" in data and data["period"] not in BUDGET_PERIODS:
        errors["period"] = "Budget period must be weekly, monthly, or yearly"

    return not errors, errors
