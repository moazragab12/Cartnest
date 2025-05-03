/**
 * Profile Service for MarketPlace
 * Implements user profile-related API functions
 */

import apiClient from '../apiClient.js';
import API_ENDPOINTS from '../endpoints.js';

/**
 * Get the current user's full profile details
 * @returns {Promise<object>} User profile data
 */
const getProfileDetails = async () => {
    try {
        return await apiClient.get(API_ENDPOINTS.profile.details);
    } catch (error) {
        console.error('Get profile details error:', error);
        throw error;
    }
};

/**
 * Update the current user's profile
 * @param {object} profileData - Profile data to update
 * @returns {Promise<object>} Updated profile data
 */
const updateProfile = async (profileData) => {
    try {
        return await apiClient.put(API_ENDPOINTS.profile.update, profileData);
    } catch (error) {
        console.error('Update profile error:', error);
        throw error;
    }
};

/**
 * Upload a profile picture
 * @param {File} imageFile - The image file to upload
 * @returns {Promise<object>} Response with the uploaded image URL
 */
const uploadProfilePicture = async (imageFile) => {
    if (!imageFile || !(imageFile instanceof File)) {
        throw new Error('Invalid image file');
    }
    
    try {
        const formData = new FormData();
        formData.append('profile_picture', imageFile);
        
        return await apiClient.post(`${API_ENDPOINTS.profile.update}/picture`, formData);
    } catch (error) {
        console.error('Profile picture upload error:', error);
        throw error;
    }
};

export {
    getProfileDetails,
    updateProfile,
    uploadProfilePicture
};