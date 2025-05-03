const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
})

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
})

document.addEventListener("DOMContentLoaded", function () {
    // Password visibility toggle
    const passwordToggles = document.querySelectorAll(".password-toggle");
    passwordToggles.forEach((toggle) => {
      toggle.addEventListener("click", function () {
        const passwordInput =
          this.previousElementSibling.previousElementSibling;
        if (passwordInput.type === "password") {
          passwordInput.type = "text";
          this.classList.remove("bx-hide");
          this.classList.add("bx-show");
        } else {
          passwordInput.type = "password";
          this.classList.remove("bx-show");
          this.classList.add("bx-hide");
        }
      });
    });

    // Close button functionality for error message container
    const errorContainer = document.getElementById('error-message');
    if (errorContainer) {
        const closeBtn = errorContainer.querySelector('.close-error');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                errorContainer.classList.remove('show');
            });
        }
    }
});