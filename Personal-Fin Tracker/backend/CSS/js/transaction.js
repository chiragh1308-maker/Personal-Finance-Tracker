/* =========================================================
   TRANSACTIONS JAVASCRIPT
   Personal Finance Tracker
   File: frontend/js/transactions.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    if (typeof checkLogin === "function") {
        checkLogin();
    }

    initializeTransactionsPage();
});


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let allTransactions = [];
let filteredTransactions = [];

let currentPage = 1;
const transactionsPerPage = 10;


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeTransactionsPage() {

    loadTransactions();

    initializeFilters();

    initializeSearch();

    displayTransactions();
}


/* =========================================================
   LOAD TRANSACTIONS
   ========================================================= */

function loadTransactions() {

    const savedTransactions =
        getFromStorage("transactions");


    if (savedTransactions && Array.isArray(savedTransactions)) {

        allTransactions = savedTransactions;

    }
    else {

        allTransactions = getDemoTransactions();

        saveToStorage(
            "transactions",
            allTransactions
        );

    }


    filteredTransactions = [...allTransactions];
}


/* =========================================================
   DEMO TRANSACTIONS
   ========================================================= */

function getDemoTransactions() {

    return [

        {
            id: 1,
            title: "Monthly Salary",
            category: "Salary",
            type: "income",
            amount: 25000,
            date: "2026-09-01",
            description: "Monthly salary"
        },

        {
            id: 2,
            title: "College Fees",
            category: "Education",
            type: "expense",
            amount: 5000,
            date: "2026-09-02",
            description: "College fees"
        },

        {
            id: 3,
            title: "Petrol",
            category: "Transport",
            type: "expense",
            amount: 1200,
            date: "2026-09-03",
            description: "Bike petrol"
        },

        {
            id: 4,
            title: "Food",
            category: "Food",
            type: "expense",
            amount: 850,
            date: "2026-09-04",
            description: "Food expenses"
        },

        {
            id: 5,
            title: "Freelance Work",
            category: "Freelance",
            type: "income",
            amount: 3500,
            date: "2026-09-05",
            description: "Freelance payment"
        }

    ];
}


/* =========================================================
   DISPLAY TRANSACTIONS
   ========================================================= */

