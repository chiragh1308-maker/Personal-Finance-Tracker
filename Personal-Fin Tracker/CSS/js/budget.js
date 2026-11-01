 /* =========================================================
    BUDGET JAVASCRIPT
    Personal Finance Tracker
    File: frontend/js/budget.js
    ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    if (typeof checkLogin === "function") {
        checkLogin();
    }

    initializeBudgetPage();
});


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let budgets = [];

const defaultCategories = [
    "Food",
    "Transport",
    "Shopping",
    "Education",
    "Entertainment",
    "Bills",
    "Health",
    "Travel",
    "Rent",
    "Other"
];


/* =========================================================
   INITIALIZE PAGE
   ========================================================= */

function initializeBudgetPage() {

    loadBudgets();

    createDefaultBudgetsIfNeeded();

    loadBudgetPage();

    initializeBudgetForm();

    initializeBudgetFilters();
}


/* =========================================================
   LOAD BUDGETS
   ========================================================= */

function loadBudgets() {

    const savedBudgets =
        getFromStorage("budgets");

    if (
        savedBudgets &&
        Array.isArray(savedBudgets)
    ) {

        budgets = savedBudgets;

    }
    else {

        budgets = [];

    }
}


/* =========================================================
   CREATE DEFAULT BUDGETS
   ========================================================= */

function createDefaultBudgetsIfNeeded() {

    if (budgets.length > 0) {
        return;
    }

    budgets = [

        {
            id: 1,
            category: "Food",
            amount: 4000,
            period: "monthly"
        },

        {
            id: 2,
            category: "Transport",
            amount: 2500,
            period: "monthly"
        },

        {
            id: 3,
            category: "Shopping",
            amount: 3000,
            period: "monthly"
        },

        {
            id: 4,
            category: "Education",
            amount: 5000,
            period: "monthly"
        }

    ];

    saveToStorage(
        "budgets",
        budgets
    );
}


/* =========================================================
   LOAD BUDGET PAGE
   ========================================================= */

function loadBudgetPage() {

    const transactions =
        getFromStorage("transactions") || [];

    const currentMonthTransactions =
        getCurrentMonthTransactions(
            transactions
        );


    updateBudgetSummary(
        currentMonthTransactions
    );

    displayBudgets(
        currentMonthTransactions
    );
}


/* =========================================================
   UPDATE BUDGET SUMMARY
   ========================================================= */

function updateBudgetSummary(
    transactions
) {

    let totalBudget = 0;
    let totalSpent = 0;


    budgets.forEach(function (budget) {

        totalBudget +=
            Number(budget.amount) || 0;

        totalSpent +=
            getCategoryExpense(
                transactions,
                budget.category
            );

    });


    const remaining =
        totalBudget - totalSpent;


    updateBudgetElement(
        "#totalBudget",
        formatCurrency(totalBudget)
    );

    updateBudgetElement(
        "#totalSpent",
        formatCurrency(totalSpent)
    );

    updateBudgetElement(
        "#remainingBudget",
        formatCurrency(remaining)
    );

    updateBudgetElement(
        "#budgetCount",
        budgets.length
    );


    const percentage =
        totalBudget > 0
            ? (totalSpent / totalBudget) * 100
            : 0;


    updateBudgetElement(
        "#budgetProgress",
        Math.min(percentage, 100).toFixed(1) + "%"
    );
}


/* =========================================================
   DISPLAY BUDGETS
   ========================================================= */

