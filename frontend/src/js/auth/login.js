import { loginUser } from './api.js';

// Token storage keys
const TOKEN_KEY = 'authToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';
const USER_DATA_KEY = 'userData';

// DOM Elements
let loginForm;
let loginUsername;
let loginPassword;
let rememberMeCheckbox;

document.addEventListener('DOMContentLoaded', () => {
    // Get form elements
    loginForm = document.querySelector('.form-box.login form');
    loginUsername = document.getElementById('login-username');
    loginPassword = document.getElementById('login-password');
    rememberMeCheckbox = document.getElementById('remember-me');

    // Attach event listener to the login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Check for existing token on page load
    checkExistingAuth();
});

// Function to handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    // Get the button and form elements
    const button = loginForm.querySelector('.btn');
    const formBox = loginForm.closest('.form-box');
    const formElements = loginForm.querySelectorAll('input, button');
    
    // Remove any existing error messages
    removeMessages();
    
    // Show loading state but keep form visible
    button.classList.add('loading');
    button.querySelector('span').textContent = 'Logging in...';
    
    // Disable all form inputs but keep them visible
    formElements.forEach(el => el.setAttribute('disabled', 'disabled'));
    
    // Add a visual indicator that the form is processing
    formBox.classList.add('processing');
    
    try {
        // Get form values
        const username = loginUsername.value.trim();
        const password = loginPassword.value.trim();
        
        // Form validation
        if (!username || !password) {
            showNotification('Please enter both username and password.');
            resetFormState();
            return;
        }
        
        // Call the login API
        const response = await loginUser(username, password);
        
        // Store authentication data
        saveAuthData(response, rememberMeCheckbox.checked);
        
        // Show success message overlay (not affecting the form visibility)
        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect after successful login (after showing success animation)
        // Reduced timeout for faster redirection
        setTimeout(() => {
            window.location.href = '../../../index.html';
        }, 800);
        
    } catch (error) {
        // Show error as a notification (not affecting the form visibility)
        showMessage(error.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
        // Always reset form state
        resetFormState();
    }
}

// Reset form to interactive state
function resetFormState() {
    const button = loginForm.querySelector('.btn');
    const formBox = loginForm.closest('.form-box');
    const formElements = loginForm.querySelectorAll('input, button');
    
    button.classList.remove('loading');
    button.querySelector('span').textContent = 'Login';
    formElements.forEach(el => el.removeAttribute('disabled'));
    formBox.classList.remove('processing');
}

// Save authentication data to storage and set cookies
function saveAuthData(authData, rememberMe) {
    // Debug the authData
    console.log('Login - Auth data to save:', authData);
    
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
    
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // Store in browser storage
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(TOKEN_EXPIRY_KEY, expiryTime);
    
    // Optionally store user info if available
    if (authData.user) {
        storage.setItem(USER_DATA_KEY, JSON.stringify(authData.user));
    }
    
    // Set cookies using a more direct approach
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
    console.log('Current cookies after login:', document.cookie);
    
    return true;
}

// Check if user is already authenticated
function checkExistingAuth() {
    // First check cookies
    const cookies = document.cookie.split(';')
        .map(cookie => cookie.trim().split('='))
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
    
    const cookieToken = cookies[TOKEN_KEY];
    const cookieExpiry = cookies[TOKEN_EXPIRY_KEY];
    
    // Then check storage
    const storageToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    const storageExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY) || sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    
    // Use cookie values or fall back to storage values
    const token = cookieToken || storageToken;
    const expiryTime = cookieExpiry || storageExpiry;
    
    if (token && expiryTime) {
        // Check if token is still valid (not expired)
        const now = new Date().getTime();
        if (now < parseInt(expiryTime)) {
            // Valid token exists, redirect to homepage
            window.location.href = '../../../index.html';
        } else {
            // Token expired, clear it
            clearAuthData();
        }
    }
}

// Clear all auth data (cookies and storage)
function clearAuthData() {
    // Clear localStorage and sessionStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    sessionStorage.removeItem(USER_DATA_KEY);
    
    // Get current domain for cookie consistency
    const currentDomain = window.location.hostname;
    
    // Clear cookies by setting expiration in the past
    // For localhost
    if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
        document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
        document.cookie = `${TOKEN_EXPIRY_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    } else {
        // For other domains
        document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${currentDomain}; path=/; SameSite=Lax`;
        document.cookie = `${TOKEN_EXPIRY_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${currentDomain}; path=/; SameSite=Lax`;
    }
    
    console.log('Cleared auth data. Current cookies:', document.cookie);
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
export { handleLogin, checkExistingAuth, clearAuthData };