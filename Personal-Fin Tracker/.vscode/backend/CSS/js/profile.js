document.addEventListener("DOMContentLoaded", function () {
    const profileForm = document.getElementById("profileForm");
    const user = getCurrentUser();

    if (!profileForm || !user) {
        return;
    }

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");

    nameInput.value = user.name || "";
    emailInput.value = user.email || "";
    phoneInput.value = user.phone || "";
    updateProfileSummary(user);

    profileForm.addEventListener("submit", function (event) {
        event.preventDefault();
        clearFormErrors();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();

        if (!name) {
            showFieldError(nameInput, "Full name is required.");
            return;
        }

        if (!isValidEmail(email)) {
            showFieldError(emailInput, "Please enter a valid email address.");
            return;
        }

        const updatedUser = {
            ...user,
            name: name,
            email: email,
            phone: phone
        };

        saveToStorage("financeUser", updatedUser);
        updateProfileSummary(updatedUser);
        showMessage("Profile details saved successfully.", "success");
    });
});

function updateProfileSummary(user) {
    const nameElement = document.getElementById("profileName");
    const emailElement = document.getElementById("profileEmail");
    const avatarElement = document.getElementById("profileAvatar");

    if (nameElement) {
        nameElement.textContent = user.name || "Your profile";
    }

    if (emailElement) {
        emailElement.textContent = user.email || "";
    }

    if (avatarElement) {
        avatarElement.textContent = (user.name || "U").charAt(0).toUpperCase();
    }
}
