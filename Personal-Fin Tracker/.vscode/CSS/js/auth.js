/* =========================================================
   AUTHENTICATION JAVASCRIPT
   Personal Finance Tracker
   File: frontend/js/auth.js
   ========================================================= */


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    // Login page
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        initializeLogin();
    }

    // Register page
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        initializeRegister();
    }

    // Password visibility buttons
    initializePasswordToggles();

    // Clear error messages when user starts typing
    initializeInputValidation();
});


/* =========================================================
   LOGIN
   ========================================================= */

function initializeLogin() {

    const loginForm = document.getElementById("loginForm");

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        clearFormErrors();

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const rememberInput = document.getElementById("remember");

        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const remember = rememberInput ? rememberInput.checked : false;

        let isValid = true;


        // Validate email
        if (email === "") {
            showFieldError(emailInput, "Email is required.");
            isValid = false;
        }
        else if (!isValidEmail(email)) {
            showFieldError(emailInput, "Please enter a valid email address.");
            isValid = false;
        }


        // Validate password
        if (password === "") {
            showFieldError(passwordInput, "Password is required.");
            isValid = false;
        }


        if (!isValid) {
            return;
        }


        // Show loading state
        const submitButton = loginForm.querySelector("button[type='submit']");

        if (submitButton) {
            setButtonLoading(submitButton, true);
        }


        /*
         * DEMO LOGIN
         *
         * This temporary login allows frontend testing.
         * Later, replace this section with a fetch()
         * request to your Flask backend.
         */

        setTimeout(async function () {

            try {
                const response = await apiRequest("/api/auth/login", {
                    method: "POST",
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });

                const user = response && response.data;

                if (user && user.email) {
                    saveToStorage("financeUser", {
                        name: user.name,
                        email: user.email
                    });
                    saveToStorage("authToken", "backend_session");

                    if (remember) {
                        localStorage.setItem("rememberLogin", "true");
                    } else {
                        localStorage.removeItem("rememberLogin");
                    }

                    showMessage(
                        "Login successful. Redirecting...",
                        "success"
                    );

                    setTimeout(function () {
                        window.location.href = "dashboard.html";
                    }, 800);

                    if (submitButton) {
                        setButtonLoading(submitButton, false);
                    }
                    return;
                }
            } catch (error) {
                // Continue with local demo login when the API is unavailable.
            }

            const savedUser = getFromStorage("financeUser");

            let loginSuccessful = false;

            if (savedUser) {

                if (
                    savedUser.email === email &&
                    savedUser.password === password
                ) {
                    loginSuccessful = true;
                }

            }


            /*
             * Demo account
             *
             * Email: demo@example.com
             * Password: Demo@123
             */

            if (
                email === "demo@example.com" &&
                password === "Demo@123"
            ) {
                loginSuccessful = true;

                saveToStorage("financeUser", {
                    name: "Demo User",
                    email: email,
                    password: password
                });
            }


            if (loginSuccessful) {

                // Create temporary login token
                const token = "demo_token_" + Date.now();

                saveToStorage("authToken", token);

                // Remember login if selected
                if (remember) {
                    localStorage.setItem("rememberLogin", "true");
                }
                else {
                    localStorage.removeItem("rememberLogin");
                }


                showMessage(
                    "Login successful. Redirecting...",
                    "success"
                );


                setTimeout(function () {
                    window.location.href = "dashboard.html";
                }, 800);

            }
            else {

                showMessage(
                    "Invalid email or password.",
                    "error"
                );

            }


            if (submitButton) {
                setButtonLoading(submitButton, false);
            }

        }, 700);

    });
}


/* =========================================================
   REGISTER
   ========================================================= */

function initializeRegister() {

    const registerForm = document.getElementById("registerForm");

    registerForm.addEventListener("submit", function (event) {

        event.preventDefault();

        clearFormErrors();

        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const confirmPasswordInput =
            document.getElementById("confirmPassword");

        const name = nameInput ? nameInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const confirmPassword =
            confirmPasswordInput ? confirmPasswordInput.value : "";

        let isValid = true;


        // Name validation
        if (name === "") {

            showFieldError(
                nameInput,
                "Full name is required."
            );

            isValid = false;

        }
        else if (name.length < 3) {

            showFieldError(
                nameInput,
                "Name must contain at least 3 characters."
            );

            isValid = false;
        }


        // Email validation
        if (email === "") {

            showFieldError(
                emailInput,
                "Email is required."
            );

            isValid = false;

        }
        else if (!isValidEmail(email)) {

            showFieldError(
                emailInput,
                "Please enter a valid email address."
            );

            isValid = false;
        }


        // Password validation
        if (password === "") {

            showFieldError(
                passwordInput,
                "Password is required."
            );

            isValid = false;

        }
        else if (password.length < 6) {

            showFieldError(
                passwordInput,
                "Password must contain at least 6 characters."
            );

            isValid = false;
        }


        // Confirm password
        if (confirmPassword === "") {

            showFieldError(
                confirmPasswordInput,
                "Please confirm your password."
            );

            isValid = false;

        }
        else if (password !== confirmPassword) {

            showFieldError(
                confirmPasswordInput,
                "Passwords do not match."
            );

            isValid = false;
        }


        if (!isValid) {
            return;
        }


        // Check whether email already exists
        const existingUser = getFromStorage("financeUser");

        if (
            existingUser &&
            existingUser.email === email
        ) {

            showMessage(
                "An account with this email already exists.",
                "error"
            );

            return;
        }


        const submitButton =
            registerForm.querySelector("button[type='submit']");

        if (submitButton) {
            setButtonLoading(submitButton, true);
        }


        /*
         * TEMPORARY FRONTEND REGISTRATION
         *
         * This will later be replaced by a Flask API request.
         */

        setTimeout(function () {

            const user = {
                name: name,
                email: email,
                password: password,
                createdAt: new Date().toISOString()
            };


            // Save user locally for frontend testing
            saveToStorage("financeUser", user);


            // Create login token
            const token = "demo_token_" + Date.now();

            saveToStorage("authToken", token);


            showMessage(
                "Account created successfully!",
                "success"
            );


            setTimeout(function () {
                window.location.href = "dashboard.html";
            }, 900);


            if (submitButton) {
                setButtonLoading(submitButton, false);
            }

        }, 700);

    });
}


