/* =========================================
   PERSONAL FINANCE TRACKER - MAIN JS
   ========================================= */

// The API follows the browser host, so laptop and mobile use the same Wi-Fi IP.
// To override it later, set window.FINTRACK_API_URL to http://YOUR_LAPTOP_IP:5000.
const API_URL = window.FINTRACK_API_URL || `http://${window.location.hostname}:5000`;

async function apiRequest(path, options = {}) {
    try {
        const response = await fetch(`${API_URL}${path}`, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            ...options
        });
        const data = await response.json().catch(function () { return {}; });

        if (!response.ok) {
            throw new Error(data.message || "The server could not complete the request.");
        }

        return data;
    } catch (error) {
        console.error("FinTrack API request failed:", error);
        showMessage("Unable to connect to server. Please make sure the backend is running.", "error");
        throw error;
    }
}


/* ---------- Mobile Navigation ---------- */

document.addEventListener("DOMContentLoaded", function () {

    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (menuToggle && navLinks) {

        menuToggle.addEventListener("click", function () {
            navLinks.classList.toggle("active");
            menuToggle.setAttribute("aria-expanded", navLinks.classList.contains("active") ? "true" : "false");
        });

    }

});


/* ---------- Close Mobile Menu ---------- */

document.addEventListener("click", function (event) {

    const navLinks = document.querySelector(".nav-links");
    const menuToggle = document.querySelector(".menu-toggle");

    if (!navLinks || !menuToggle) {
        return;
    }

    if (
        navLinks.classList.contains("active") &&
        !navLinks.contains(event.target) &&
        !menuToggle.contains(event.target)
    ) {
        navLinks.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
    }

});

document.addEventListener("click", function (event) {
    const link = event.target.closest(".nav-links a");
    const navLinks = document.querySelector(".nav-links");
    const menuToggle = document.querySelector(".menu-toggle");

    if (link && navLinks && menuToggle) {
        navLinks.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
    }
});


/* ---------- Active Navigation Link ---------- */

document.addEventListener("DOMContentLoaded", function () {

    const currentPage = window.location.pathname.split("/").pop();

    const navItems = document.querySelectorAll(".nav-links a");

    navItems.forEach(function (link) {

        const linkPage = link.getAttribute("href");

        if (linkPage === currentPage) {
            link.classList.add("active");
        }

    });

});


/* ---------- Confirm Delete ---------- */

function confirmDelete(message = "Are you sure you want to delete this item?") {

    return window.confirm(message);

}


/* ---------- Currency Formatter ---------- */

function formatCurrency(amount) {

    amount = Number(amount) || 0;

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);

}


/* ---------- Number Formatter ---------- */

function formatNumber(number) {

    number = Number(number) || 0;

    return new Intl.NumberFormat("en-IN").format(number);

}


/* ---------- Date Formatter ---------- */

function formatDate(date) {

    if (!date) {
        return "";
    }

    const dateObject = new Date(date);

    if (isNaN(dateObject.getTime())) {
        return date;
    }

    return dateObject.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


/* ---------- Get Current Date ---------- */

function getCurrentDate() {

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


/* ---------- Show Message ---------- */

function showMessage(message, type = "success", container = null) {

    const messageBox = document.createElement("div");

    messageBox.className = `profile-message ${type}`;
    messageBox.textContent = message;

    if (container) {

        container.prepend(messageBox);

    } else {

        document.body.prepend(messageBox);

    }

    setTimeout(function () {

        messageBox.remove();

    }, 3000);

}


/* ---------- Loading Button ---------- */

function setButtonLoading(button, loading = true) {

    if (!button) {
        return;
    }

    if (loading) {

        button.dataset.originalText = button.innerHTML;

        button.innerHTML = "Please wait...";
        button.disabled = true;

    } else {

        button.innerHTML = button.dataset.originalText || "Submit";
        button.disabled = false;

    }

}


/* ---------- Local Storage Helpers ---------- */

function saveToStorage(key, value) {

    localStorage.setItem(key, JSON.stringify(value));

}


function getFromStorage(key, defaultValue = null) {

    const value = localStorage.getItem(key);

    if (value === null) {
        return defaultValue;
    }

    try {

        return JSON.parse(value);

    } catch (error) {

        return value;

    }

}


function removeFromStorage(key) {

    localStorage.removeItem(key);

}


/* ---------- Form Validation ---------- */

function validateRequiredFields(form) {

    if (!form) {
        return false;
    }

    const requiredFields = form.querySelectorAll("[required]");

    let valid = true;

    requiredFields.forEach(function (field) {

        if (!field.value.trim()) {

            field.classList.add("input-error");

            valid = false;

        } else {

            field.classList.remove("input-error");

        }

    });

    return valid;

}


/* ---------- Remove Input Error ---------- */

document.addEventListener("input", function (event) {

    if (event.target.classList.contains("input-error")) {

        if (event.target.value.trim()) {

            event.target.classList.remove("input-error");

        }

    }

});


/* ---------- Logout ---------- */

function logout() {

    const confirmed = window.confirm(
        "Are you sure you want to logout?"
    );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    window.location.href = "login.html";

}


/* ---------- Protect Dashboard Pages ---------- */

function checkLogin() {

    const token = localStorage.getItem("authToken");

    if (!token) {

        const currentPage = window.location.pathname.split("/").pop();

        const protectedPages = [
            "dashboard.html",
            "transaction.html",
            "add-transaction.html",
            "budget.html",
            "reports.html",
            "profile.html"
        ];

        if (protectedPages.includes(currentPage)) {

            window.location.href = "login.html";

        }

    }

}


/* ---------- Initialize ---------- */

document.addEventListener("DOMContentLoaded", function () {

    checkLogin();

});