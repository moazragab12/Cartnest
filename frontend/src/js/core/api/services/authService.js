/**
 * Authentication Service for MarketPlace
 * Implements authentication-specific API functions
 */

import apiClient from '../apiClient.js';
import API_ENDPOINTS from '../endpoints.js';
import { saveTokens, clearTokens } from '../tokenManager.js';

/**
 * Register a new user
 * @param {string} username - User's username
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise<object>} Registration response
 */
const register = async (username, email, password) => {
    try {
        return await apiClient.post(API_ENDPOINTS.auth.register, {
            username,
            email,
            password
        }, { skipAuth: true });
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

/**
 * Login a user using OAuth2 password flow
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Promise<object>} Login response with tokens
 */
const login = async (username, password) => {
    try {
        // Create form data for OAuth2 password flow
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await apiClient.post(API_ENDPOINTS.auth.login, formData, {
            skipAuth: true
        });
        
        // Save tokens to localStorage
        saveTokens(response);
        
        return response;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

/**
 * Get the current user's profile
 * @returns {Promise<object>} User profile data
 */
const getUserProfile = async () => {
    try {
        return await apiClient.get(API_ENDPOINTS.auth.profile);
    } catch (error) {
        console.error('Get profile error:', error);
        throw error;
    }
};

/**
 * Log out the current user
 */
const logout = () => {
    clearTokens();
};

export {
    register,
    login,
    getUserProfile,
    logout
};