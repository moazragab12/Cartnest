/**
 * Payment Methods Manager
 * Handles payment method selection and form display
 */

/**
 * Initialize the payment method popup system
 */
export function initPaymentMethods() {
  setupPaymentButtons();
  setupPopupEvents();
}

/**
 * Set up payment method selection buttons
 */
function setupPaymentButtons() {
  const paymentIcons = document.querySelectorAll(".payment-icons img");

  paymentIcons.forEach((icon) => {
    icon.addEventListener("click", function () {
      const paymentMethod = this.getAttribute("alt")
        .toLowerCase()
        .replace(" ", "-");
      showPaymentPopup(paymentMethod);
    });

    // Add visual feedback on hover
    icon.classList.add("payment-icon-interactive");
  });
}

/**
 * Set up event listeners for popup windows
 */
function setupPopupEvents() {
  // Close button event for all popups
  document.querySelectorAll(".payment-popup-close").forEach((button) => {
    button.addEventListener("click", hidePaymentPopups);
  });

  // Close popups when clicking outside
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("payment-popup-overlay")) {
      hidePaymentPopups();
    }
  });

  // Submit handler for payment forms and add payment messages
  document.querySelectorAll(".payment-form").forEach((form) => {
    form.addEventListener("submit", handlePaymentSubmit);

    // Add payment message to each form
    const paymentMessage = document.createElement("div");
    paymentMessage.className = "payment-message";
    paymentMessage.innerHTML =
      "<p>Secure payment • Fast checkout • Pay in a sec!</p>";

    // Insert before the submit button
    const submitButton = form.querySelector(".payment-submit");
    if (submitButton) {
      form.insertBefore(paymentMessage, submitButton);
    }
  });

  // ESC key to close popups
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hidePaymentPopups();
    }
  });
}

/**
 * Show payment popup for selected method
 * @param {string} method - Payment method id (e.g., 'visa', 'mastercard')
 */
function showPaymentPopup(method) {
  // Hide any open popups first
  hidePaymentPopups();

  // Find the matching popup
  const popup = document.getElementById(`${method}-popup`);
  if (!popup) return;

  // Show overlay and popup
  document.getElementById("payment-popup-overlay").classList.add("active");
  popup.classList.add("active");

  // Focus the first input field
  const firstInput = popup.querySelector("input");
  if (firstInput) {
    setTimeout(() => {
      firstInput.focus();
    }, 300);
  }

  // Disable scrolling on the body
  document.body.classList.add("popup-open");
}

/**
 * Hide all payment popups
 */
function hidePaymentPopups() {
  document.querySelectorAll(".payment-popup").forEach((popup) => {
    popup.classList.remove("active");
  });

  const overlay = document.getElementById("payment-popup-overlay");
  if (overlay) {
    overlay.classList.remove("active");
  }

  // Hide the payment result as well
  const resultElement = document.querySelector(".payment-result");
  if (resultElement) {
    resultElement.classList.remove("active");
  }

  // Re-enable scrolling
  document.body.classList.remove("popup-open");
}

/**
 * Handle payment form submission
 * @param {Event} event - Form submission event
 */
function handlePaymentSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const paymentMethod = form.getAttribute("data-payment-method");
  const formData = new FormData(form);

  // Validate form fields
  const isValid = validatePaymentForm(form, paymentMethod);

  if (isValid) {
    // Collect form data into an object
    const paymentData = {};
    formData.forEach((value, key) => {
      paymentData[key] = value;
    });

    // Process payment (in a real app, this would call an API)
    processPayment(paymentMethod, paymentData);
  }
}

/**
 * Validate payment form fields
 * @param {HTMLFormElement} form - The payment form
 * @param {string} method - Payment method
 * @returns {boolean} - Whether the form is valid
 */
