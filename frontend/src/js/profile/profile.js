document.addEventListener("DOMContentLoaded", function () {
  // Navigation functionality
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".card-modern");

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetId = item.getAttribute("data-target");

      // Update active state on nav items
      navItems.forEach((navItem) => {
        navItem.classList.remove("active");
      });
      item.classList.add("active");

      // Scroll to section
      document.getElementById(targetId).scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  // Password toggle functionality
  const passwordToggles = document.querySelectorAll(".password-toggle");

  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const targetId = toggle.getAttribute("data-target");
      const passwordField = document.getElementById(targetId);
      const eyeOpen = toggle.querySelector(".eye-open");
      const eyeClosed = toggle.querySelector(".eye-closed");

      if (passwordField.type === "password") {
        passwordField.type = "text";
        eyeClosed.classList.add("hidden");
        eyeOpen.classList.remove("hidden");
      } else {
        passwordField.type = "password";
        eyeClosed.classList.remove("hidden");
        eyeOpen.classList.add("hidden");
      }
    });
  });

  // Form submission handlers
  const profileForm = document.getElementById("profile-form");
  const passwordForm = document.getElementById("password-form");
  const deleteForm = document.getElementById("delete-user-form");

  if (profileForm) {
    profileForm.addEventListener("submit", function (e) {
      e.preventDefault();
      // Simulate form submission
      const successMessage = document.getElementById(
        "profile-success-message"
      );
      successMessage.classList.add("visible");

      setTimeout(() => {
        successMessage.classList.remove("visible");
      }, 3000);
    });
  }

  // Password validation
  const passwordInput = document.getElementById("new_password");
  const confirmInput = document.getElementById("confirm_password");
  const matchFeedback = document.getElementById(
    "password-match-feedback"
  );

  // Password requirement elements
  const reqLength = document.getElementById("req-length");
  const reqUppercase = document.getElementById("req-uppercase");
  const reqNumber = document.getElementById("req-number");
  const reqSpecial = document.getElementById("req-special");

  // Function to update requirement status
  function updateRequirementStatus(element, isValid) {
    if (isValid) {
      element.classList.add("requirement-success");
      element.classList.remove("requirement-fail");
      element
        .querySelector(".requirement-icon svg")
        .classList.add("text-green-500");
      element
        .querySelector(".requirement-icon svg")
        .classList.remove("text-gray-400", "text-red-500");
      element.querySelector(".requirement-icon svg").innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />';
    } else {
      element.classList.add("requirement-fail");
      element.classList.remove("requirement-success");
      element
        .querySelector(".requirement-icon svg")
        .classList.add("text-red-500");
      element
        .querySelector(".requirement-icon svg")
        .classList.remove("text-gray-400", "text-green-500");
      element.querySelector(".requirement-icon svg").innerHTML =
        '<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />';
    }
  }

  // Check password requirements
  function checkPasswordRequirements(password) {
    // Length check - at least 8 characters
    const hasLength = password.length >= 8;
    updateRequirementStatus(reqLength, hasLength);

    // Uppercase check
    const hasUppercase = /[A-Z]/.test(password);
    updateRequirementStatus(reqUppercase, hasUppercase);

    // Number check
    const hasNumber = /[0-9]/.test(password);
    updateRequirementStatus(reqNumber, hasNumber);

    // Special character check
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    updateRequirementStatus(reqSpecial, hasSpecial);

    return hasLength && hasUppercase && hasNumber && hasSpecial;
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", function () {
      checkPasswordRequirements(this.value);

      // Check if passwords match
      if (confirmInput.value) {
        if (this.value !== confirmInput.value) {
          matchFeedback.classList.add("visible");
        } else {
          matchFeedback.classList.remove("visible");
        }
      }
    });
  }

  if (confirmInput) {
    confirmInput.addEventListener("input", function () {
      if (this.value !== passwordInput.value) {
        matchFeedback.classList.add("visible");
      } else {
        matchFeedback.classList.remove("visible");
      }
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Validate password match
      const newPassword = passwordInput.value;
      const confirmPassword = confirmInput.value;

      if (newPassword !== confirmPassword) {
        matchFeedback.classList.add("visible");
        return;
      }

      // Validate password requirements
      const requirementsMet = checkPasswordRequirements(newPassword);

      if (!requirementsMet) {
        alert("Please meet all password requirements");
        return;
      }

      matchFeedback.classList.remove("visible");

      // Simulate form submission
      const successMessage = document.getElementById(
        "password-success-message"
      );
      successMessage.classList.add("visible");

      setTimeout(() => {
        successMessage.classList.remove("visible");
      }, 3000);
    });
  }

  // Delete account button
  const deleteAccountBtn = document.getElementById("delete-account-btn");

  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener("click", function () {
      const password = document.getElementById("delete-password").value;
      const errorFeedback = document.getElementById(
        "delete-password-error"
      );

      if (!password) {
        errorFeedback.classList.add("visible");
        return;
      }

      // Show confirmation dialog
      if (
        confirm(
          "Are you sure you want to delete your account? This action cannot be undone."
        )
      ) {
        // Simulating account deletion
        alert(
          "Account scheduled for deletion. You will be logged out now."
        );
      }
    });
  }
});