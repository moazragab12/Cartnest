import { authService, tokenManager } from '../core/api/index.js';

// DOM Elements
let loginForm;
let loginUsername;
let loginPassword;
let rememberMeCheckbox;
let notificationOverlay;

document.addEventListener('DOMContentLoaded', () => {
    // Get form elements
    loginForm = document.querySelector('.form-box.login form');
    loginUsername = document.getElementById('login-username');
    loginPassword = document.getElementById('login-password');
    rememberMeCheckbox = document.getElementById('remember-me');
    notificationOverlay = document.getElementById('notification-overlay');

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
        if (!username && !password) {
            showNotification('Please enter your username and password.');
            resetFormState();
            return;
        } else if (!username) {
            showNotification('Please enter your username.');
            resetFormState();
            return;
        } else if (!password) {
            showNotification('Please enter your password.');
            resetFormState();
            return;
        }
        
        // Call the login API using our authService
        const response = await authService.login(username, password);
        
        // The token is already saved by the authService.login method
        // But we still need to handle cookies for backward compatibility
        saveAuthCookies(response, rememberMeCheckbox.checked);
        
        // Show success message overlay with blur effect
        showMessage('Login successful! Welcome back.', 'success');
        
        // Redirect after successful login (after showing success animation)
        setTimeout(() => {
            window.location.href = '../../../index.html';
        }, 1200);
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Convert technical error messages to user-friendly ones
        let userFriendlyMessage = getUserFriendlyErrorMessage(error);
        
        // Show error as a notification with blur effect
        showMessage(userFriendlyMessage, 'error');
    } finally {
        // Always reset form state
        resetFormState();
    }
}

// Convert technical error messages to user-friendly ones
function getUserFriendlyErrorMessage(error) {
    // Extract actual error message from different error object structures
    let errorMessage = '';
    
    if (typeof error === 'string') {
        errorMessage = error;
    } else if (error.message) {
        errorMessage = error.message;
    } else if (error.error) {
        errorMessage = error.error;
    } else if (error.detail) {
        errorMessage = error.detail;
    } else if (error.response && error.response.data) {
        errorMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : JSON.stringify(error.response.data);
    } else {
        errorMessage = JSON.stringify(error);
    }
    
    // Common login error patterns and their simple user-friendly equivalents
    if (errorMessage.includes('401') || 
        errorMessage.includes('Unauthorized') || 
        errorMessage.includes('invalid_credentials')) {
        return 'Invalid username or password';
    }
    
    if (errorMessage.includes('not found') || 
        errorMessage.includes('404') || 
        errorMessage.includes('user not found')) {
        return 'Account not found';
    }
    
    if (errorMessage.includes('inactive') || 
        errorMessage.includes('disabled') || 
        errorMessage.includes('locked')) {
        return 'Account is locked';
    }

    if (errorMessage.includes('token') || 
        errorMessage.includes('session')) {
        return 'Session expired';
    }
    
    if (errorMessage.includes('too many') || 
        errorMessage.includes('rate limit') ||
        errorMessage.includes('try again later')) {
        return 'Too many attempts';
    }
    
    if (errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') || 
        errorMessage.includes('network') ||
        errorMessage.includes('connection')) {
        return 'Connection error';
    }
    
    if (errorMessage.includes('already read') || 
        errorMessage.includes('body stream')) {
        return 'Login failed';
    }
    
    // Default simple message
    return 'Login failed';
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

// Save authentication cookies for backward compatibility
function saveAuthCookies(authData, rememberMe) {
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
    
    // Set cookies using a more direct approach
    // Convert date to proper format for cookies
    const expires = expiryDate.toUTCString();
    
    // Get current domain for cookie consistency
    const currentDomain = window.location.hostname;
    
    // Use the same keys as tokenManager for consistency
    const TOKEN_KEY = tokenManager.TOKEN_STORAGE.ACCESS_TOKEN;
    const TOKEN_EXPIRY_KEY = tokenManager.TOKEN_STORAGE.TOKEN_EXPIRY;
    
    // Set cookies with domain and path for maximum compatibility
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
    // First check if token exists in our token manager
    const token = tokenManager.getAccessToken();
    
    if (token && !tokenManager.isTokenExpired()) {
        // Valid token exists, redirect to homepage
        window.location.href = '../../../index.html';
    }
    
    // Backward compatibility - check cookies
    const cookies = document.cookie.split(';')
        .map(cookie => cookie.trim().split('='))
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
    
    const TOKEN_KEY = tokenManager.TOKEN_STORAGE.ACCESS_TOKEN;
    const TOKEN_EXPIRY_KEY = tokenManager.TOKEN_STORAGE.TOKEN_EXPIRY;
    
    const cookieToken = cookies[TOKEN_KEY];
    const cookieExpiry = cookies[TOKEN_EXPIRY_KEY];
    
    if (cookieToken && cookieExpiry) {
        // Check if token is still valid (not expired)
        const now = new Date().getTime();
        if (now < parseInt(cookieExpiry)) {
            // Save token to our new token manager system
            localStorage.setItem(TOKEN_KEY, cookieToken);
            localStorage.setItem(TOKEN_EXPIRY_KEY, cookieExpiry);
            
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
    // Use our tokenManager to clear tokens
    tokenManager.clearTokens();
    
    // Also clear cookies for backward compatibility
    // Get current domain for cookie consistency
    const currentDomain = window.location.hostname;
    
    const TOKEN_KEY = tokenManager.TOKEN_STORAGE.ACCESS_TOKEN;
    const TOKEN_EXPIRY_KEY = tokenManager.TOKEN_STORAGE.TOKEN_EXPIRY;
    
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
        // Remove blur effect for validation notifications
        // Don't activate the overlay for simple validation errors
        
        errorText.textContent = message;
        errorContainer.classList.add('show');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            errorContainer.classList.remove('show');
        }, 5000);
        
        // Add click handler to close button
        const closeBtn = errorContainer.querySelector('.close-error');
        if (closeBtn) {
            closeBtn.onclick = () => {
                errorContainer.classList.remove('show');
            };
        }
    } else {
        // Fallback to alert if container not found
        alert(message);
    }
}

// Display message overlay for success/backend errors
function showMessage(message, type = 'error') {
    // Remove any existing messages first
    removeMessages();
    
    // Create message overlay (for background blur)
    const overlay = document.createElement('div');
    overlay.className = 'message-overlay';
    document.body.appendChild(overlay);
    
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
                overlay.remove();
            };
        }
        
        // Also close on overlay click for error messages
        overlay.addEventListener('click', () => {
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
    const existingMessages = document.querySelectorAll('.success-message, .error-message-center, .message-overlay');
    existingMessages.forEach(msg => msg.remove());
    
    // Also remove active class from notification overlay
    if (notificationOverlay) {
        notificationOverlay.classList.remove('active');
    }
}

// Export functions for potential use in other modules
export { handleLogin, checkExistingAuth, clearAuthData };