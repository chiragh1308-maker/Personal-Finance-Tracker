 /* =========================================================
    REPORTS JAVASCRIPT
    Personal Finance Tracker
    File: frontend/js/reports.js
    ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    if (typeof checkLogin === "function") {
        checkLogin();
    }

    initializeReportsPage();
});


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let reportTransactions = [];

let expenseCategoryChart = null;
let monthlyComparisonChart = null;
let incomeExpenseChart = null;


/* =========================================================
   INITIALIZE REPORTS PAGE
   ========================================================= */

async function initializeReportsPage() {

    await loadReportTransactions();

    initializeReportFilters();

    generateReport();
}


/* =========================================================
   LOAD TRANSACTIONS
   ========================================================= */

async function loadReportTransactions() {

    try {

        const params = new URLSearchParams();
        const periodFilter = document.querySelector("#reportPeriod");
        const startDate = document.querySelector("#reportStartDate");
        const endDate = document.querySelector("#reportEndDate");

        if (periodFilter && periodFilter.value && periodFilter.value !== "custom") {
            const computed = getDateRangeFromPeriod(periodFilter.value);
            if (computed.start) {
                params.set("start_date", computed.start);
            }
            if (computed.end) {
                params.set("end_date", computed.end);
            }
        }

        if (startDate && startDate.value) {
            params.set("start_date", startDate.value);
        }

        if (endDate && endDate.value) {
            params.set("end_date", endDate.value);
        }

        const query = params.toString();
        const response = await apiRequest(`/api/transactions${query ? `?${query}` : ""}`);

        const transactions = Array.isArray(response && response.data && response.data.transactions)
            ? response.data.transactions
            : [];

        if (transactions.length > 0) {
            reportTransactions = transactions.map(function (transaction) {
                return {
                    ...transaction,
                    person: transaction.person_name || transaction.name || transaction.person || "Unknown",
                    date: transaction.transaction_date || transaction.date,
                    amount: Number(transaction.amount) || 0,
                    type: transaction.type || "expense"
                };
            });
            saveToStorage("transactions", reportTransactions);
            return;
        }

    } catch (error) {
        console.warn("Reports API unavailable; falling back to local data.", error);
    }

    const savedTransactions =
        getFromStorage("transactions");


    if (
        savedTransactions &&
        Array.isArray(savedTransactions)
    ) {

        const currentUser =
            typeof getCurrentUser === "function"
                ? getCurrentUser()
                : null;

        reportTransactions = savedTransactions.map(function (transaction) {
            return {
                ...transaction,
                person: transaction.person_name || transaction.person || transaction.name ||
                    (currentUser && currentUser.name) || "Demo User",
                date: transaction.transaction_date || transaction.date,
                amount: Number(transaction.amount) || 0
            };
        });

    }
    else {

        reportTransactions =
            getDemoReportTransactions();

        saveToStorage(
            "transactions",
            reportTransactions
        );

    }
}


/* =========================================================
   DEMO DATA
   ========================================================= */

function getDemoReportTransactions() {

    return [

        {
            id: 1,
            person: "Demo User",
            title: "Monthly Salary",
            category: "Salary",
            type: "income",
            amount: 40000,
            date: "2026-09-01"
        },

        {
            id: 2,
            person: "Demo User",
            title: "Freelance Work",
            category: "Freelance",
            type: "income",
            amount: 3500,
            date: "2026-09-05"
        },

        {
            id: 3,
            person: "Demo User",
            title: "Groceries",
            category: "Food",
            type: "expense",
            amount: 2850,
            date: "2026-09-03"
        },

        {
            id: 4,
            person: "Demo User",
            title: "Petrol",
            category: "Transport",
            type: "expense",
            amount: 1200,
            date: "2026-09-04"
        },

        {
            id: 5,
            person: "Demo User",
            title: "College Fees",
            category: "Education",
            type: "expense",
            amount: 5000,
            date: "2026-09-06"
        },

        {
            id: 6,
            person: "Demo User",
            title: "Online Shopping",
            category: "Shopping",
            type: "expense",
            amount: 1800,
            date: "2026-09-07"
        },

        {
            id: 7,
            person: "Demo User",
            title: "Electricity Bill",
            category: "Bills",
            type: "expense",
            amount: 1450,
            date: "2026-09-02"
        },

        {
            id: 8,
            person: "Demo User",
            title: "Movie Night",
            category: "Entertainment",
            type: "expense",
            amount: 850,
            date: "2026-09-08"
        },

        {
            id: 9,
            person: "Aarav Sharma",
            title: "Monthly Salary",
            category: "Salary",
            type: "income",
            amount: 52000,
            date: "2026-09-01"
        },

        {
            id: 10,
            person: "Aarav Sharma",
            title: "Lunch",
            category: "Food",
            type: "expense",
            amount: 650,
            date: "2026-09-03"
        }

    ];
}


