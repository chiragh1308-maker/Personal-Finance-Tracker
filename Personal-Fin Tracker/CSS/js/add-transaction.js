 /* =========================================================
    ADD TRANSACTION JAVASCRIPT
    Personal Finance Tracker
    File: frontend/js/add-transaction.js
    ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    if (typeof checkLogin === "function") {
        checkLogin();
    }

    initializeTransactionForm();

    loadEditingTransaction();

    setDefaultTransactionDate();

    initializeAmountValidation();

    initializeTypeChange();

});


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let editingTransactionId = null;


/* =========================================================
   INITIALIZE FORM
   ========================================================= */

function initializeTransactionForm() {

    const form =
        document.querySelector(
            "#transactionForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            saveTransaction();

        }
    );


    const cancelButton =
        document.querySelector(
            "#cancelTransaction"
        );


    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            function () {
                window.location.href = "transaction.html";
            }
        );
    }
}


/* =========================================================
   LOAD EDITING TRANSACTION
   ========================================================= */

function loadEditingTransaction() {

    const transaction =
        getFromStorage(
            "editingTransaction"
        );


    if (!transaction) {
        return;
    }


    editingTransactionId =
        transaction.id;


    const titleInput =
        document.querySelector(
            "#transactionTitle"
        );


    const categoryInput =
        document.querySelector(
            "#transactionCategory"
        );


    const amountInput =
        document.querySelector(
            "#transactionAmount"
        );


    const dateInput =
        document.querySelector(
            "#transactionDate"
        );


    const typeInput =
        document.querySelector(
            "#transactionType"
        );


    const descriptionInput =
        document.querySelector(
            "#transactionDescription"
        );


    if (titleInput) {
        titleInput.value =
            transaction.title || "";
    }


    if (categoryInput) {
        categoryInput.value =
            transaction.category || "";
    }


    if (amountInput) {
        amountInput.value =
            transaction.amount || "";
    }


    if (dateInput) {
        dateInput.value =
            transaction.date || "";
    }


    if (typeInput) {
        typeInput.value =
            transaction.type || "expense";
    }


    if (descriptionInput) {
        descriptionInput.value =
            transaction.description || "";
    }


    // Change heading
    const heading =
        document.querySelector(
            "#transactionFormTitle"
        );


    if (heading) {

        heading.textContent =
            "Edit Transaction";

    }


    // Change button text
    const submitButton =
        document.querySelector(
            "#transactionForm button[type='submit']"
        );


    if (submitButton) {

        submitButton.textContent =
            "Update Transaction";

    }

}


/* =========================================================
   SET DEFAULT DATE
   ========================================================= */

function setDefaultTransactionDate() {

    const dateInput =
        document.querySelector(
            "#transactionDate"
        );


    if (!dateInput) {
        return;
    }


    if (!dateInput.value) {

        const today =
            new Date();


        const year =
            today.getFullYear();


        const month =
            String(
                today.getMonth() + 1
            ).padStart(2, "0");


        const day =
            String(
                today.getDate()
            ).padStart(2, "0");


        dateInput.value =
            `${year}-${month}-${day}`;

    }

}


/* =========================================================
   SAVE TRANSACTION
   ========================================================= */

function saveTransaction() {

    const titleInput =
        document.querySelector(
            "#transactionTitle"
        );


    const categoryInput =
        document.querySelector(
            "#transactionCategory"
        );


    const amountInput =
        document.querySelector(
            "#transactionAmount"
        );


    const dateInput =
        document.querySelector(
            "#transactionDate"
        );


    const typeInput =
        document.querySelector(
            "#transactionType"
        );


    const descriptionInput =
        document.querySelector(
            "#transactionDescription"
        );


    const title =
        titleInput
            ? titleInput.value.trim()
            : "";


    const category =
        categoryInput
            ? categoryInput.value
            : "";


    const amount =
        amountInput
            ? Number(amountInput.value)
            : 0;


    const date =
        dateInput
            ? dateInput.value
            : "";


    const type =
        typeInput
            ? typeInput.value
            : "expense";


    const description =
        descriptionInput
            ? descriptionInput.value.trim()
            : "";


    /* -----------------------------------------------------
       VALIDATION
       ----------------------------------------------------- */

    clearTransactionErrors();


    let valid = true;


    if (!title) {

        showTransactionError(
            titleInput,
            "Please enter a transaction title."
        );

        valid = false;

    }


    if (!category) {

        showTransactionError(
            categoryInput,
            "Please select a category."
        );

        valid = false;

    }


    if (
        !amount ||
        amount <= 0
    ) {

        showTransactionError(
            amountInput,
            "Please enter a valid amount."
        );

        valid = false;

    }


    if (!date) {

        showTransactionError(
            dateInput,
            "Please select a date."
        );

        valid = false;

    }


    if (
        type !== "income" &&
        type !== "expense"
    ) {

        showTransactionError(
            typeInput,
            "Please select transaction type."
        );

        valid = false;

    }


    if (!valid) {
        return;
    }


    /* -----------------------------------------------------
       GET EXISTING TRANSACTIONS
       ----------------------------------------------------- */

    let transactions =
        getFromStorage(
            "transactions"
        ) || [];


    if (!Array.isArray(transactions)) {
        transactions = [];
    }


    /* -----------------------------------------------------
       CREATE TRANSACTION OBJECT
       ----------------------------------------------------- */

    const transaction = {

        id:
            editingTransactionId ||
            Date.now(),

        person:
            (typeof getCurrentUser === "function" && getCurrentUser()
                ? getCurrentUser().name
                : "Demo User"),

        title:
            title,

        category:
            category,

        amount:
            amount,

        date:
            date,

        type:
            type,

        description:
            description,

        updatedAt:
            new Date().toISOString()

    };


    /* -----------------------------------------------------
       EDIT EXISTING TRANSACTION
       ----------------------------------------------------- */

    if (editingTransactionId) {

        const index =
            transactions.findIndex(
                function (item) {

                    return (
                        item.id ===
                        editingTransactionId
                    );

                }
            );


        if (index !== -1) {

            transactions[index] =
                transaction;

        }


        showMessage(
            "Transaction updated successfully.",
            "success"
        );

    }


    /* -----------------------------------------------------
       ADD NEW TRANSACTION
       ----------------------------------------------------- */

    else {

        transaction.createdAt =
            new Date().toISOString();


        transactions.push(
            transaction
        );


        showMessage(
            "Transaction added successfully.",
            "success"
        );

    }


    /* -----------------------------------------------------
       SAVE TO LOCAL STORAGE
       ----------------------------------------------------- */

    saveToStorage(
        "transactions",
        transactions
    );


    /* -----------------------------------------------------
       REMOVE EDITING DATA
       ----------------------------------------------------- */

    removeFromStorage(
        "editingTransaction"
    );


    /* -----------------------------------------------------
       REDIRECT
       ----------------------------------------------------- */

    setTimeout(
        function () {

            window.location.href =
                "transaction.html";

        },
        800
    );

}


