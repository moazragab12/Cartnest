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

    // Form submission with loading animation
    const forms = document.querySelectorAll("form");
    forms.forEach((form) => {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        const button = this.querySelector(".btn");
        button.classList.add("loading");

        // Simulate form submission
        setTimeout(() => {
          button.classList.remove("loading");
          const formBox = this.closest(".form-box");
          formBox.classList.add("success");
        }, 1500);
      });
    });
  });