/* =========================================================
   GENERATE REPORT
   ========================================================= */

function generateReport() {

    const filteredTransactions =
        getFilteredTransactions();


    destroyReportCharts();


    updateReportSummary(
        filteredTransactions
    );


    createExpenseCategoryChart(
        filteredTransactions
    );


    createIncomeExpenseChart(
        filteredTransactions
    );


    createMonthlyComparisonChart(
        filteredTransactions
    );


    displayCategoryAnalysis(
        filteredTransactions
    );


    displayReportInsights(
        filteredTransactions
    );


    displayReportTable(
        filteredTransactions
    );
}


function destroyReportCharts() {

    if (expenseCategoryChart) {
        expenseCategoryChart.destroy();
        expenseCategoryChart = null;
    }

    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
        incomeExpenseChart = null;
    }

    if (monthlyComparisonChart) {
        monthlyComparisonChart.destroy();
        monthlyComparisonChart = null;
    }
}


/* =========================================================
   FILTER INITIALIZATION
   ========================================================= */

function initializeReportFilters() {

    const periodFilter =
        document.querySelector(
            "#reportPeriod"
        );


    const startDate =
        document.querySelector(
            "#reportStartDate"
        );


    const endDate =
        document.querySelector(
            "#reportEndDate"
        );


    if (periodFilter) {

        periodFilter.addEventListener(
            "change",
            function () {

                updateDateInputs();

                generateReport();

            }
        );

    }


    if (startDate) {

        startDate.addEventListener(
            "change",
            generateReport
        );

    }


    if (endDate) {

        endDate.addEventListener(
            "change",
            generateReport
        );

    }


    const generateButton =
        document.querySelector(
            "#generateReport"
        );


    if (generateButton) {

        generateButton.addEventListener(
            "click",
            generateReport
        );

    }
}


/* =========================================================
   UPDATE DATE INPUTS
   ========================================================= */

function getDateRangeFromPeriod(period) {

    const today = new Date();
    const end = formatDateForInput(today);

    if (period === "week") {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        return {
            start: formatDateForInput(startDate),
            end: end
        };
    }

    if (period === "month") {
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
            start: formatDateForInput(startDate),
            end: end
        };
    }

    if (period === "3months") {
        const startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        return {
            start: formatDateForInput(startDate),
            end: end
        };
    }

    if (period === "year") {
        const startDate = new Date(today.getFullYear(), 0, 1);
        return {
            start: formatDateForInput(startDate),
            end: end
        };
    }

    return {
        start: "",
        end: end
    };
}

function updateDateInputs() {

    const periodFilter =
        document.querySelector(
            "#reportPeriod"
        );


    const startDate =
        document.querySelector(
            "#reportStartDate"
        );


    const endDate =
        document.querySelector(
            "#reportEndDate"
        );


    if (
        !periodFilter ||
        !startDate ||
        !endDate
    ) {

        return;

    }


    if (periodFilter.value === "custom") {
        return;
    }

    const range = getDateRangeFromPeriod(periodFilter.value);
    startDate.value = range.start;
    endDate.value = range.end;
}


