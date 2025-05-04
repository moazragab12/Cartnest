import { authService, tokenManager } from "../core/api/index.js";

// DOM Elements
let registerForm;
let registerUsername;
let registerEmail;
let registerPassword;
let termsCheckbox;
let notificationOverlay;

document.addEventListener("DOMContentLoaded", () => {
  // Get form elements
  registerForm = document.querySelector(".form-box.register form");
  registerUsername = document.getElementById("register-username");
  registerEmail = document.getElementById("register-email");
  registerPassword = document.getElementById("register-password");
  termsCheckbox = document.getElementById("terms");
  notificationOverlay = document.getElementById("notification-overlay");

  // Attach event listener to the registration form
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegistration);
  }
});

// Function to handle registration form submission
async function handleRegistration(event) {
  event.preventDefault();

  // Get the button and form elements
  const button = registerForm.querySelector(".btn");
  const formBox = registerForm.closest(".form-box");
  const formElements = registerForm.querySelectorAll("input, button");

  // Remove any existing error messages
  removeMessages();

  // Show loading state but keep form visible
  button.classList.add("loading");
  button.querySelector("span").textContent = "Registering...";

  // Disable all form inputs but keep them visible
  formElements.forEach((el) => el.setAttribute("disabled", "disabled"));

  // Add a visual indicator that the form is processing
  formBox.classList.add("processing");

  try {
    // Get form values
    const username = registerUsername.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();

    // Form validation with specific messages
    if (!username && !email && !password) {
      showNotification("Please fill in all required fields.");
      resetFormState();
      return;
    } else if (!username) {
      showNotification("Please enter a username.");
      resetFormState();
      return;
    } else if (!email) {
      showNotification("Please enter your email address.");
      resetFormState();
      return;
    } else if (!password) {
      showNotification("Please create a password.");
      resetFormState();
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      showNotification("Please enter a valid email address.");
      resetFormState();
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      showNotification("Password must be at least 6 characters long.");
      resetFormState();
      return;
    }

    // Check if terms are accepted
    if (!termsCheckbox.checked) {
      showNotification("Please accept the terms and conditions to continue.");
      resetFormState();
      return;
    }

    // Call the registration API using our authService
    const response = await authService.register(username, email, password);

    // Debug logging - log the entire response structure
    console.log("Registration API Response:", response);

    // CRITICAL FIX: After successful registration, perform a login to ensure cookies are properly set
    try {
      console.log(
        "Performing auto-login after registration to set cookies properly"
      );
      // Use the authService to login
      const loginResponse = await authService.login(username, password);
      console.log("Auto-login successful, cookies should now be set properly");

      // Save auth cookies for backward compatibility
      saveAuthCookies(loginResponse, true);
    } catch (loginError) {
      // Even if auto-login fails, we can still continue as the local storage auth is set
      console.warn("Auto-login after registration failed:", loginError);
      // No need to show this error to the user as registration was successful
    }

    // Show success message overlay with blur effect
    showMessage("Registration successful! Welcome!", "success");

    // Redirect after successful registration (after showing success animation)
    setTimeout(() => {
      window.location.href = "../../index.html";
    }, 1200);
  } catch (error) {
    console.error("Registration error details:", error);

    // Convert technical error messages to user-friendly ones
    let userFriendlyMessage = getUserFriendlyErrorMessage(error);

    // Show error as a notification with blur effect
    showMessage(userFriendlyMessage, "error");
  } finally {
    // Always reset form state
    resetFormState();
  }
}

// Convert technical error messages to user-friendly ones
function getUserFriendlyErrorMessage(error) {
  // Extract actual error message from different error object structures
  let errorMessage = "";

  if (typeof error === "string") {
    errorMessage = error;
  } else if (error.message) {
    errorMessage = error.message;
  } else if (error.error) {
    errorMessage = error.error;
  } else if (error.detail) {
    errorMessage = error.detail;
  } else if (error.response && error.response.data) {
    errorMessage =
      typeof error.response.data === "string"
        ? error.response.data
        : JSON.stringify(error.response.data);
  } else {
    errorMessage = JSON.stringify(error);
  }

  // Log the full error for debugging
  console.debug("Registration error message:", errorMessage);

  // Check for specific registration errors with simple messages
  if (
    errorMessage.includes("email already registered") ||
    errorMessage.includes("email already exists") ||
    (errorMessage.includes("already taken") && errorMessage.includes("email"))
  ) {
    return "Email already exists";
  }

  if (
    errorMessage.includes("username already registered") ||
    errorMessage.includes("username already exists") ||
    (errorMessage.includes("already taken") &&
      errorMessage.includes("username"))
  ) {
    return "Username already exists";
  }

  if (
    errorMessage.includes("both username and email") ||
    errorMessage.includes("username and email already") ||
    errorMessage.includes("duplicate") ||
    errorMessage.includes("409") ||
    errorMessage.includes("conflict")
  ) {
    return "Account already exists";
  }

  if (
    errorMessage.includes("password") &&
    (errorMessage.includes("weak") ||
      errorMessage.includes("simple") ||
      errorMessage.includes("common") ||
      errorMessage.includes("requirements"))
  ) {
    return "Password too weak";
  }

  if (errorMessage.includes("validation") || errorMessage.includes("invalid")) {
    if (errorMessage.includes("email")) {
      return "Invalid email";
    } else if (errorMessage.includes("password")) {
      return "Invalid password";
    } else if (errorMessage.includes("username")) {
      return "Invalid username";
    } else {
      return "Invalid information";
    }
  }

  if (
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("NetworkError") ||
    errorMessage.includes("network") ||
    errorMessage.includes("connection")
  ) {
    return "Connection error";
  }

  if (
    errorMessage.includes("already read") ||
    errorMessage.includes("body stream")
  ) {
    return "Registration failed";
  }

  if (
    errorMessage.includes("too many") ||
    errorMessage.includes("rate limit")
  ) {
    return "Too many attempts";
  }

  // Default simple message
  return "Registration failed";
}

