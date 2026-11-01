/* =========================================================
   DASHBOARD JAVASCRIPT
   Personal Finance Tracker
   File: frontend/js/dashboard.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    if (typeof checkLogin === "function") {
        const hasDemoUser = !!getFromStorage("financeUser");
        if (!hasDemoUser) {
            checkLogin();
        }
    }

    loadUserDetails();
    loadDashboardData();
    initializeDashboardActions();
});


/* =========================================================
   LOAD USER DETAILS
   ========================================================= */

function loadUserDetails() {

    const user = getCurrentUser();

    if (!user) {
        return;
    }

    // User name
    const userNameElements =
        document.querySelectorAll(
            "#userName, #welcomeName, .user-name"
        );

    userNameElements.forEach(function (element) {
        element.textContent = user.name || "User";
    });


    // User email
    const userEmailElements =
        document.querySelectorAll(
            "#userEmail, .user-email"
        );

    userEmailElements.forEach(function (element) {
        element.textContent = user.email || "";
    });
}


/* =========================================================
   LOAD DASHBOARD DATA
   ========================================================= */

function loadDashboardData() {

    const transactions = getFromStorage("transactions");

    if (!transactions || transactions.length === 0) {
        const demoTransactions = buildDemoTransactions();
        saveToStorage("transactions", demoTransactions);
        loadDemoDashboardData(demoTransactions);
        return;
    }

    calculateDashboardSummary(transactions);
    displayRecentTransactions(transactions);
    createCategoryChart(transactions);
    createIncomeExpenseChart(transactions);
}


/* =========================================================
   DEMO DASHBOARD DATA
   ========================================================= */

function buildDemoTransactions() {
    return [
        { id: 1, title: "Monthly Salary", category: "Salary", type: "income", amount: 32000, date: "2026-09-01" },
        { id: 2, title: "Freelance Project", category: "Freelance", type: "income", amount: 6500, date: "2026-09-06" },
        { id: 3, title: "Fuel refill", category: "Fuel", type: "expense", amount: 1800, date: "2026-09-02" },
        { id: 4, title: "Office commute", category: "Transport", type: "expense", amount: 1200, date: "2026-09-04" },
        { id: 5, title: "Groceries", category: "Food", type: "expense", amount: 2350, date: "2026-09-05" },
        { id: 6, title: "New clothes", category: "Clothing", type: "expense", amount: 2900, date: "2026-09-08" },
        { id: 7, title: "Electricity bill", category: "Bills", type: "expense", amount: 1600, date: "2026-09-09" },
        { id: 8, title: "Movie night", category: "Entertainment", type: "expense", amount: 950, date: "2026-09-10" },
        { id: 9, title: "Medicine", category: "Health", type: "expense", amount: 1200, date: "2026-09-11" },
        { id: 10, title: "Household items", category: "Shopping", type: "expense", amount: 1400, date: "2026-09-12" }
    ];
}

function loadDemoDashboardData(demoTransactions) {
    const transactions = demoTransactions || buildDemoTransactions();

    calculateDashboardSummary(transactions);
    displayRecentTransactions(transactions);
    createCategoryChart(transactions);
    createIncomeExpenseChart(transactions);
}


/* =========================================================
   CALCULATE SUMMARY
   ========================================================= */

function calculateDashboardSummary(transactions) {

    let totalIncome = 0;
    let totalExpense = 0;


    transactions.forEach(function (transaction) {

        const amount =
            Number(transaction.amount) || 0;


        if (
            transaction.type === "income"
        ) {

            totalIncome += amount;

        }
        else if (
            transaction.type === "expense"
        ) {

            totalExpense += amount;

        }

    });


    const balance =
        totalIncome - totalExpense;


    updateElement(
        "#totalIncome",
        formatCurrency(totalIncome)
    );

    updateElement(
        "#totalExpense",
        formatCurrency(totalExpense)
    );

    updateElement(
        "#totalBalance",
        formatCurrency(balance)
    );


    // Savings
    const savings =
        totalIncome > 0
            ? ((balance / totalIncome) * 100)
            : 0;


    updateElement(
        "#savingsRate",
        savings.toFixed(1) + "%"
    );


    // Update financial health
    updateFinancialHealth(
        totalIncome,
        totalExpense
    );
}


/* =========================================================
   UPDATE ELEMENT
   ========================================================= */

function updateElement(selector, value) {

    const element =
        document.querySelector(selector);

    if (element) {
        element.textContent = value;
    }
}


/* =========================================================
   RECENT TRANSACTIONS
   ========================================================= */