/* =========================================================
   GET FILTERED TRANSACTIONS
   ========================================================= */

function getFilteredTransactions() {

    const periodFilter =
        document.querySelector(
            "#reportPeriod"
        );


    const startDateInput =
        document.querySelector(
            "#reportStartDate"
        );


    const endDateInput =
        document.querySelector(
            "#reportEndDate"
        );


    let transactions =
        [...reportTransactions];


    const period =
        periodFilter
            ? periodFilter.value
            : "month";


    const today =
        new Date();


    let startDate = null;
    let endDate = null;


    if (period === "custom") {

        if (
            startDateInput &&
            startDateInput.value
        ) {

            startDate =
                new Date(
                    startDateInput.value
                );

        }

        if (
            endDateInput &&
            endDateInput.value
        ) {

            endDate =
                new Date(
                    endDateInput.value
                );

            endDate.setHours(
                23,
                59,
                59,
                999
            );

        }

    }
    else {

        if (
            startDateInput &&
            startDateInput.value
        ) {

            startDate =
                new Date(
                    startDateInput.value
                );

        }


        if (
            endDateInput &&
            endDateInput.value
        ) {

            endDate =
                new Date(
                    endDateInput.value
                );

            endDate.setHours(
                23,
                59,
                59,
                999
            );

        }

    }


    if (!startDate) {

        startDate =
            new Date(today);


        if (period === "week") {

            startDate.setDate(
                today.getDate() - 7
            );

        }

        else if (period === "month") {

            startDate =
                new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    1
                );

        }

        else if (period === "3months") {

            startDate.setMonth(
                today.getMonth() - 3
            );

        }

        else if (period === "year") {

            startDate =
                new Date(
                    today.getFullYear(),
                    0,
                    1
                );

        }

    }


    if (!endDate) {
        endDate = today;
    }


    transactions =
        transactions.filter(
            function (transaction) {

                if (!transaction.date) {
                    return false;
                }


                const date =
                    new Date(
                        transaction.date
                    );


                return (
                    date >= startDate &&
                    date <= endDate
                );

            }
        );


    return transactions;
}


/* =========================================================
   REPORT SUMMARY
   ========================================================= */

function updateReportSummary(
    transactions
) {

    let income = 0;
    let expense = 0;


    transactions.forEach(
        function (transaction) {

            const amount =
                Number(transaction.amount) || 0;


            if (
                transaction.type === "income"
            ) {

                income += amount;

            }

            else if (
                transaction.type === "expense"
            ) {

                expense += amount;

            }

        }
    );


    const balance =
        income - expense;


    const savingsRate =
        income > 0
            ? (balance / income) * 100
            : 0;


    updateReportElement(
        "#reportIncome",
        formatCurrency(income)
    );


    updateReportElement(
        "#reportExpense",
        formatCurrency(expense)
    );


    updateReportElement(
        "#reportBalance",
        formatCurrency(balance)
    );


    updateReportElement(
        "#reportSavings",
        savingsRate.toFixed(1) + "%"
    );


    updateReportElement(
        "#reportTransactionCount",
        transactions.length
    );
}


/* =========================================================
   EXPENSE CATEGORY CHART
   ========================================================= */

function createExpenseCategoryChart(
    transactions
) {

    const canvas =
        document.querySelector(
            "#expenseCategoryChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {

        return;

    }


    const categoryTotals = {};


    transactions
        .filter(
            function (transaction) {

                return (
                    transaction.type ===
                    "expense"
                );

            }
        )
        .forEach(
            function (transaction) {

                const category =
                    transaction.category ||
                    "Other";


                const amount =
                    Number(
                        transaction.amount
                    ) || 0;


                if (
                    !categoryTotals[category]
                ) {

                    categoryTotals[category] =
                        0;

                }


                categoryTotals[category] +=
                    amount;

            }
        );


    const labels =
        Object.keys(categoryTotals);


    const data =
        Object.values(categoryTotals);


    if (expenseCategoryChart) {

        expenseCategoryChart.destroy();

    }


    expenseCategoryChart =
        new Chart(
            canvas,
            {

                type: "doughnut",

                data: {

                    labels: labels,

                    datasets: [
                        {
                            data: data
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            position: "bottom"
                        }

                    }

                }

            }
        );
}