// Reset form to interactive state
function resetFormState() {
  const button = registerForm.querySelector(".btn");
  const formBox = registerForm.closest(".form-box");
  const formElements = registerForm.querySelectorAll("input, button");

  button.classList.remove("loading");
  button.querySelector("span").textContent = "Register";
  formElements.forEach((el) => el.removeAttribute("disabled"));
  formBox.classList.remove("processing");
}

// Save authentication cookies for backward compatibility
function saveAuthCookies(authData, rememberMe = true) {
  // Debug the authData to see what's actually coming from the API
  console.log("Auth data to save:", authData);

  // Use exact field names from the backend Token model
  const token = authData.access_token;
  let expiryDate = new Date(authData.expires_at);
  let expiryTime = expiryDate.getTime();

  // Validate token
  if (!token) {
    console.error("No valid token found in auth response:", authData);
    return false;
  }

  // Make sure we have a valid expiration date
  if (isNaN(expiryDate.getTime())) {
    console.error("Invalid expiry date in response, using default");
    expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 1 day if invalid
    expiryTime = expiryDate.getTime();
  }

  // Set cookies using a more direct approach
  // Convert date to proper format for cookies
  const expires = expiryDate.toUTCString();

  // Get current domain for cookie consistency
  const currentDomain = window.location.hostname;

  // Use the same keys as tokenManager for consistency
  const TOKEN_KEY = tokenManager.TOKEN_STORAGE.ACCESS_TOKEN;
  const TOKEN_EXPIRY_KEY = tokenManager.TOKEN_STORAGE.TOKEN_EXPIRY;

  // Set cookies with domain and path for maximum compatibility
  // Don't specify domain for localhost to ensure it works in development
  if (currentDomain === "localhost" || currentDomain === "127.0.0.1") {
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(
      token
    )}; expires=${expires}; path=/; SameSite=Lax`;
    document.cookie = `${TOKEN_EXPIRY_KEY}=${expiryTime}; expires=${expires}; path=/; SameSite=Lax`;
  } else {
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(
      token
    )}; expires=${expires}; domain=${currentDomain}; path=/; SameSite=Lax`;
    document.cookie = `${TOKEN_EXPIRY_KEY}=${expiryTime}; expires=${expires}; domain=${currentDomain}; path=/; SameSite=Lax`;
  }

  // Extra check - try to read cookies back immediately
  console.log("Current cookies after setting:", document.cookie);

  return true;
}

// Simple email validation
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Display notification message (at the bottom) for validation errors
function showNotification(message) {
  const errorContainer = document.getElementById("error-message");
  const errorText = errorContainer.querySelector("p");

  if (errorContainer && errorText) {
    // Remove blur effect for validation notifications
    // Don't activate the overlay for simple validation errors

    errorText.textContent = message;
    errorContainer.classList.add("show");

    // Auto hide after 5 seconds
    setTimeout(() => {
      errorContainer.classList.remove("show");
    }, 5000);

    // Add click handler to close button
    const closeBtn = errorContainer.querySelector(".close-error");
    if (closeBtn) {
      closeBtn.onclick = () => {
        errorContainer.classList.remove("show");
      };
    }
  } else {
    // Fallback to alert if container not found
    alert(message);
  }
}

// Display message overlay for success/backend errors
function showMessage(message, type = "error") {
  // Remove any existing messages first
  removeMessages();

  // Create message overlay (for background blur)
  const overlay = document.createElement("div");
  overlay.className = "message-overlay";
  document.body.appendChild(overlay);

  // Create message element
  const messageEl = document.createElement("div");
  messageEl.className =
    type === "success" ? "success-message" : "error-message-center";

  let content = "";
  if (type === "success") {
    content = `<p>${message}</p>`;
  } else {
    content = `
            <div class="error-icon">✕</div>
            <p>${message}</p>
            <button class="close-message">&times;</button>
        `;
  }

  messageEl.innerHTML = content;
  document.body.appendChild(messageEl);

  // Add click handler to close button for error messages
  if (type === "error") {
    const closeBtn = messageEl.querySelector(".close-message");
    if (closeBtn) {
      closeBtn.onclick = () => {
        messageEl.remove();
        overlay.remove();
      };
    }

    // Also close on overlay click for error messages
    overlay.addEventListener("click", () => {
      messageEl.remove();
      overlay.remove();
    });

    // Auto-hide error messages after 5 seconds
    setTimeout(() => {
      if (document.body.contains(messageEl)) {
        messageEl.remove();
        overlay.remove();
      }
    }, 5000);
  } else {
    // For success messages, just let the redirect handle cleanup
  }
}

// Remove any existing messages
function removeMessages() {
  const existingMessages = document.querySelectorAll(
    ".success-message, .error-message-center, .message-overlay"
  );
  existingMessages.forEach((msg) => msg.remove());

  // Also remove active class from notification overlay
  if (notificationOverlay) {
    notificationOverlay.classList.remove("active");
  }
}

// Export functions for potential use in other modules
export { handleRegistration };