function displayBudgets(
    transactions
) {

    const container =
        document.querySelector(
            "#budgetList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (budgets.length === 0) {

        displayBudgetEmptyState(
            container
        );

        return;
    }


    budgets.forEach(function (budget) {

        const spent =
            getCategoryExpense(
                transactions,
                budget.category
            );


        const budgetAmount =
            Number(budget.amount) || 0;


        const remaining =
            budgetAmount - spent;


        const percentage =
            budgetAmount > 0
                ? (spent / budgetAmount) * 100
                : 0;


        const progress =
            Math.min(
                Math.max(percentage, 0),
                100
            );


        const status =
            getBudgetStatus(
                percentage
            );


        const card =
            document.createElement("div");


        card.className =
            "budget-card";


        card.innerHTML = `

            <div class="budget-card-header">

                <div class="budget-category">

                    <span class="budget-icon">
                        ${getBudgetIcon(
                            budget.category
                        )}
                    </span>

                    <div>
                        <h3>
                            ${escapeBudgetHTML(
                                budget.category
                            )}
                        </h3>

                        <span>
                            ${formatBudgetPeriod(
                                budget.period
                            )}
                        </span>
                    </div>

                </div>


                <div class="budget-actions">

                    <button
                        type="button"
                        class="action-btn edit-btn"
                        onclick="editBudget(${budget.id})"
                        title="Edit budget">
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="action-btn delete-btn"
                        onclick="deleteBudget(${budget.id})"
                        title="Delete budget">
                        🗑️
                    </button>

                </div>

            </div>


            <div class="budget-amount-row">

                <div>

                    <small>
                        Spent
                    </small>

                    <strong>
                        ${formatCurrency(spent)}
                    </strong>

                </div>


                <div class="budget-limit">

                    <small>
                        Budget
                    </small>

                    <strong>
                        ${formatCurrency(budgetAmount)}
                    </strong>

                </div>

            </div>


            <div class="budget-progress-container">

                <div class="budget-progress-bar">

                    <div
                        class="budget-progress-fill ${status}"
                        style="width: ${progress}%;">
                    </div>

                </div>


                <span>
                    ${percentage.toFixed(1)}%
                </span>

            </div>


            <div class="budget-footer">

                <span class="${remaining < 0
                    ? "over-budget"
                    : "remaining-budget"}">

                    ${
                        remaining >= 0
                        ? formatCurrency(
                            remaining
                          ) + " remaining"
                        : formatCurrency(
                            Math.abs(remaining)
                          ) + " over budget"
                    }

                </span>


                <span class="budget-status ${status}">
                    ${getBudgetStatusText(status)}
                </span>

            </div>

        `;


        container.appendChild(card);

    });
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function displayBudgetEmptyState(
    container
) {

    container.innerHTML = `

        <div class="empty-state">

            <div class="empty-state-icon">
                💰
            </div>

            <h3>
                No budgets created
            </h3>

            <p>
                Create your first budget to
                start controlling your spending.
            </p>

            <button
                type="button"
                class="btn btn-primary"
                onclick="showBudgetForm()">

                + Create Budget

            </button>

        </div>

    `;
}


/* =========================================================
   GET CATEGORY EXPENSE
   ========================================================= */

function getCategoryExpense(
    transactions,
    category
) {

    let total = 0;


    transactions.forEach(
        function (transaction) {

            if (
                transaction.type === "expense" &&
                transaction.category === category
            ) {

                total +=
                    Number(transaction.amount) || 0;

            }

        }
    );


    return total;
}


/* =========================================================
   CURRENT MONTH TRANSACTIONS
   ========================================================= */

function getCurrentMonthTransactions(
    transactions
) {

    const today =
        new Date();


    const currentMonth =
        today.getMonth();


    const currentYear =
        today.getFullYear();


    return transactions.filter(
        function (transaction) {

            if (!transaction.date) {
                return false;
            }


            const date =
                new Date(transaction.date);


            return (
                date.getMonth() === currentMonth &&
                date.getFullYear() === currentYear
            );

        }
    );
}


/* =========================================================
   BUDGET STATUS
   ========================================================= */

function getBudgetStatus(
    percentage
) {

    if (percentage >= 100) {
        return "danger";
    }

    if (percentage >= 80) {
        return "warning";
    }

    return "safe";
}


/* =========================================================
   STATUS TEXT
   ========================================================= */

function getBudgetStatusText(
    status
) {

    if (status === "danger") {
        return "Over Budget";
    }

    if (status === "warning") {
        return "Almost Full";
    }

    return "On Track";
}


/* =========================================================
   BUDGET FORM
   ========================================================= */

function initializeBudgetForm() {

    const form =
        document.querySelector(
            "#budgetForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            saveBudget();

        }
    );


    const cancelButton =
        document.querySelector(
            "#cancelBudget"
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                hideBudgetForm();

            }
        );

    }
}