/* =========================================================
   INCOME VS EXPENSE CHART
   ========================================================= */

function createIncomeExpenseChart(
    transactions
) {

    const canvas =
        document.querySelector(
            "#reportIncomeExpenseChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {

        return;

    }


    let income = 0;
    let expense = 0;


    transactions.forEach(
        function (transaction) {

            const amount =
                Number(transaction.amount) || 0;


            if (
                transaction.type === "income"
            ) {

                income += amount;

            }

            else if (
                transaction.type === "expense"
            ) {

                expense += amount;

            }

        }
    );


    if (incomeExpenseChart) {

        incomeExpenseChart.destroy();

    }


    incomeExpenseChart =
        new Chart(
            canvas,
            {

                type: "bar",

                data: {

                    labels: [
                        "Income",
                        "Expense"
                    ],

                    datasets: [
                        {
                            label: "Amount",

                            data: [
                                income,
                                expense
                            ]
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {
                            beginAtZero: true
                        }

                    },

                    plugins: {

                        legend: {
                            display: false
                        }

                    }

                }

            }
        );
}


/* =========================================================
   MONTHLY COMPARISON CHART
   ========================================================= */

function createMonthlyComparisonChart(
    transactions
) {

    const canvas =
        document.querySelector(
            "#monthlyComparisonChart"
        );


    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {

        return;

    }


    const monthlyData = {};


    transactions.forEach(
        function (transaction) {

            if (!transaction.date) {
                return;
            }


            const date =
                new Date(
                    transaction.date
                );


            const key =
                date.toLocaleDateString(
                    "en-IN",
                    {
                        month: "short",
                        year: "numeric"
                    }
                );


            if (!monthlyData[key]) {

                monthlyData[key] = {
                    income: 0,
                    expense: 0
                };

            }


            const amount =
                Number(
                    transaction.amount
                ) || 0;


            if (
                transaction.type === "income"
            ) {

                monthlyData[key].income +=
                    amount;

            }

            else if (
                transaction.type === "expense"
            ) {

                monthlyData[key].expense +=
                    amount;

            }

        }
    );


    const labels =
        Object.keys(monthlyData);


    const incomeData =
        labels.map(
            function (month) {

                return monthlyData[
                    month
                ].income;

            }
        );


    const expenseData =
        labels.map(
            function (month) {

                return monthlyData[
                    month
                ].expense;

            }
        );


    if (monthlyComparisonChart) {

        monthlyComparisonChart.destroy();

    }


    monthlyComparisonChart =
        new Chart(
            canvas,
            {

                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {
                            label: "Income",

                            data: incomeData,

                            tension: 0.3
                        },

                        {
                            label: "Expense",

                            data: expenseData,

                            tension: 0.3
                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {
                            beginAtZero: true
                        }

                    }

                }

            }
        );
}


/* =========================================================
   CATEGORY ANALYSIS
   ========================================================= */