function displayRecentTransactions(transactions) {

    const container =
        document.querySelector(
            "#recentTransactions"
        );


    if (!container) {
        return;
    }


    // Sort newest first
    const sortedTransactions =
        [...transactions].sort(
            function (a, b) {
                return new Date(b.date) -
                       new Date(a.date);
            }
        );


    const recent =
        sortedTransactions.slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <p>No transactions available.</p>
            </div>
        `;

        return;
    }


    container.innerHTML = "";


    recent.forEach(function (transaction) {

        const item =
            document.createElement("div");

        item.className =
            "recent-transaction-item";


        const amount =
            Number(transaction.amount) || 0;


        const isIncome =
            transaction.type === "income";


        item.innerHTML = `

            <div class="transaction-info">

                <div class="transaction-icon">
                    ${getCategoryIcon(transaction.category)}
                </div>

                <div>
                    <h4>
                        ${escapeHTML(transaction.title || "Transaction")}
                    </h4>

                    <p>
                        ${escapeHTML(transaction.category || "Other")}
                    </p>
                </div>

            </div>


            <div class="transaction-right">

                <strong class="${isIncome ? "income-amount" : "expense-amount"}">

                    ${isIncome ? "+" : "-"}
                    ${formatCurrency(amount)}

                </strong>

                <small>
                    ${formatDate(transaction.date)}
                </small>

            </div>
        `;


        container.appendChild(item);

    });
}


/* =========================================================
   CATEGORY CHART
   ========================================================= */

function createCategoryChart(transactions) {

    const canvas = document.getElementById("categoryChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const categoryTotals = {};

    transactions
        .filter(function (transaction) {
            return transaction.type === "expense";
        })
        .forEach(function (transaction) {
            const category = transaction.category || "Other";
            const amount = Number(transaction.amount) || 0;

            if (!categoryTotals[category]) {
                categoryTotals[category] = 0;
            }

            categoryTotals[category] += amount;
        });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (window.categoryChartInstance) {
        window.categoryChartInstance.destroy();
    }

    window.categoryChartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Expense amount",
                data: data,
                borderColor: "#16805e",
                backgroundColor: "rgba(22, 128, 94, 0.12)",
                fill: true,
                tension: 0.35,
                pointRadius: 5,
                pointBackgroundColor: "#16805e",
                pointHoverRadius: 6,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return "₹" + Number(value).toLocaleString("en-IN");
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: "bottom"
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return "₹" + Number(context.parsed.y).toLocaleString("en-IN");
                        }
                    }
                }
            }
        }
    });
}


/* =========================================================
   INCOME VS EXPENSE CHART
   ========================================================= */

function createIncomeExpenseChart(transactions) {

    const canvas = document.getElementById("incomeExpenseChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const categoryMap = {};

    transactions.forEach(function (transaction) {
        if (transaction.type !== "expense") {
            return;
        }

        const category = transaction.category || "Other";
        const amount = Number(transaction.amount) || 0;

        if (!categoryMap[category]) {
            categoryMap[category] = 0;
        }

        categoryMap[category] += amount;
    });

    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);

    if (window.incomeExpenseChartInstance) {
        window.incomeExpenseChartInstance.destroy();
    }

    window.incomeExpenseChartInstance = new Chart(canvas, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Expense trend",
                data: data,
                borderColor: "#e78466",
                backgroundColor: "rgba(231, 132, 102, 0.12)",
                fill: true,
                tension: 0.35,
                pointRadius: 5,
                pointBackgroundColor: "#e78466",
                pointHoverRadius: 6,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return "₹" + Number(value).toLocaleString("en-IN");
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: "bottom"
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return "₹" + Number(context.parsed.y).toLocaleString("en-IN");
                        }
                    }
                }
            }
        }
    });
}


/* =========================================================
   FINANCIAL HEALTH
   ========================================================= */

function updateFinancialHealth(
    income,
    expense
) {

    const healthElement =
        document.querySelector(
            "#financialHealth"
        );


    if (!healthElement) {
        return;
    }


    if (income === 0) {

        healthElement.textContent =
            "No income data";

        return;
    }


    const ratio =
        expense / income;


    if (ratio < 0.5) {

        healthElement.textContent =
            "Excellent";

    }
    else if (ratio < 0.7) {

        healthElement.textContent =
            "Good";

    }
    else if (ratio < 0.9) {

        healthElement.textContent =
            "Needs Attention";

    }
    else {

        healthElement.textContent =
            "High Spending";

    }
}


/* =========================================================
   CATEGORY ICON
   ========================================================= */

function getCategoryIcon(category) {

    const icons = {

        "Food": "🍔",

        "Transport": "🚗",

        "Shopping": "🛍️",

        "Education": "📚",

        "Entertainment": "🎬",

        "Bills": "💡",

        "Health": "❤️",

        "Salary": "💰",

        "Freelance": "💼",

        "Investment": "📈",

        "Travel": "✈️",

        "Other": "📌"

    };


    return icons[category] || "📌";
}


/* =========================================================
   DASHBOARD QUICK ACTIONS
   ========================================================= */

function initializeDashboardActions() {

    const addTransactionButtons =
        document.querySelectorAll(
            ".add-transaction-btn, #addTransactionBtn"
        );


    addTransactionButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                window.location.href =
                    "add-transaction.html";

            }
        );

    });


    const viewTransactionsButtons =
        document.querySelectorAll(
            ".view-transactions-btn, #viewTransactionsBtn"
        );


    viewTransactionsButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                window.location.href =
                    "transaction.html";

            }
        );

    });


    const budgetButtons =
        document.querySelectorAll(
            ".budget-btn, #budgetBtn"
        );


    budgetButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                window.location.href =
                    "budget.html";

            }
        );

    });


    const reportButtons =
        document.querySelectorAll(
            ".reports-btn, #reportsBtn"
        );


    reportButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                window.location.href =
                    "reports.html";

            }
        );

    });

}


/* =========================================================
   ESCAPE HTML
   Prevents unwanted HTML injection
   ========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   REFRESH DASHBOARD
   ========================================================= */

function refreshDashboard() {

    loadDashboardData();

}


/* =========================================================
   EXPORT DASHBOARD DATA
   ========================================================= */

function getDashboardSummary() {

    const transactions =
        getFromStorage("transactions") || [];


    let income = 0;
    let expense = 0;


    transactions.forEach(function (transaction) {

        const amount =
            Number(transaction.amount) || 0;


        if (transaction.type === "income") {
            income += amount;
        }

        if (transaction.type === "expense") {
            expense += amount;
        }

    });


    return {

        income: income,

        expense: expense,

        balance: income - expense,

        savings:
            income > 0
                ? income - expense
                : 0

    };
}