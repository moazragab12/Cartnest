/**
 * Authentication API for MarketPlace
 * This module reuses the generalized API system
 */

import { authService, tokenManager } from '../core/api/index.js';

// User registration function
async function registerUser(username, email, password) {
    try {
        return await authService.register(username, email, password);
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// User login function - uses the OAuth2 form format as required by the backend
async function loginUser(username, password) {
    try {
        return await authService.login(username, password);
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Get user profile information
async function getUserProfile(token) {
    try {
        return await authService.getUserProfile();
    } catch (error) {
        console.error('Get profile error:', error);
        throw error;
    }
}

// Refresh token function
async function refreshToken(token) {
    try {
        return await tokenManager.refreshAccessToken();
    } catch (error) {
        console.error('Token refresh error:', error);
        throw error;
    }
}

// Check token status
async function checkTokenStatus(token) {
    try {
        return await tokenManager.validateToken();
    } catch (error) {
        console.error('Token status check error:', error);
        throw error;
    }
}

// Export API functions
export {
    registerUser,
    loginUser,
    getUserProfile,
    refreshToken,
    checkTokenStatus
};