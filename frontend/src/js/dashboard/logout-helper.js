// Expose auth-header.js logout functionality in dashboard context
document.addEventListener('DOMContentLoaded', () => {
  // Initialize global Auth utility if not already present
  window.Auth = window.Auth || {};
  
  // Make sure we can access the auth-header.js handleLogout function
  // by creating a reference when that script executes
  const originalHandleLogout = window.handleLogout;
  
  // Either use the original function from auth-header.js or define our own
  window.Auth.logout = function() {
    console.log('Logout triggered via Auth.logout()');
    
    // Try to use the original if available
    if (typeof originalHandleLogout === 'function') {
      originalHandleLogout();
      return;
    }
    
    // Fallback implementation similar to auth-header.js
    const TOKEN_KEYS = {
      ACCESS_TOKEN: 'accessToken',
      REFRESH_TOKEN: 'refreshToken',
      TOKEN_EXPIRY: 'tokenExpiry',
      USER_DATA: 'userData'
    };
    
    // Clear localStorage tokens
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(TOKEN_KEYS.USER_DATA);

    // Clear cookies
    document.cookie = `${TOKEN_KEYS.ACCESS_TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${TOKEN_KEYS.TOKEN_EXPIRY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${TOKEN_KEYS.REFRESH_TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

    // Show feedback to user
    const notifyLogout = document.createElement('div');
    notifyLogout.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 15px; border-radius: 4px; z-index: 1000;';
    notifyLogout.textContent = 'Successfully logged out. Redirecting...';
    document.body.appendChild(notifyLogout);
    
    // Redirect to home page
    setTimeout(() => {
      window.location.href = '../../../index.html';
    }, 1000);
  };

  // Connect the logout button to our Auth.logout function
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.Auth.logout();
    });
  }
  
  console.log('Dashboard logout helper initialized');
});