function displayTransactions() {

    const tableBody =
        document.querySelector(
            "#transactionsTableBody"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    if (filteredTransactions.length === 0) {

        showTransactionsEmptyState(
            tableBody
        );

        updateTransactionSummary();

        updatePagination();

        return;
    }


    const startIndex =
        (currentPage - 1) *
        transactionsPerPage;


    const endIndex =
        startIndex +
        transactionsPerPage;


    const currentTransactions =
        filteredTransactions.slice(
            startIndex,
            endIndex
        );


    currentTransactions.forEach(
        function (transaction) {

            const row =
                document.createElement("tr");


            const amount =
                Number(transaction.amount) || 0;


            const isIncome =
                transaction.type === "income";


            row.innerHTML = `

                <td>
                    <div class="transaction-name">
                        <span class="category-icon">
                            ${getTransactionIcon(
                                transaction.category
                            )}
                        </span>

                        <div>
                            <strong>
                                ${escapeTransactionHTML(
                                    transaction.title ||
                                    "Transaction"
                                )}
                            </strong>

                            <small>
                                ${escapeTransactionHTML(
                                    transaction.description || ""
                                )}
                            </small>
                        </div>
                    </div>
                </td>


                <td>
                    <span class="category-badge">
                        ${escapeTransactionHTML(
                            transaction.category ||
                            "Other"
                        )}
                    </span>
                </td>


                <td>
                    <span class="
                        transaction-type
                        ${isIncome ? "income" : "expense"}
                    ">
                        ${isIncome ? "Income" : "Expense"}
                    </span>
                </td>


                <td>
                    ${formatTransactionDate(
                        transaction.date
                    )}
                </td>


                <td>
                    <strong class="
                        transaction-amount
                        ${isIncome
                            ? "income-amount"
                            : "expense-amount"}
                    ">
                        ${isIncome ? "+" : "-"}
                        ${formatCurrency(amount)}
                    </strong>
                </td>


                <td>
                    <div class="transaction-actions">

                        <button
                            type="button"
                            class="action-btn edit-btn"
                            onclick="editTransaction(${transaction.id})"
                            title="Edit transaction">
                            ✏️
                        </button>

                        <button
                            type="button"
                            class="action-btn delete-btn"
                            onclick="deleteTransaction(${transaction.id})"
                            title="Delete transaction">
                            🗑️
                        </button>

                    </div>
                </td>

            `;


            tableBody.appendChild(row);

        }
    );


    updateTransactionSummary();

    updatePagination();
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function showTransactionsEmptyState(
    tableBody
) {

    const row =
        document.createElement("tr");


    row.innerHTML = `

        <td colspan="6">

            <div class="empty-state">

                <div class="empty-state-icon">
                    💰
                </div>

                <h3>
                    No transactions found
                </h3>

                <p>
                    Try changing your filters
                    or add a new transaction.
                </p>

                <button
                    type="button"
                    class="btn btn-primary"
                    onclick="goToAddTransaction()">
                    + Add Transaction
                </button>

            </div>

        </td>

    `;


    tableBody.appendChild(row);
}


/* =========================================================
   SUMMARY
   ========================================================= */

function updateTransactionSummary() {

    let income = 0;
    let expense = 0;


    filteredTransactions.forEach(
        function (transaction) {

            const amount =
                Number(transaction.amount) || 0;


            if (transaction.type === "income") {
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


    updateTransactionElement(
        "#transactionIncome",
        formatCurrency(income)
    );


    updateTransactionElement(
        "#transactionExpense",
        formatCurrency(expense)
    );


    updateTransactionElement(
        "#transactionBalance",
        formatCurrency(balance)
    );


    updateTransactionElement(
        "#transactionCount",
        filteredTransactions.length
    );
}


/* =========================================================
   UPDATE ELEMENT
   ========================================================= */

function updateTransactionElement(
    selector,
    value
) {

    const element =
        document.querySelector(selector);


    if (element) {
        element.textContent = value;
    }
}


/* =========================================================
   FILTERS
   ========================================================= */

function initializeFilters() {

    const typeFilter =
        document.querySelector(
            "#typeFilter"
        );


    const categoryFilter =
        document.querySelector(
            "#categoryFilter"
        );


    const dateFilter =
        document.querySelector(
            "#dateFilter"
        );


    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    const clearFilterButton =
        document.querySelector(
            "#clearFilters"
        );


    if (clearFilterButton) {

        clearFilterButton.addEventListener(
            "click",
            clearFilters
        );

    }
}


/* =========================================================
   SEARCH
   ========================================================= */

function initializeSearch() {

    const searchInput =
        document.querySelector(
            "#transactionSearch"
        );


    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        "input",
        function () {

            applyFilters();

        }
    );
}


/* =========================================================
   APPLY FILTERS
   ========================================================= */

function applyFilters() {

    const searchInput =
        document.querySelector(
            "#transactionSearch"
        );


    const typeFilter =
        document.querySelector(
            "#typeFilter"
        );


    const categoryFilter =
        document.querySelector(
            "#categoryFilter"
        );


    const dateFilter =
        document.querySelector(
            "#dateFilter"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const type =
        typeFilter
            ? typeFilter.value
            : "all";


    const category =
        categoryFilter
            ? categoryFilter.value
            : "all";


    const date =
        dateFilter
            ? dateFilter.value
            : "all";


    filteredTransactions =
        allTransactions.filter(
            function (transaction) {


                // Search
                const searchableText =
                    (
                        transaction.title +
                        " " +
                        transaction.category +
                        " " +
                        transaction.description
                    ).toLowerCase();


                if (
                    search &&
                    !searchableText.includes(search)
                ) {

                    return false;

                }


                // Type
                if (
                    type !== "all" &&
                    transaction.type !== type
                ) {

                    return false;

                }


                // Category
                if (
                    category !== "all" &&
                    transaction.category !== category
                ) {

                    return false;

                }


                // Date
                if (date !== "all") {

                    if (
                        !matchesDateFilter(
                            transaction.date,
                            date
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    currentPage = 1;

    displayTransactions();
}


/* =========================================================
   DATE FILTER
   ========================================================= */

function matchesDateFilter(
    transactionDate,
    filter
) {

    if (!transactionDate) {
        return false;
    }


    const date =
        new Date(transactionDate);


    const today =
        new Date();


    if (filter === "today") {

        return (
            date.toDateString() ===
            today.toDateString()
        );

    }


    if (filter === "week") {

        const weekAgo =
            new Date();

        weekAgo.setDate(
            today.getDate() - 7
        );


        return date >= weekAgo;

    }


    if (filter === "month") {

        return (
            date.getMonth() ===
            today.getMonth() &&

            date.getFullYear() ===
            today.getFullYear()
        );

    }


    return true;
}


/* =========================================================
   CLEAR FILTERS
   ========================================================= */

function clearFilters() {

    const searchInput =
        document.querySelector(
            "#transactionSearch"
        );


    const typeFilter =
        document.querySelector(
            "#typeFilter"
        );


    const categoryFilter =
        document.querySelector(
            "#categoryFilter"
        );


    const dateFilter =
        document.querySelector(
            "#dateFilter"
        );


    if (searchInput) {
        searchInput.value = "";
    }


    if (typeFilter) {
        typeFilter.value = "all";
    }


    if (categoryFilter) {
        categoryFilter.value = "all";
    }


    if (dateFilter) {
        dateFilter.value = "all";
    }


    filteredTransactions =
        [...allTransactions];


    currentPage = 1;

    displayTransactions();
}


/* =========================================================
   DELETE TRANSACTION
   ========================================================= */

function deleteTransaction(id) {

    const transaction =
        allTransactions.find(
            function (item) {
                return item.id === id;
            }
        );


    if (!transaction) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${transaction.title}"?`
        );


    if (!confirmed) {
        return;
    }


    allTransactions =
        allTransactions.filter(
            function (item) {
                return item.id !== id;
            }
        );


    saveToStorage(
        "transactions",
        allTransactions
    );


    applyFilters();


    showMessage(
        "Transaction deleted successfully.",
        "success"
    );
}


/* =========================================================
   EDIT TRANSACTION
   ========================================================= */

function editTransaction(id) {

    const transaction =
        allTransactions.find(
            function (item) {
                return item.id === id;
            }
        );


    if (!transaction) {
        return;
    }


    /*
     * Save selected transaction so
     * add-transaction.html can edit it.
     */

    saveToStorage(
        "editingTransaction",
        transaction
    );


    window.location.href =
        "add-transaction.html";
}


/* =========================================================
   ADD TRANSACTION
   ========================================================= */

function goToAddTransaction() {

    removeFromStorage(
        "editingTransaction"
    );


    window.location.href =
        "add-transaction.html";
}


/* =========================================================
   PAGINATION
   ========================================================= */

function updatePagination() {

    const pagination =
        document.querySelector(
            "#pagination"
        );


    if (!pagination) {
        return;
    }


    pagination.innerHTML = "";


    const totalPages =
        Math.ceil(
            filteredTransactions.length /
            transactionsPerPage
        );


    if (totalPages <= 1) {
        return;
    }


    // Previous button
    const previousButton =
        document.createElement("button");


    previousButton.textContent = "‹";

    previousButton.className =
        "pagination-btn";


    previousButton.disabled =
        currentPage === 1;


    previousButton.addEventListener(
        "click",
        function () {

            if (currentPage > 1) {

                currentPage--;

                displayTransactions();

            }

        }
    );


    pagination.appendChild(
        previousButton
    );


    // Page buttons
    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        const pageButton =
            document.createElement("button");


        pageButton.textContent = page;

        pageButton.className =
            "pagination-btn";


        if (page === currentPage) {
            pageButton.classList.add(
                "active"
            );
        }


        pageButton.addEventListener(
            "click",
            function () {

                currentPage = page;

                displayTransactions();

            }
        );


        pagination.appendChild(
            pageButton
        );

    }


    // Next button
    const nextButton =
        document.createElement("button");


    nextButton.textContent = "›";

    nextButton.className =
        "pagination-btn";


    nextButton.disabled =
        currentPage === totalPages;


    nextButton.addEventListener(
        "click",
        function () {

            if (currentPage < totalPages) {

                currentPage++;

                displayTransactions();

            }

        }
    );


    pagination.appendChild(
        nextButton
    );
}


/* =========================================================
   TRANSACTION ICON
   ========================================================= */

function getTransactionIcon(category) {

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
        "Rent": "🏠",
        "Other": "📌"

    };


    return icons[category] || "📌";
}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatTransactionDate(dateString) {

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
   ESCAPE HTML
   ========================================================= */

function escapeTransactionHTML(value) {

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
   REFRESH TRANSACTIONS
   ========================================================= */

function refreshTransactions() {

    loadTransactions();

    applyFilters();
}