/**
 * Token Manager for MarketPlace
 * Handles token storage, validation, and refresh operations
 */

import apiClient from './apiClient.js';
import API_ENDPOINTS from './endpoints.js';

// Token storage keys
const TOKEN_STORAGE = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    TOKEN_EXPIRY: 'tokenExpiry'
};

/**
 * Save authentication tokens to local storage
 * @param {object} tokenData - Object containing access_token, refresh_token, and token_type
 */
const saveTokens = (tokenData) => {
    if (tokenData.access_token) {
        localStorage.setItem(TOKEN_STORAGE.ACCESS_TOKEN, tokenData.access_token);
    }
    
    if (tokenData.refresh_token) {
        localStorage.setItem(TOKEN_STORAGE.REFRESH_TOKEN, tokenData.refresh_token);
    }
    
    // Set token expiry time (default to 15 minutes if not specified)
    const expirySeconds = tokenData.expires_in || 15 * 60;
    const expiryTime = Date.now() + expirySeconds * 1000;
    localStorage.setItem(TOKEN_STORAGE.TOKEN_EXPIRY, expiryTime.toString());
};

/**
 * Get the stored access token
 * @returns {string|null} The access token or null if not found
 */
const getAccessToken = () => {
    return localStorage.getItem(TOKEN_STORAGE.ACCESS_TOKEN);
};

/**
 * Get the stored refresh token
 * @returns {string|null} The refresh token or null if not found
 */
const getRefreshToken = () => {
    return localStorage.getItem(TOKEN_STORAGE.REFRESH_TOKEN);
};

/**
 * Check if the access token is expired or about to expire
 * @param {number} bufferSeconds - Seconds before actual expiry to consider token as expired
 * @returns {boolean} True if token is expired or about to expire, false otherwise
 */
const isTokenExpired = (bufferSeconds = 60) => {
    const expiryTime = localStorage.getItem(TOKEN_STORAGE.TOKEN_EXPIRY);
    if (!expiryTime) return true;
    
    // Consider token expired if we're within buffer seconds of expiry
    return parseInt(expiryTime) - bufferSeconds * 1000 < Date.now();
};

/**
 * Clear all authentication tokens from storage
 */
const clearTokens = () => {
    localStorage.removeItem(TOKEN_STORAGE.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE.TOKEN_EXPIRY);
};

/**
 * Refresh the access token using the refresh token
 * @returns {Promise<boolean>} True if token was successfully refreshed, false otherwise
 */
const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return false;
    }
    
    try {
        const tokenData = await apiClient.post(API_ENDPOINTS.auth.refreshToken, null, {
            headers: {
                'Authorization': `Bearer ${refreshToken}`
            },
            skipAuth: true
        });
        
        saveTokens(tokenData);
        return true;
    } catch (error) {
        console.error('Failed to refresh token:', error);
        clearTokens();
        return false;
    }
};

/**
 * Check token status with the backend
 * @returns {Promise<boolean>} True if token is valid, false otherwise
 */
const validateToken = async () => {
    const token = getAccessToken();
    if (!token) {
        return false;
    }
    
    try {
        await apiClient.get(API_ENDPOINTS.auth.tokenStatus, {
            skipAuth: true,
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return true;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
};

/**
 * Ensure a valid token is available, refreshing if necessary
 * @returns {Promise<boolean>} True if a valid token is available, false otherwise
 */
const ensureValidToken = async () => {
    if (!getAccessToken()) {
        return false;
    }
    
    if (isTokenExpired()) {
        return await refreshAccessToken();
    }
    
    return true;
};

export {
    saveTokens,
    getAccessToken,
    getRefreshToken,
    isTokenExpired,
    clearTokens,
    refreshAccessToken,
    validateToken,
    ensureValidToken,
    TOKEN_STORAGE
};