/* =========================================================
   SAVE BUDGET
   ========================================================= */

function saveBudget() {

    const categoryInput =
        document.querySelector(
            "#budgetCategory"
        );


    const amountInput =
        document.querySelector(
            "#budgetAmount"
        );


    const periodInput =
        document.querySelector(
            "#budgetPeriod"
        );


    if (!categoryInput || !amountInput) {
        return;
    }


    const category =
        categoryInput.value;


    const amount =
        Number(amountInput.value);


    const period =
        periodInput
            ? periodInput.value
            : "monthly";


    if (!category) {

        showMessage(
            "Please select a category.",
            "error"
        );

        return;
    }


    if (
        !amount ||
        amount <= 0
    ) {

        showMessage(
            "Please enter a valid budget amount.",
            "error"
        );

        return;
    }


    const editingId =
        formEditingBudgetId();


    if (editingId) {

        const budget =
            budgets.find(
                function (item) {
                    return item.id === editingId;
                }
            );


        if (budget) {

            budget.category =
                category;

            budget.amount =
                amount;

            budget.period =
                period;

        }

        showMessage(
            "Budget updated successfully.",
            "success"
        );

    }
    else {

        const newBudget = {

            id: Date.now(),

            category: category,

            amount: amount,

            period: period

        };


        budgets.push(newBudget);


        showMessage(
            "Budget created successfully.",
            "success"
        );

    }


    saveToStorage(
        "budgets",
        budgets
    );


    clearBudgetForm();

    hideBudgetForm();

    loadBudgetPage();
}


/* =========================================================
   EDIT BUDGET
   ========================================================= */

let editingBudgetId = null;


function editBudget(id) {

    const budget =
        budgets.find(
            function (item) {
                return item.id === id;
            }
        );


    if (!budget) {
        return;
    }


    editingBudgetId = id;


    const categoryInput =
        document.querySelector(
            "#budgetCategory"
        );


    const amountInput =
        document.querySelector(
            "#budgetAmount"
        );


    const periodInput =
        document.querySelector(
            "#budgetPeriod"
        );


    if (categoryInput) {
        categoryInput.value =
            budget.category;
    }


    if (amountInput) {
        amountInput.value =
            budget.amount;
    }


    if (periodInput) {
        periodInput.value =
            budget.period;
    }


    showBudgetForm();


    const submitButton =
        document.querySelector(
            "#budgetForm button[type='submit']"
        );


    if (submitButton) {

        submitButton.textContent =
            "Update Budget";

    }
}


/* =========================================================
   GET EDITING ID
   ========================================================= */

function formEditingBudgetId() {

    return editingBudgetId;
}


/* =========================================================
   DELETE BUDGET
   ========================================================= */

function deleteBudget(id) {

    const budget =
        budgets.find(
            function (item) {
                return item.id === id;
            }
        );


    if (!budget) {
        return;
    }


    const confirmed =
        confirm(
            `Delete ${budget.category} budget?`
        );


    if (!confirmed) {
        return;
    }


    budgets =
        budgets.filter(
            function (item) {
                return item.id !== id;
            }
        );


    saveToStorage(
        "budgets",
        budgets
    );


    loadBudgetPage();


    showMessage(
        "Budget deleted successfully.",
        "success"
    );
}


/* =========================================================
   SHOW BUDGET FORM
   ========================================================= */

function showBudgetForm() {

    const formContainer =
        document.querySelector(
            "#budgetFormContainer"
        );


    if (formContainer) {

        formContainer.classList.add(
            "active"
        );

        formContainer.style.display =
            "block";

    }

}


/* =========================================================
   HIDE BUDGET FORM
   ========================================================= */

