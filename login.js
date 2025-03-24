
document.addEventListener("DOMContentLoaded", function () {
    function togglePasswordVisibility(toggleId, inputId) {
        const toggleIcon = document.getElementById(toggleId);
        const passwordInput = document.getElementById(inputId);

        toggleIcon.addEventListener("click", function () {
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                toggleIcon.classList.remove("fa-eye-slash");
                toggleIcon.classList.add("fa-eye");
            } else {
                passwordInput.type = "password";
                toggleIcon.classList.remove("fa-eye");
                toggleIcon.classList.add("fa-eye-slash");
            }
        });
    }

    togglePasswordVisibility("togglePassword", "password");
    togglePasswordVisibility("toggleRegPassword", "reg-password");
    togglePasswordVisibility("toggleConfirmPassword", "confirm-password");
});