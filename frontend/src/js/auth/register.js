import { registerUser } from './api.js';

// Token storage keys
const TOKEN_KEY = 'authToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';
const USER_DATA_KEY = 'userData';

// DOM Elements
let registerForm;
let registerUsername;
let registerEmail;
let registerPassword;
let termsCheckbox;

document.addEventListener('DOMContentLoaded', () => {
    // Get form elements
    registerForm = document.querySelector('.form-box.register form');
    registerUsername = document.getElementById('register-username');
    registerEmail = document.getElementById('register-email');
    registerPassword = document.getElementById('register-password');
    termsCheckbox = document.getElementById('terms');

    // Attach event listener to the registration form
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
});

// Function to handle registration form submission
async function handleRegistration(event) {
    event.preventDefault();
    
    // Get the button and form elements
    const button = registerForm.querySelector('.btn');
    const formBox = registerForm.closest('.form-box');
    const formElements = registerForm.querySelectorAll('input, button');
    
    // Remove any existing error messages
    removeMessages();
    
    // Show loading state but keep form visible
    button.classList.add('loading');
    button.querySelector('span').textContent = 'Registering...';
    
    // Disable all form inputs but keep them visible
    formElements.forEach(el => el.setAttribute('disabled', 'disabled'));
    
    // Add a visual indicator that the form is processing
    formBox.classList.add('processing');
    
    try {
        // Get form values
        const username = registerUsername.value.trim();
        const email = registerEmail.value.trim();
        const password = registerPassword.value.trim();
        
        // Form validation
        if (!username || !email || !password) {
            showNotification('Please fill in all fields.');
            resetFormState();
            return;
        }
        
        // Validate email format
        if (!validateEmail(email)) {
            showNotification('Please enter a valid email address.');
            resetFormState();
            return;
        }
        
        // Check if terms are accepted
        if (!termsCheckbox.checked) {
            showNotification('Please accept the terms and conditions.');
            resetFormState();
            return;
        }
        
        // Call the registration API
        const response = await registerUser(username, email, password);
        
        // Debug logging - log the entire response structure
        console.log('Registration API Response:', response);
        
        // Save authentication data from registration response
        // Always save with remember me as true for new registrations
        const saved = saveAuthData(response, true);
        console.log('Auth data saved successfully:', saved);
        
        // CRITICAL FIX: After successful registration, perform a login to ensure cookies are properly set
        try {
            console.log('Performing auto-login after registration to set cookies properly');
            // Import the loginUser function directly to avoid circular dependencies
            const { loginUser } = await import('./api.js');
            const loginResponse = await loginUser(username, password);
            console.log('Auto-login successful, cookies should now be set properly');
            
            // Save auth data from login response which should properly set cookies
            saveAuthData(loginResponse, true);
            
        } catch (loginError) {
            // Even if auto-login fails, we can still continue as the local storage auth is set
            console.warn('Auto-login after registration failed:', loginError);
            // No need to show this error to the user as registration was successful
        }
        
        // Show success message overlay (not affecting the form visibility)
        showMessage('Registration successful! Redirecting...', 'success');
        
        // Redirect after successful registration (faster redirection)
        setTimeout(() => {
            window.location.href = '../../../index.html';
        }, 800);
        
    } catch (error) {
        // Show error as a notification (not affecting the form visibility)
        console.error('Registration error details:', error);
        showMessage(error.message || 'Registration failed. Please try again.', 'error');
    } finally {
        // Always reset form state
        resetFormState();
    }
}

// Reset form to interactive state
function resetFormState() {
    const button = registerForm.querySelector('.btn');
    const formBox = registerForm.closest('.form-box');
    const formElements = registerForm.querySelectorAll('input, button');
    
    button.classList.remove('loading');
    button.querySelector('span').textContent = 'Register';
    formElements.forEach(el => el.removeAttribute('disabled'));
    formBox.classList.remove('processing');
}

// Save authentication data to storage and set cookies
function saveAuthData(authData, rememberMe = true) {
    // Debug the authData to see what's actually coming from the API
    console.log('Auth data to save:', authData);
    
    // Use exact field names from the backend Token model
    const token = authData.access_token;
    let expiryDate = new Date(authData.expires_at);
    let expiryTime = expiryDate.getTime();
    
    // Validate token
    if (!token) {
        console.error('No valid token found in auth response:', authData);
        return false;
    }
    
    // Make sure we have a valid expiration date
    if (isNaN(expiryDate.getTime())) {
        console.error('Invalid expiry date in response, using default');
        expiryDate = new Date(Date.now() + 24*60*60*1000); // Default 1 day if invalid
        expiryTime = expiryDate.getTime();
    }
    
    // Store in localStorage or sessionStorage based on rememberMe flag
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // Store in browser storage
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(TOKEN_EXPIRY_KEY, expiryTime);
    
    // Optionally store user info if available
    if (authData.user) {
        storage.setItem(USER_DATA_KEY, JSON.stringify(authData.user));
    }
    
    // Set cookies using a more direct approach for maximum compatibility
    // Convert date to proper format for cookies
    const expires = expiryDate.toUTCString();
    
    // Get current domain for cookie consistency
    const currentDomain = window.location.hostname;
    
    // Set cookies with domain and path for maximum compatibility
    // Don't specify domain for localhost to ensure it works in development
    if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
        document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Lax`;
        document.cookie = `${TOKEN_EXPIRY_KEY}=${expiryTime}; expires=${expires}; path=/; SameSite=Lax`;
    } else {
        document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; expires=${expires}; domain=${currentDomain}; path=/; SameSite=Lax`;
        document.cookie = `${TOKEN_EXPIRY_KEY}=${expiryTime}; expires=${expires}; domain=${currentDomain}; path=/; SameSite=Lax`;
    }
    
    // Extra check - try to read cookies back immediately
    console.log('Current cookies after setting:', document.cookie);
    
    return true;
}

// Simple email validation
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Display notification message (at the bottom) for validation errors
function showNotification(message) {
    const errorContainer = document.getElementById('error-message');
    const errorText = errorContainer.querySelector('p');
    
    if (errorContainer && errorText) {
        errorText.textContent = message;
        errorContainer.classList.add('show');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            errorContainer.classList.remove('show');
        }, 5000);
    } else {
        // Fallback to alert if container not found
        alert(message);
    }
}

// Display message overlay for success/backend errors
function showMessage(message, type = 'error') {
    // Remove any existing messages first
    removeMessages();
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = type === 'success' ? 'success-message' : 'error-message-center';
    
    let content = '';
    if (type === 'success') {
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
    if (type === 'error') {
        const closeBtn = messageEl.querySelector('.close-message');
        if (closeBtn) {
            closeBtn.onclick = () => {
                messageEl.remove();
            };
        }
        
        // Auto-hide error messages after 5 seconds
        setTimeout(() => {
            if (document.body.contains(messageEl)) {
                messageEl.remove();
            }
        }, 5000);
    }
}

// Remove any existing messages
function removeMessages() {
    const existingMessages = document.querySelectorAll('.success-message, .error-message-center');
    existingMessages.forEach(msg => msg.remove());
}

// Export functions for potential use in other modules
export { handleRegistration };