function hideBudgetForm() {

    const formContainer =
        document.querySelector(
            "#budgetFormContainer"
        );


    if (formContainer) {

        formContainer.classList.remove(
            "active"
        );

        formContainer.style.display =
            "none";

    }


    clearBudgetForm();

    editingBudgetId = null;


    const submitButton =
        document.querySelector(
            "#budgetForm button[type='submit']"
        );


    if (submitButton) {

        submitButton.textContent =
            "Create Budget";

    }
}


/* =========================================================
   CLEAR FORM
   ========================================================= */

function clearBudgetForm() {

    const form =
        document.querySelector(
            "#budgetForm"
        );


    if (form) {
        form.reset();
    }

}


/* =========================================================
   FILTERS
   ========================================================= */

function initializeBudgetFilters() {

    const periodFilter =
        document.querySelector(
            "#budgetPeriodFilter"
        );


    if (periodFilter) {

        periodFilter.addEventListener(
            "change",
            function () {

                filterBudgets(
                    periodFilter.value
                );

            }
        );

    }
}


/* =========================================================
   FILTER BUDGETS
   ========================================================= */

function filterBudgets(period) {

    const container =
        document.querySelector(
            "#budgetList"
        );


    if (!container) {
        return;
    }


    if (
        !period ||
        period === "all"
    ) {

        const transactions =
            getFromStorage(
                "transactions"
            ) || [];

        displayBudgets(
            getCurrentMonthTransactions(
                transactions
            )
        );

        return;
    }


    const filtered =
        budgets.filter(
            function (budget) {

                return budget.period === period;

            }
        );


    const transactions =
        getFromStorage(
            "transactions"
        ) || [];


    container.innerHTML = "";


    filtered.forEach(function (budget) {

        const spent =
            getCategoryExpense(
                getCurrentMonthTransactions(
                    transactions
                ),
                budget.category
            );


        const amount =
            Number(budget.amount) || 0;


        const percentage =
            amount > 0
                ? (spent / amount) * 100
                : 0;


        const card =
            document.createElement("div");


        card.className =
            "budget-card";


        card.innerHTML = `

            <div class="budget-card-header">

                <div class="budget-category">

                    <span class="budget-icon">
                        ${getBudgetIcon(
                            budget.category
                        )}
                    </span>

                    <div>
                        <h3>
                            ${escapeBudgetHTML(
                                budget.category
                            )}
                        </h3>

                        <span>
                            ${formatBudgetPeriod(
                                budget.period
                            )}
                        </span>
                    </div>

                </div>

            </div>


            <div class="budget-amount-row">

                <div>
                    <small>Spent</small>
                    <strong>
                        ${formatCurrency(spent)}
                    </strong>
                </div>

                <div>
                    <small>Budget</small>
                    <strong>
                        ${formatCurrency(amount)}
                    </strong>
                </div>

            </div>


            <div class="budget-progress-container">

                <div class="budget-progress-bar">

                    <div
                        class="budget-progress-fill ${getBudgetStatus(
                            percentage
                        )}"
                        style="width: ${Math.min(
                            percentage,
                            100
                        )}%;">
                    </div>

                </div>

                <span>
                    ${percentage.toFixed(1)}%
                </span>

            </div>

        `;


        container.appendChild(card);

    });
}


/* =========================================================
   CATEGORY ICONS
   ========================================================= */

function getBudgetIcon(category) {

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
   FORMAT PERIOD
   ========================================================= */

function formatBudgetPeriod(period) {

    const periods = {

        "daily": "Daily",

        "weekly": "Weekly",

        "monthly": "Monthly",

        "yearly": "Yearly"

    };


    return periods[period] ||
           "Monthly";
}


/* =========================================================
   UPDATE ELEMENT
   ========================================================= */

function updateBudgetElement(
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

function escapeBudgetHTML(value) {

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
   REFRESH BUDGET
   ========================================================= */

function refreshBudgets() {

    loadBudgets();

    loadBudgetPage();
}