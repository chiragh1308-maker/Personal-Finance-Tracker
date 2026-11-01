-- Personal Finance Tracker demo data
-- Password values are Werkzeug-compatible scrypt hashes,
-- not plain-text passwords. Demo password for both users: Demo@123

USE personal_finance_tracker;

INSERT INTO users (name, email, password)
VALUES
    (
        'Demo User',
        'demo@example.com',
        'scrypt:32768:8:1$VKXyV39YWY9mSbQY$fbbb23c086b956d27a89cc1b64b7c5874114c7c4f488fbb7af55273ab280f2e580995b44243148790eefec5d1b0b1d41540ab6e983ac39d30d239a38b01e0e92'
    ),
    (
        'Aarav Sharma',
        'aarav@example.com',
        'scrypt:32768:8:1$VKXyV39YWY9mSbQY$fbbb23c086b956d27a89cc1b64b7c5874114c7c4f488fbb7af55273ab280f2e580995b44243148790eefec5d1b0b1d41540ab6e983ac39d30d239a38b01e0e92'
    )
ON DUPLICATE KEY UPDATE
    name = VALUES(name);

SET @demo_user_id = (
    SELECT id FROM users WHERE email = 'demo@example.com'
);

SET @aarav_user_id = (
    SELECT id FROM users WHERE email = 'aarav@example.com'
);

INSERT INTO transactions
    (user_id, title, category, amount, transaction_date, type, description)
VALUES
    (@demo_user_id, 'Monthly Salary', 'Salary', 40000.00, '2026-09-01', 'income', 'September salary'),
    (@demo_user_id, 'Freelance Work', 'Freelance', 3500.00, '2026-09-05', 'income', 'College design project'),
    (@demo_user_id, 'Groceries', 'Food', 2850.00, '2026-09-03', 'expense', 'Weekly groceries'),
    (@demo_user_id, 'Petrol', 'Transport', 1200.00, '2026-09-04', 'expense', 'Fuel for commuting'),
    (@demo_user_id, 'College Fees', 'Education', 5000.00, '2026-09-06', 'expense', 'Semester payment'),
    (@demo_user_id, 'Online Shopping', 'Shopping', 1800.00, '2026-09-07', 'expense', 'Personal items'),
    (@demo_user_id, 'Electricity Bill', 'Bills', 1450.00, '2026-09-02', 'expense', 'Monthly electricity bill'),
    (@demo_user_id, 'Movie Night', 'Entertainment', 850.00, '2026-09-08', 'expense', 'Weekend movie and snacks'),
    (@aarav_user_id, 'Monthly Salary', 'Salary', 52000.00, '2026-09-01', 'income', 'September salary'),
    (@aarav_user_id, 'Lunch', 'Food', 650.00, '2026-09-03', 'expense', 'Lunch with friends'),
    (@demo_user_id, 'Annual Bonus', 'Salary', 18000.00, '2025-03-12', 'income', 'Year-end performance bonus'),
    (@demo_user_id, 'Festival Shopping', 'Shopping', 4200.00, '2025-10-28', 'expense', 'Diwali gifts and clothes'),
    (@demo_user_id, 'Health Insurance', 'Bills', 2200.00, '2024-11-30', 'expense', 'Annual premium payment'),
    (@demo_user_id, 'Rent Deposit', 'Housing', 9000.00, '2024-02-10', 'expense', 'Apartment security deposit'),
    (@demo_user_id, 'App Design Project', 'Freelance', 6200.00, '2025-06-14', 'income', 'Client website redesign'),
    (@demo_user_id, 'Train Ticket', 'Transport', 1800.00, '2025-09-17', 'expense', 'Weekend trip booking'),
    (@demo_user_id, 'Holiday Gifts', 'Shopping', 3900.00, '2024-12-25', 'expense', 'Family holiday presents'),
    (@aarav_user_id, 'Performance Bonus', 'Salary', 15000.00, '2026-01-15', 'income', 'January bonus payout'),
    (@aarav_user_id, 'Car Maintenance', 'Transport', 2600.00, '2026-04-18', 'expense', 'Service and tyre replacement'),
    (@aarav_user_id, 'Family Support', 'Bills', 5000.00, '2024-08-22', 'expense', 'Financial support for parents');

INSERT INTO budgets (user_id, category, budget_amount, period)
VALUES
    (@demo_user_id, 'Food', 5000.00, 'monthly'),
    (@demo_user_id, 'Transport', 3000.00, 'monthly'),
    (@demo_user_id, 'Shopping', 4000.00, 'monthly'),
    (@demo_user_id, 'Entertainment', 2500.00, 'monthly'),
    (@demo_user_id, 'Bills', 3000.00, 'monthly'),
    (@aarav_user_id, 'Food', 6000.00, 'monthly'),
    (@aarav_user_id, 'Transport', 4000.00, 'monthly');
