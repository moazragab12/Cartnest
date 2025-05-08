/**
 * Dashboard Profile Module
 * Handles fetching and displaying user profile data in the dashboard
 */

import apiClient from '../core/api/apiClient.js';
import API_ENDPOINTS from '../core/api/endpoints.js';

// DOM elements
let usernameField;
let emailField;
let memberSinceField;
let memberSinceDurationSpan;
let cashBalanceDisplay;
let profileNameDisplay;
let profileEmailDisplay;
let profileImageElement;

/**
 * Format currency values with $ symbol and 2 decimal places
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date to a more readable format
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Calculate membership duration from creation date
 */
const getMembershipDuration = (createdDate) => {
  const created = new Date(createdDate);
  const now = new Date();
  
  const yearDiff = now.getFullYear() - created.getFullYear();
  const monthDiff = now.getMonth() - created.getMonth();
  
  let years = yearDiff;
  let months = monthDiff;
  
  if (monthDiff < 0) {
    years = yearDiff - 1;
    months = monthDiff + 12;
  }
  
  // Handle singular vs plural for years and months
  const yearText = years === 1 ? 'year' : 'years';
  const monthText = months === 1 ? 'month' : 'months';
  
  if (years === 0) {
    return `${months} ${monthText}`;
  } else if (months === 0) {
    return `${years} ${yearText}`;
  }
  
  return `${years} ${yearText}, ${months} ${monthText}`;
};

/**
 * Fetch user profile data from the API
 */
const fetchProfileData = async () => {
  try {
    const profileData = await apiClient.get(API_ENDPOINTS.dashboard.profile);
    return profileData;
  } catch (error) {
    console.error('Error fetching profile data:', error);
    throw error;
  }
};

/**
 * Update profile form with data from the API
 */
const updateProfileUI = (profileData) => {
  if (!profileData) return;
  
  // Update form fields
  if (usernameField) usernameField.value = profileData.username;
  if (emailField) emailField.value = profileData.email;
  
  // Update member since date and duration
  if (memberSinceField) {
    const formattedDate = formatDate(profileData.created_at);
    memberSinceField.textContent = formattedDate;
    
    // Update membership duration if the element exists
    if (memberSinceDurationSpan) {
      const duration = getMembershipDuration(profileData.created_at);
      memberSinceDurationSpan.textContent = duration;
    }
  }
  
  // Update cash balance display
  if (cashBalanceDisplay) {
    cashBalanceDisplay.textContent = formatCurrency(profileData.cash_balance);
  }
  
  // Update sidebar profile information
  if (profileNameDisplay) profileNameDisplay.textContent = profileData.username;
  if (profileEmailDisplay) profileEmailDisplay.textContent = profileData.email;
  
  // Update role badge if it exists
  const profileStatus = document.querySelector('.profile-status');
  if (profileStatus) {
    profileStatus.textContent = profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1);
  }
  
  // Update card-time that contains the balance value
  const cardTimeElement = document.querySelector('.card-time');
  if (cardTimeElement) {
    cardTimeElement.textContent = formatCurrency(profileData.cash_balance);
  }
  
  console.log('Profile UI updated with data from API');
};

/**
 * Save profile changes
 */
const saveProfileChanges = async () => {
  if (!usernameField || !emailField) {
    console.error('Profile form elements not found');
    return;
  }
  
  const updatedProfile = {
    username: usernameField.value,
    email: emailField.value
  };
  
  try {
    // Use the profile update endpoint if implemented in the backend
    await apiClient.put(API_ENDPOINTS.profile.update, updatedProfile);
    
    // Show success message
    showSuccessMessage('Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
    showErrorMessage('Failed to update profile: ' + error.message);
  }
};

/**
 * Show success message to the user
 */
const showSuccessMessage = (message) => {
  const successMessage = document.createElement('div');
  successMessage.innerHTML = `
    <div style="position: fixed; bottom: 20px; right: 20px; background-color: #10B981; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); display: flex; align-items: center; gap: 12px; z-index: 1000; animation: slideInRight 0.3s ease-out forwards;">
      <i class="fas fa-check-circle" style="font-size: 20px;"></i>
      <div>
        <div style="font-weight: 500; margin-bottom: 2px;">Success!</div>
        <div style="font-size: 14px;">${message}</div>
      </div>
    </div>
  `;
  document.body.appendChild(successMessage);
  
  setTimeout(() => {
    successMessage.remove();
  }, 5000);
};

/**
 * Show error message to the user
 */
const showErrorMessage = (message) => {
  const errorMessage = document.createElement('div');
  errorMessage.innerHTML = `
    <div style="position: fixed; bottom: 20px; right: 20px; background-color: #EF4444; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); display: flex; align-items: center; gap: 12px; z-index: 1000; animation: slideInRight 0.3s ease-out forwards;">
      <i class="fas fa-exclamation-circle" style="font-size: 20px;"></i>
      <div>
        <div style="font-weight: 500; margin-bottom: 2px;">Error</div>
        <div style="font-size: 14px;">${message}</div>
      </div>
    </div>
  `;
  document.body.appendChild(errorMessage);
  
  setTimeout(() => {
    errorMessage.remove();
  }, 5000);
};

/**
 * Initialize the profile module
 */
const initProfile = async () => {
  console.log('Initializing profile module...');
  
  // Get all the necessary DOM elements
  usernameField = document.getElementById('username');
  emailField = document.getElementById('email');
  
  // Select the member since field and duration span correctly
  memberSinceField = document.querySelector('#profile-tab .form-control[style*="background-color"]');
  memberSinceDurationSpan = document.querySelector('#profile-tab span[style*="color: var(--secondary-color)"]');
  
  // Fix for cash balance display - look for the element with "$NaN"
  cashBalanceDisplay = document.querySelector('.card-time');
  
  profileNameDisplay = document.querySelector('.profile-name');
  profileEmailDisplay = document.querySelector('.profile-email');
  profileImageElement = document.querySelector('.profile-image img');
  
  // Set up save profile button
  const saveProfileBtn = document.getElementById('save-profile');
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', saveProfileChanges);
  }
  
  try {
    // Fetch and display profile data
    const profileData = await fetchProfileData();
    updateProfileUI(profileData);
    
    // Update any additional balance displays
    updateWalletBalanceDisplay(profileData.cash_balance);
  } catch (error) {
    console.error('Error initializing profile:', error);
    showErrorMessage('Failed to load profile data');
  }
};

/**
 * Update wallet balance display if it exists
 */
const updateWalletBalanceDisplay = (balance) => {
  // Update all possible elements that show wallet balance
  const walletBalanceDisplays = [
    document.querySelector('.card-time'),
    document.querySelector('#walletBalance')
  ];
  
  walletBalanceDisplays.forEach(display => {
    if (display) {
      display.textContent = formatCurrency(balance);
    }
  });
};

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, checking for profile tab...');
  // Initialize the profile module regardless of which tab is active
  // This ensures balance is updated on all tabs
  initProfile();
});

// Export the functions for use in other modules
export {
  initProfile,
  fetchProfileData,
  updateProfileUI,
  formatCurrency
};