function validatePaymentForm(form, method) {
  let isValid = true;
  const errorMessages = [];

  // Remove existing error messages
  form.querySelectorAll(".form-error").forEach((error) => error.remove());

  // Get all required inputs
  const requiredInputs = form.querySelectorAll("[required]");

  // Check each required field
  requiredInputs.forEach((input) => {
    input.classList.remove("input-error");

    if (!input.value.trim()) {
      isValid = false;
      input.classList.add("input-error");
      errorMessages.push(
        `${input.getAttribute("data-label") || input.name} is required.`
      );
    }
  });

  // Method-specific validations
  if (method === "visa" || method === "mastercard") {
    const cardNumber = form.querySelector('[name="card-number"]');
    const cvv = form.querySelector('[name="cvv"]');

    if (cardNumber && !validateCardNumber(cardNumber.value)) {
      isValid = false;
      cardNumber.classList.add("input-error");
      errorMessages.push("Invalid card number.");
    }

    if (cvv && !validateCVV(cvv.value)) {
      isValid = false;
      cvv.classList.add("input-error");
      errorMessages.push("Invalid CVV code.");
    }
  }

  // Display error messages if any
  if (errorMessages.length > 0) {
    const errorContainer = document.createElement("div");
    errorContainer.className = "form-error";
    errorContainer.innerHTML = errorMessages
      .map((msg) => `<p>${msg}</p>`)
      .join("");
    form.insertBefore(errorContainer, form.firstChild);
  }

  return isValid;
}

/**
 * Process the payment
 * @param {string} method - Payment method
 * @param {Object} data - Payment form data
 */
function processPayment(method, data) {
  // In a real app, this would make an API call

  // Show loading state
  showPaymentLoading(true);
  // Simulate API call with timeout
  setTimeout(() => {
    // Hide loading state
    showPaymentLoading(false);

    // Show success message with more engaging text
    displayPaymentResult(
      true,
      "Payment processed successfully! Your order is on its way! 🚀"
    );

    // Hide popups after success - allow more time to see the success message
    setTimeout(() => {
      hidePaymentPopups();
      redirectToOrderConfirmation();
    }, 3500); // Wait a bit longer than the auto-hide timeout (3000ms)
  }, 1800);
}

/**
 * Show/hide loading state during payment processing
 * @param {boolean} isLoading - Whether payment is being processed
 */
function showPaymentLoading(isLoading) {
  const loadingOverlay = document.querySelector(".payment-loading-overlay");
  if (!loadingOverlay) return;

  if (isLoading) {
    loadingOverlay.classList.add("active");
  } else {
    loadingOverlay.classList.remove("active");
  }
}

/**
 * Display payment result message
 * @param {boolean} success - Whether payment was successful
 * @param {string} message - Result message
 */
function displayPaymentResult(success, message) {
  const resultElement = document.querySelector(".payment-result");
  if (!resultElement) return;

  resultElement.textContent = message;
  resultElement.className = "payment-result";
  resultElement.classList.add(success ? "success" : "error");
  resultElement.classList.add("active");

  // Auto-hide the result after 3 seconds
  setTimeout(() => {
    resultElement.classList.remove("active");
  }, 3000);
}

/**
 * Redirect to order confirmation page after successful payment
 */
function redirectToOrderConfirmation() {
  // In a real app, this would redirect to an order confirmation page
  if (window.notifications) {
    window.notifications.success("Order placed successfully!");
  }

  // Simulate page transition
  const checkoutButton = document.querySelector(".checkout");
  if (checkoutButton) {
    checkoutButton.textContent = "✓ Order Placed";
    checkoutButton.classList.add("order-success");
    checkoutButton.disabled = true;
  }
}

/**
 * Validate credit card number using Luhn algorithm
 * @param {string} cardNumber - Credit card number
 * @returns {boolean} - Whether the card number is valid
 */
function validateCardNumber(cardNumber) {
  // Basic validation for demo purposes
  const sanitized = cardNumber.replace(/\D/g, "");
  return sanitized.length >= 13 && sanitized.length <= 19;
}

/**
 * Validate CVV code
 * @param {string} cvv - CVV code
 * @returns {boolean} - Whether the CVV is valid
 */
function validateCVV(cvv) {
  const sanitized = cvv.replace(/\D/g, "");
  return sanitized.length >= 3 && sanitized.length <= 4;
}
