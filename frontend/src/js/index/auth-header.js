// Check auth status and update header links
document.addEventListener('DOMContentLoaded', async () => {
  // Token storage keys - match the ones used in tokenManager
  const TOKEN_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    TOKEN_EXPIRY: 'tokenExpiry',
    USER_DATA: 'userData'
  };

  // Helper function to parse cookies
  function getCookieValue(name) {
    const cookies = document.cookie
      .split(";")
      .map((cookie) => cookie.trim().split("="))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});

    return cookies[name];
  }

  // Check if user is authenticated
  function isAuthenticated() {
    // First check local storage
    const token = localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
    const tokenExpiry = localStorage.getItem(TOKEN_KEYS.TOKEN_EXPIRY);
    
    if (token && tokenExpiry) {
      // Check if token is expired
      const now = new Date().getTime();
      if (now < parseInt(tokenExpiry)) {
        return true;
      }
    }
    
    // If not in local storage, check cookies (backward compatibility)
    const cookieToken = getCookieValue(TOKEN_KEYS.ACCESS_TOKEN);
    const cookieExpiry = getCookieValue(TOKEN_KEYS.TOKEN_EXPIRY);
    
    if (cookieToken && cookieExpiry) {
      const now = new Date().getTime();
      if (now < parseInt(cookieExpiry)) {
        // Migrate to localStorage for future use
        localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, cookieToken);
        localStorage.setItem(TOKEN_KEYS.TOKEN_EXPIRY, cookieExpiry);
        return true;
      }
    }
    
    return false;
  }
  
  // Get user data for personalizing the UI
  async function getUserData() {
    // Try to get from storage first
    const userData = localStorage.getItem(TOKEN_KEYS.USER_DATA);
    
    if (userData) {
      return JSON.parse(userData);
    }
    
    return null;
  }
  
  // Update the auth UI elements in the header
  async function updateAuthUI() {
    const authLink = document.getElementById('auth-link');
    const authText = document.getElementById('auth-text');
    
    if (!authLink || !authText) {
      console.error("Auth link elements not found in the DOM");
      return;
    }
    
    if (isAuthenticated()) {
      // User is authenticated, change link to Dashboard
      const userData = await getUserData();
      const displayName = userData && userData.username ? userData.username : 'Dashboard';
      
      authText.textContent = displayName;
      authLink.href = "/frontend/src/pages/Dashboard/index.html";
      
      console.log("User is authenticated, updated link to Dashboard");
    } else {
      // User is not authenticated, ensure link points to auth page
      authText.textContent = "Sign Up/Sign In";
      authLink.href = "/frontend/src/pages/auth/auth.html";
      
      console.log("User is not authenticated, link points to auth page");
    }
  }
  
  // Run the UI update
  try {
    updateAuthUI();
  } catch (error) {
    console.error("Error updating auth UI:", error);
  }
});