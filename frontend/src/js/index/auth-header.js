// Check auth status and update header links
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated by getting token from localStorage
  function isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !tokenExpiry) {
      return false;
    }
    
    // Check if token is expired
    const now = new Date().getTime();
    return now < parseInt(tokenExpiry);
  }
  
  // Update the sign-in link to dashboard if authenticated
  function updateAuthUI() {
    const signInLink = document.querySelector('.header-link[href="src/pages/Auth/auth.html"]');
    if (!signInLink) return;
    
    if (isAuthenticated()) {
      // User is authenticated, change to Dashboard
      signInLink.innerHTML = '<i class="fas fa-user-circle"></i><span>Dashboard</span>';
      signInLink.href = 'src/pages/Dashboard/index.html';
    }
  }
  
  // Run the UI update
  updateAuthUI();
});