/* =========================================================
   AMOUNT VALIDATION
   ========================================================= */

function initializeAmountValidation() {

    const amountInput =
        document.querySelector(
            "#transactionAmount"
        );


    if (!amountInput) {
        return;
    }


    amountInput.addEventListener(
        "input",
        function () {

            let value =
                amountInput.value;


            // Allow only numbers and decimal point
            value =
                value.replace(
                    /[^0-9.]/g,
                    ""
                );


            // Allow only one decimal point
            const parts =
                value.split(".");


            if (parts.length > 2) {

                value =
                    parts[0] +
                    "." +
                    parts.slice(1).join("");

            }


            amountInput.value =
                value;

        }
    );

}


/* =========================================================
   TYPE CHANGE
   ========================================================= */

function initializeTypeChange() {

    const typeInput =
        document.querySelector(
            "#transactionType"
        );


    if (!typeInput) {
        return;
    }


    typeInput.addEventListener(
        "change",
        function () {

            updateTransactionFormType(
                typeInput.value
            );

        }
    );


    updateTransactionFormType(
        typeInput.value
    );

}


/* =========================================================
   UPDATE FORM TYPE
   ========================================================= */

function updateTransactionFormType(
    type
) {

    const form =
        document.querySelector(
            "#transactionForm"
        );


    if (!form) {
        return;
    }


    form.classList.remove(
        "income-form",
        "expense-form"
    );


    if (type === "income") {

        form.classList.add(
            "income-form"
        );

    }


    else if (type === "expense") {

        form.classList.add(
            "expense-form"
        );

    }

}


/* =========================================================
   SHOW FIELD ERROR
   ========================================================= */

function showTransactionError(
    input,
    message
) {

    if (!input) {
        return;
    }


    input.classList.add(
        "input-error"
    );


    let error =
        input.parentElement
            .querySelector(
                ".form-error"
            );


    if (!error) {

        error =
            document.createElement(
                "small"
            );

        error.className =
            "form-error";


        input.parentElement.appendChild(
            error
        );

    }


    error.textContent =
        message;

}


/* =========================================================
   CLEAR ERRORS
   ========================================================= */

function clearTransactionErrors() {

    const inputs =
        document.querySelectorAll(
            ".input-error"
        );


    inputs.forEach(
        function (input) {

            input.classList.remove(
                "input-error"
            );

        }
    );


    const errors =
        document.querySelectorAll(
            ".form-error"
        );


    errors.forEach(
        function (error) {

            error.textContent =
                "";

        }
    );

}


/* =========================================================
   QUICK CATEGORY SELECTION
   ========================================================= */

function selectCategory(category) {

    const categoryInput =
        document.querySelector(
            "#transactionCategory"
        );


    if (!categoryInput) {
        return;
    }


    categoryInput.value =
        category;

}


/* =========================================================
   GO BACK
   ========================================================= */

function cancelTransaction() {

    removeFromStorage(
        "editingTransaction"
    );


    window.location.href =
        "transaction.html";

}


/* =========================================================
   RESET FORM
   ========================================================= */

function resetTransactionForm() {

    const form =
        document.querySelector(
            "#transactionForm"
        );


    if (form) {

        form.reset();

    }


    editingTransactionId =
        null;


    removeFromStorage(
        "editingTransaction"
    );


    setDefaultTransactionDate();

}


/* =========================================================
   GET TRANSACTION BY ID
   ========================================================= */

function getTransactionById(id) {

    const transactions =
        getFromStorage(
            "transactions"
        ) || [];


    return transactions.find(
        function (transaction) {

            return transaction.id === id;

        }
    );

}


/* =========================================================
   EXPORT FUNCTION
   ========================================================= */

function addTransactionFromDashboard() {

    removeFromStorage(
        "editingTransaction"
    );


    window.location.href =
        "add-transaction.html";

}