function displayCategoryAnalysis(
    transactions
) {

    const container =
        document.querySelector(
            "#categoryAnalysis"
        );


    if (!container) {
        return;
    }


    const categories = {};


    transactions
        .filter(
            function (transaction) {

                return (
                    transaction.type ===
                    "expense"
                );

            }
        )
        .forEach(
            function (transaction) {

                const category =
                    transaction.category ||
                    "Other";


                const amount =
                    Number(
                        transaction.amount
                    ) || 0;


                if (!categories[category]) {

                    categories[category] =
                        0;

                }


                categories[category] +=
                    amount;

            }
        );


    const sortedCategories =
        Object.entries(categories)
            .sort(
                function (a, b) {
                    return b[1] - a[1];
                }
            );


    container.innerHTML = "";


    if (
        sortedCategories.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <p>No expense data available.</p>
            </div>
        `;

        return;
    }


    const totalExpense =
        sortedCategories.reduce(
            function (total, item) {

                return total + item[1];

            },
            0
        );


    sortedCategories.forEach(
        function (item) {

            const category =
                item[0];

            const amount =
                item[1];


            const percentage =
                totalExpense > 0
                    ? (amount / totalExpense) *
                      100
                    : 0;


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "category-analysis-item";


            row.innerHTML = `

                <div class="category-analysis-header">

                    <span>
                        ${getReportCategoryIcon(
                            category
                        )}

                        ${escapeReportHTML(
                            category
                        )}
                    </span>

                    <strong>
                        ${formatCurrency(amount)}
                    </strong>

                </div>


                <div class="category-analysis-progress">

                    <div class="progress-bar">

                        <div
                            class="progress-fill"
                            style="width: ${percentage}%;">
                        </div>

                    </div>

                    <span>
                        ${percentage.toFixed(1)}%
                    </span>

                </div>

            `;


            container.appendChild(row);

        }
    );
}


/* =========================================================
   REPORT INSIGHTS
   ========================================================= */

function displayReportInsights(
    transactions
) {

    const container =
        document.querySelector(
            "#reportInsights"
        );


    if (!container) {
        return;
    }


    let income = 0;
    let expense = 0;


    const categoryTotals = {};


    transactions.forEach(
        function (transaction) {

            const amount =
                Number(
                    transaction.amount
                ) || 0;


            if (
                transaction.type ===
                "income"
            ) {

                income += amount;

            }


            if (
                transaction.type ===
                "expense"
            ) {

                expense += amount;


                const category =
                    transaction.category ||
                    "Other";


                if (
                    !categoryTotals[category]
                ) {

                    categoryTotals[category] =
                        0;

                }


                categoryTotals[category] +=
                    amount;

            }

        }
    );


    const balance =
        income - expense;


    let highestCategory =
        "None";


    let highestAmount = 0;


    Object.keys(categoryTotals)
        .forEach(
            function (category) {

                if (
                    categoryTotals[category] >
                    highestAmount
                ) {

                    highestAmount =
                        categoryTotals[
                            category
                        ];

                    highestCategory =
                        category;

                }

            }
        );


    const savingsRate =
        income > 0
            ? (balance / income) * 100
            : 0;


    let advice = "";


    if (income === 0) {

        advice =
            "Add your income transactions to get personalized financial insights.";

    }

    else if (expense > income) {

        advice =
            "Your expenses are higher than your income. Consider reducing unnecessary spending.";

    }

    else if (savingsRate >= 30) {

        advice =
            "Excellent! You are maintaining a healthy savings rate.";

    }

    else if (savingsRate >= 15) {

        advice =
            "Good progress. Try to increase your savings gradually.";

    }

    else {

        advice =
            "Your savings rate is low. Review your largest expense categories.";

    }


    container.innerHTML = `

        <div class="insight-item">

            <span class="insight-icon">
                💰
            </span>

            <div>
                <strong>
                    Savings Rate
                </strong>

                <p>
                    ${savingsRate.toFixed(1)}%
                    of your income is remaining.
                </p>
            </div>

        </div>


        <div class="insight-item">

            <span class="insight-icon">
                📊
            </span>

            <div>
                <strong>
                    Highest Spending
                </strong>

                <p>
                    ${escapeReportHTML(
                        highestCategory
                    )}
                    -
                    ${formatCurrency(
                        highestAmount
                    )}
                </p>
            </div>

        </div>


        <div class="insight-item">

            <span class="insight-icon">
                💡
            </span>

            <div>
                <strong>
                    Recommendation
                </strong>

                <p>
                    ${escapeReportHTML(
                        advice
                    )}
                </p>
            </div>

        </div>

    `;
}


/* =========================================================
   REPORT TABLE
   ========================================================= */

function displayReportTable(
    transactions
) {

    const tableBody =
        document.querySelector(
            "#reportTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    const sorted =
        [...transactions].sort(
            function (a, b) {

                return (
                    new Date(b.date) -
                    new Date(a.date)
                );

            }
        );


    if (sorted.length === 0) {

        tableBody.innerHTML = `

            <tr>

                <td colspan="6">

                    <div class="empty-state">

                        <p>
                            No report data available.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;
    }


    sorted.forEach(
        function (transaction) {

            const row =
                document.createElement(
                    "tr"
                );


            const amount =
                Number(
                    transaction.amount
                ) || 0;


            const isIncome =
                transaction.type ===
                "income";


            row.innerHTML = `

                <td>
                    ${escapeReportHTML(
                        transaction.person_name ||
                        transaction.person ||
                        transaction.name ||
                        "Unknown"
                    )}
                </td>

                <td>
                    ${formatReportDate(
                        transaction.date
                    )}
                </td>

                <td>
                    ${escapeReportHTML(
                        transaction.title ||
                        "Transaction"
                    )}
                </td>

                <td>
                    ${escapeReportHTML(
                        transaction.category ||
                        "Other"
                    )}
                </td>

                <td>
                    <span class="
                        transaction-type
                        ${isIncome
                            ? "income"
                            : "expense"}
                    ">
                        ${isIncome
                            ? "Income"
                            : "Expense"}
                    </span>
                </td>

                <td>
                    <strong class="
                        ${isIncome
                            ? "income-amount"
                            : "expense-amount"}
                    ">
                        ${isIncome ? "+" : "-"}
                        ${formatCurrency(
                            amount
                        )}
                    </strong>
                </td>

            `;


            tableBody.appendChild(row);

        }
    );
}