/* =========================================================
   PASSWORD VISIBILITY
   ========================================================= */

function initializePasswordToggles() {

    /*
     * Supports buttons such as:
     *
     * <button type="button" class="password-toggle">
     *     Show
     * </button>
     */

    const toggleButtons =
        document.querySelectorAll(".password-toggle");


    toggleButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const wrapper = button.closest(".password-wrapper");

            if (!wrapper) {
                return;
            }

            const input =
                wrapper.querySelector("input");

            if (!input) {
                return;
            }


            if (input.type === "password") {

                input.type = "text";

                button.textContent = "Hide";

            }
            else {

                input.type = "password";

                button.textContent = "Show";

            }

        });

    });
}


/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function isValidEmail(email) {

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email);
}


/* =========================================================
   FIELD ERROR
   ========================================================= */

function showFieldError(input, message) {

    if (!input) {
        return;
    }


    input.classList.add("input-error");


    /*
     * Find existing error element
     */

    let errorElement =
        input.parentElement.querySelector(".form-error");


    if (!errorElement) {

        errorElement =
            document.createElement("small");

        errorElement.className = "form-error";

        input.parentElement.appendChild(errorElement);

    }


    errorElement.textContent = message;
}


/* =========================================================
   CLEAR FORM ERRORS
   ========================================================= */

function clearFormErrors() {

    const errorInputs =
        document.querySelectorAll(".input-error");

    errorInputs.forEach(function (input) {
        input.classList.remove("input-error");
    });


    const errorMessages =
        document.querySelectorAll(".form-error");

    errorMessages.forEach(function (error) {

        /*
         * Keep permanent error elements if they
         * were already part of the HTML.
         */

        error.textContent = "";

    });
}


/* =========================================================
   CLEAR ERROR WHILE TYPING
   ========================================================= */

function initializeInputValidation() {

    const inputs =
        document.querySelectorAll(
            ".auth-form input"
        );


    inputs.forEach(function (input) {

        input.addEventListener("input", function () {

            input.classList.remove("input-error");


            const errorElement =
                input.parentElement.querySelector(
                    ".form-error"
                );


            if (errorElement) {
                errorElement.textContent = "";
            }

        });

    });
}


/* =========================================================
   PASSWORD STRENGTH
   ========================================================= */

function getPasswordStrength(password) {

    if (!password) {
        return "empty";
    }


    let score = 0;


    if (password.length >= 6) {
        score++;
    }

    if (password.length >= 10) {
        score++;
    }

    if (/[A-Z]/.test(password)) {
        score++;
    }

    if (/[0-9]/.test(password)) {
        score++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        score++;
    }


    if (score <= 1) {
        return "weak";
    }

    if (score <= 3) {
        return "medium";
    }

    return "strong";
}


/* =========================================================
   LOGOUT
   ========================================================= */

function authLogout() {

    localStorage.removeItem("authToken");
    localStorage.removeItem("rememberLogin");

    window.location.href = "login.html";
}


/* =========================================================
   CHECK AUTHENTICATION
   ========================================================= */

function isUserLoggedIn() {

    const token =
        localStorage.getItem("authToken");

    return !!token;
}


/* =========================================================
   REDIRECT IF LOGGED IN
   ========================================================= */

function redirectIfLoggedIn() {

    if (isUserLoggedIn()) {

        const currentPage =
            window.location.pathname
                .split("/")
                .pop();


        if (
            currentPage === "login.html" ||
            currentPage === "register.html"
        ) {

            window.location.href =
                "dashboard.html";
        }

    }
}


/* =========================================================
   GET CURRENT USER
   ========================================================= */

function getCurrentUser() {

    return getFromStorage("financeUser");
}


/* =========================================================
   AUTO CHECK AUTH PAGE
   ========================================================= */

redirectIfLoggedIn();