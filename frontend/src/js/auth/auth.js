// Main authentication module - imports and initializes all auth functionality

import { checkTokenStatus, refreshToken, getUserProfile } from './api.js';
import { clearAuthData } from './login.js';

// Token management constants
const TOKEN_KEY = 'authToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';
const USER_DATA_KEY = 'userData';

// Helper function to parse cookies
function getCookieValue(name) {
    const cookies = document.cookie.split(';')
        .map(cookie => cookie.trim().split('='))
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
    
    return cookies[name];
}

// Main authentication utility functions
const Auth = {
    // Check if user is authenticated
    isAuthenticated: () => {
        // Check cookies first
        const cookieToken = getCookieValue(TOKEN_KEY);
        const cookieExpiry = getCookieValue(TOKEN_EXPIRY_KEY);
        
        // Then check localStorage/sessionStorage
        const storageToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
        const storageExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY) || sessionStorage.getItem(TOKEN_EXPIRY_KEY);
        
        // Use cookie values or fall back to storage values
        const token = cookieToken || storageToken;
        const expiryTime = cookieExpiry || storageExpiry;
        
        if (!token || !expiryTime) {
            return false;
        }
        
        // Check if token is expired
        const now = new Date().getTime();
        return now < parseInt(expiryTime);
    },
    
    // Get the stored auth token
    getToken: () => {
        // Check cookies first, then fall back to storage
        return getCookieValue(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    },
    
    // Get user data
    getUserData: async () => {
        // Try to get from storage first
        const userData = localStorage.getItem(USER_DATA_KEY) || sessionStorage.getItem(USER_DATA_KEY);
        
        if (userData) {
            return JSON.parse(userData);
        }
        
        // If not in storage, fetch from API
        try {
            const token = Auth.getToken();
            if (!token) return null;
            
            const user = await getUserProfile(token);
            
            // Update storage with user data
            if (localStorage.getItem(TOKEN_KEY)) {
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
            } else {
                sessionStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
            }
            
            return user;
        } catch (error) {
            console.error('Error fetching user data:', error);
            return null;
        }
    },
    
    // Check if token needs refresh and refresh if needed
    checkAndRefreshToken: async () => {
        try {
            const token = Auth.getToken();
            if (!token) return false;
            
            // Check token status
            const statusResult = await checkTokenStatus(token);
            
            if (statusResult.about_to_expire) {
                // Token is about to expire, refresh it
                const refreshResult = await refreshToken(token);
                
                // Calculate expiry date for cookies
                const expiryDate = new Date(refreshResult.expires_at);
                
                // Update token in storage
                if (localStorage.getItem(TOKEN_KEY)) {
                    localStorage.setItem(TOKEN_KEY, refreshResult.access_token);
                    localStorage.setItem(TOKEN_EXPIRY_KEY, new Date(refreshResult.expires_at).getTime());
                    
                    // Also update cookies with expiration
                    document.cookie = `${TOKEN_KEY}=${refreshResult.access_token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
                    document.cookie = `${TOKEN_EXPIRY_KEY}=${expiryDate.getTime()}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
                } else {
                    sessionStorage.setItem(TOKEN_KEY, refreshResult.access_token);
                    sessionStorage.setItem(TOKEN_EXPIRY_KEY, new Date(refreshResult.expires_at).getTime());
                    
                    // Also update cookies (session cookies without expiration)
                    document.cookie = `${TOKEN_KEY}=${refreshResult.access_token}; path=/; SameSite=Strict`;
                    document.cookie = `${TOKEN_EXPIRY_KEY}=${expiryDate.getTime()}; path=/; SameSite=Strict`;
                }
                
                return true;
            }
            
            return statusResult.valid;
        } catch (error) {
            console.error('Error checking/refreshing token:', error);
            return false;
        }
    },
    
    // Logout the current user
    logout: () => {
        // Use the centralized function to clear all auth data
        clearAuthData();
        
        // Redirect to login page
        window.location.href = '../pages/auth/auth.html';
    }
};

// Check if we need to automatically redirect unauthorized users
document.addEventListener('DOMContentLoaded', () => {
    // Get the current path
    const currentPath = window.location.pathname;
    
    // This will only run on non-auth pages
    if (!currentPath.includes('/pages/auth/')) {
        if (!Auth.isAuthenticated()) {
            // Redirect to login page if not authenticated
            window.location.href = 'src/pages/auth/auth.html';
        } else {
            // If authenticated, periodically check if token needs refresh
            setInterval(Auth.checkAndRefreshToken, 300000); // Check every 5 minutes
        }
    }
});

// Export the Auth object for use in other files
export default Auth;