/* =========================================================
   EXPORT REPORT
   ========================================================= */

function exportReport() {

    const transactions =
        getFilteredTransactions();


    if (transactions.length === 0) {

        showMessage(
            "There is no report data to export.",
            "error"
        );

        return;
    }


    let csv =
        "Person,Date,Title,Category,Type,Amount\n";


    transactions.forEach(
        function (transaction) {

            csv +=
                `"${transaction.person_name || transaction.person || transaction.name || "Unknown"}",` +
                `"${transaction.date || ""}",` +
                `"${transaction.title || ""}",` +
                `"${transaction.category || ""}",` +
                `"${transaction.type || ""}",` +
                `"${transaction.amount || 0}"\n`;

        }
    );


    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "personal-finance-report.csv";


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    URL.revokeObjectURL(url);


    showMessage(
        "Report exported successfully.",
        "success"
    );
}


/* =========================================================
   PRINT REPORT
   ========================================================= */

function printReport() {

    window.print();

}


/* =========================================================
   CATEGORY ICON
   ========================================================= */

function getReportCategoryIcon(
    category
) {

    const icons = {

        "Food": "🍔",
        "Transport": "🚗",
        "Shopping": "🛍️",
        "Education": "📚",
        "Entertainment": "🎬",
        "Bills": "💡",
        "Health": "❤️",
        "Travel": "✈️",
        "Rent": "🏠",
        "Salary": "💰",
        "Freelance": "💼",
        "Investment": "📈",
        "Other": "📌"

    };


    return icons[category] || "📌";
}


/* =========================================================
   FORMAT DATE FOR INPUT
   ========================================================= */

function formatDateForInput(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;
}


/* =========================================================
   FORMAT REPORT DATE
   ========================================================= */

function formatReportDate(
    dateString
) {

    if (!dateString) {
        return "-";
    }


    const date =
        new Date(dateString);


    if (isNaN(date.getTime())) {
        return dateString;
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   UPDATE ELEMENT
   ========================================================= */

function updateReportElement(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );


    if (element) {
        element.textContent = value;
    }
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeReportHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

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
   REFRESH REPORT
   ========================================================= */

function refreshReports() {

    loadReportTransactions();

    generateReport();
}