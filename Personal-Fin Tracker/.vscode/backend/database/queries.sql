-- Personal Finance Tracker parameterized query catalog
-- Run USE personal_finance_tracker; before testing these statements.
-- In Flask/MySQL Connector, keep %s placeholders and pass values separately.

USE personal_finance_tracker;

-- 1. Register user
INSERT INTO users (name, email, password)
VALUES (%s, %s, %s);

-- 2. Find user by email
SELECT id, name, email, password, created_at
FROM users
WHERE email = %s;

-- 3. Get user by ID
SELECT id, name, email, created_at
FROM users
WHERE id = %s;

-- 4. Add transaction
INSERT INTO transactions
    (user_id, title, category, amount, transaction_date, type, description)
VALUES (%s, %s, %s, %s, %s, %s, %s);

-- 5. Get all transactions for one user
SELECT id, user_id, title, category, amount,
       transaction_date, type, description, created_at
FROM transactions
WHERE user_id = %s
ORDER BY transaction_date DESC, id DESC;

-- 6. Get transaction by transaction ID and user ID
SELECT id, user_id, title, category, amount,
       transaction_date, type, description, created_at
FROM transactions
WHERE id = %s AND user_id = %s;

-- 7. Update transaction
UPDATE transactions
SET title = %s,
    category = %s,
    amount = %s,
    transaction_date = %s,
    type = %s,
    description = %s
WHERE id = %s AND user_id = %s;

-- 8. Delete transaction
DELETE FROM transactions
WHERE id = %s AND user_id = %s;

-- 9. Search transactions by title or description
SELECT id, title, category, amount, transaction_date, type, description
FROM transactions
WHERE user_id = %s
  AND (title LIKE %s OR description LIKE %s)
ORDER BY transaction_date DESC, id DESC;
-- Parameters: user_id, CONCAT('%', search_text, '%'), CONCAT('%', search_text, '%')

-- 10. Filter transactions by type
SELECT id, title, category, amount, transaction_date, type, description
FROM transactions
WHERE user_id = %s AND type = %s
ORDER BY transaction_date DESC, id DESC;

-- 11. Filter transactions by category
SELECT id, title, category, amount, transaction_date, type, description
FROM transactions
WHERE user_id = %s AND category = %s
ORDER BY transaction_date DESC, id DESC;

-- 12. Filter transactions by date range
SELECT id, title, category, amount, transaction_date, type, description
FROM transactions
WHERE user_id = %s
  AND transaction_date BETWEEN %s AND %s
ORDER BY transaction_date DESC, id DESC;

-- 13. Calculate total income
SELECT COALESCE(SUM(amount), 0) AS total_income
FROM transactions
WHERE user_id = %s AND type = 'income';

-- 14. Calculate total expenses
SELECT COALESCE(SUM(amount), 0) AS total_expenses
FROM transactions
WHERE user_id = %s AND type = 'expense';

-- 15. Calculate balance
SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)
           AS balance
FROM transactions
WHERE user_id = %s;

-- 16. Calculate savings
SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)
           AS savings
FROM transactions
WHERE user_id = %s;

-- 17. Calculate savings percentage
SELECT ROUND(
    CASE
        WHEN COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) = 0
            THEN 0
        ELSE (
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)
            / SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END)
        ) * 100
    END,
    2
) AS savings_percentage
FROM transactions
WHERE user_id = %s;

-- 18. Get recent transactions
SELECT id, title, category, amount, transaction_date, type, description
FROM transactions
WHERE user_id = %s
ORDER BY transaction_date DESC, id DESC
LIMIT %s;

-- 19. Get expenses grouped by category
SELECT category, SUM(amount) AS total_expenses
FROM transactions
WHERE user_id = %s AND type = 'expense'
GROUP BY category
ORDER BY total_expenses DESC;

-- 20. Get income grouped by month
SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month,
       SUM(amount) AS total_income
FROM transactions
WHERE user_id = %s AND type = 'income'
GROUP BY month
ORDER BY month ASC;

-- 21. Get expenses grouped by month
SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month,
       SUM(amount) AS total_expenses
FROM transactions
WHERE user_id = %s AND type = 'expense'
GROUP BY month
ORDER BY month ASC;

-- 22. Get income versus expense
SELECT type, SUM(amount) AS total_amount
FROM transactions
WHERE user_id = %s
GROUP BY type;

-- 23. Add budget
INSERT INTO budgets (user_id, category, budget_amount, period)
VALUES (%s, %s, %s, %s);

-- 24. Get user budgets
SELECT id, user_id, category, budget_amount, period, created_at
FROM budgets
WHERE user_id = %s
ORDER BY created_at DESC, id DESC;

-- 25. Update budget
UPDATE budgets
SET category = %s,
    budget_amount = %s,
    period = %s
WHERE id = %s AND user_id = %s;

-- 26. Delete budget
DELETE FROM budgets
WHERE id = %s AND user_id = %s;

-- 27. Calculate budget spending for one category and date range
SELECT COALESCE(SUM(amount), 0) AS spent
FROM transactions
WHERE user_id = %s
  AND category = %s
  AND type = 'expense'
  AND transaction_date BETWEEN %s AND %s;

-- 28. Calculate remaining budget
SELECT b.id, b.category, b.budget_amount,
       COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
           AS spent,
       b.budget_amount - COALESCE(SUM(
           CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END
       ), 0) AS remaining
FROM budgets AS b
LEFT JOIN transactions AS t
    ON t.user_id = b.user_id
   AND t.category = b.category
   AND t.transaction_date BETWEEN %s AND %s
WHERE b.user_id = %s
GROUP BY b.id, b.category, b.budget_amount;

-- 29. Calculate budget percentage used
SELECT b.id, b.category, b.budget_amount,
       ROUND(
           COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
           / NULLIF(b.budget_amount, 0) * 100,
           2
       ) AS percentage_used
FROM budgets AS b
LEFT JOIN transactions AS t
    ON t.user_id = b.user_id
   AND t.category = b.category
   AND t.transaction_date BETWEEN %s AND %s
WHERE b.user_id = %s
GROUP BY b.id, b.category, b.budget_amount;

-- 30. Find exceeded budgets
SELECT b.id, b.category, b.budget_amount,
       COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
           AS spent
FROM budgets AS b
LEFT JOIN transactions AS t
    ON t.user_id = b.user_id
   AND t.category = b.category
   AND t.transaction_date BETWEEN %s AND %s
WHERE b.user_id = %s
GROUP BY b.id, b.category, b.budget_amount
HAVING spent > b.budget_amount;

-- 31. Find budgets close to their limit (80% or more, but not exceeded)
SELECT b.id, b.category, b.budget_amount,
       COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0)
           AS spent
FROM budgets AS b
LEFT JOIN transactions AS t
    ON t.user_id = b.user_id
   AND t.category = b.category
   AND t.transaction_date BETWEEN %s AND %s
WHERE b.user_id = %s
GROUP BY b.id, b.category, b.budget_amount
HAVING spent >= b.budget_amount * 0.80
   AND spent <= b.budget_amount;

-- 32. Generate dashboard summary
SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)
        AS total_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
        AS total_expenses,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)
        AS balance,
    COUNT(*) AS transaction_count
FROM transactions
WHERE user_id = %s;

-- Dashboard recent transactions
SELECT id, title, category, amount, transaction_date,
       type, description, created_at
FROM transactions
WHERE user_id = %s
ORDER BY transaction_date DESC, id DESC
LIMIT 5;

-- Dashboard budget summary
SELECT id, category, budget_amount, period
FROM budgets
WHERE user_id = %s
ORDER BY id DESC;
