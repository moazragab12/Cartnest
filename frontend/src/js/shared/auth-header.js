// Authentication and header management
document.addEventListener('DOMContentLoaded', async () => {
  // Token storage keys - match the ones used in tokenManager.js
  const TOKEN_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
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
  // Handle logout
  function handleLogout() {
    // Try to use the existing logout method from authService if available
    try {
      if (window.Auth && typeof window.Auth.logout === 'function') {
        // Use the existing Auth system
        window.Auth.logout();
        return; // Auth.logout will handle redirection
      } 
      
      // If Auth module isn't available or loaded, fall back to manual logout
      console.info("Using fallback logout method");
    } catch (error) {
      console.error("Error using Auth.logout:", error);
      console.info("Falling back to manual logout...");
    }

    // Manual logout as fallback
    // Clear auth tokens
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(TOKEN_KEYS.USER_DATA);

    // Clear cookies too for completeness
    document.cookie = `${TOKEN_KEYS.ACCESS_TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${TOKEN_KEYS.TOKEN_EXPIRY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${TOKEN_KEYS.REFRESH_TOKEN}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;

    // Redirect to home page or login page
    const urlParts = window.location.href.split('/');
    const baseUrl = urlParts.slice(0, urlParts.indexOf('frontend') + 1).join('/');
    window.location.href = `${baseUrl}/index.html`;
  }
    // Update the auth UI elements in the header
  async function updateHeaderAuth() {
    // Get the header links container
    const headerLinksDiv = document.querySelector(".header-links");
    
    if (!headerLinksDiv) {
      console.error("Header links container not found");
      return;
    }
    
    if (isAuthenticated()) {
      // User is authenticated - show Dashboard and Logout
      const userData = await getUserData();
      const displayName = userData && userData.username ? userData.username : 'My Account';
      
      // Create new HTML for authenticated users
      headerLinksDiv.innerHTML = `
        <a href="${getRelativePath('pages/Dashboard/index.html')}" class="dashboard-link">
          <img src="${fixSvgPath('user-icon.svg')}" alt="Dashboard" class="icon-svg" />
          <span>${displayName}</span>
        </a>
        <span class="header-divider">|</span>
        <a href="${getRelativePath('pages/cart/cart.html')}" class="cart-link">
          <img src="${fixSvgPath('cart-icon.svg')}" alt="Cart" class="icon-svg" />
          <span>Cart</span>
          <span id="cart-badge" class="cart-badge">0</span>
        </a>
        <span class="header-divider">|</span>
        <a href="#" class="logout-link" id="logout-link">
          <img src="${fixSvgPath('logout-icon.svg')}" alt="Logout" class="icon-svg" />
          <span>Log out</span>
        </a>
      `;

      // Add event listener to logout link
      document.getElementById('logout-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
      });
      
      console.log("Header updated for authenticated user");
    } else {
      // User is not authenticated - show Sign Up/Sign In and Cart
      headerLinksDiv.innerHTML = `
        <a href="${getRelativePath('pages/auth/auth.html')}" class="sign-in-link">
          <img src="${fixSvgPath('user-icon.svg')}" alt="User" class="icon-svg" />
          <span>Sign Up/Sign In</span>
        </a>
        <span class="header-divider">|</span>
        <a href="${getRelativePath('pages/cart/cart.html')}" class="cart-link">
          <img src="${fixSvgPath('cart-icon.svg')}" alt="Cart" class="icon-svg" />
          <span>Cart</span>
          <span id="cart-badge" class="cart-badge">0</span>
        </a>
      `;      
      console.log("Header updated for non-authenticated user");
    }
    
    // Dispatch an event that page-specific extensions (like Dashboard) can listen for
    const event = new CustomEvent('authHeader:updated', { 
      detail: { isAuthenticated: isAuthenticated() }
    });
    document.dispatchEvent(event);
  }
  // Helper function to determine relative path based on current page
  function getRelativePath(targetPath) {
    // Get current URL path
    const currentPath = window.location.pathname;
    
    // Check if we're in the root directory, in pages directory, or elsewhere
    if (currentPath.includes('/src/pages/')) {
      // We're in a page subdirectory (likely 2-3 levels deep)
      const pathSegments = currentPath.split('/');
      const depth = pathSegments.filter(segment => segment.length > 0).length;
      const pageLevel = pathSegments.indexOf('pages');
      const levelsUp = depth - pageLevel;
      
      // Navigate up to the frontend directory
      let basePath = '../'.repeat(levelsUp);
      
      // For the case of deeply nested pages
      if (basePath === '') {
        basePath = './';
      }
      
      return `${basePath}${targetPath}`;
    } else if (currentPath.endsWith('index.html') || currentPath === '/') {
      // We're at the root index.html
      return `./src/${targetPath}`;
    } else {
      // Default case
      return `./src/${targetPath}`;
    }
  }
  // Helper function to ensure SVG icons load properly on all pages
  function fixSvgPath(svgFileName) {
    const currentPath = window.location.pathname;
    let basePath;
    
    // Log to help debug path issues
    console.log('Current path:', currentPath);
    
    // Check for specific page patterns
    
    // Case 1: Dashboard page
    if (currentPath.includes('/Dashboard/') || currentPath.includes('\\Dashboard\\')) {
      basePath = '../../../public/resources/images/svg/';
    }
    // Case 2: Product list page
    else if (currentPath.includes('/productsList/') || currentPath.includes('\\productsList\\')) {
      basePath = '../../../public/resources/images/svg/';
    }
    // Case 3: Product detail page 
    else if (currentPath.includes('/product/') || currentPath.includes('\\product\\')) {
      basePath = '../../../public/resources/images/svg/';
    }
    // Case 4: Any page under src/pages
    else if (currentPath.includes('/src/pages/') || currentPath.includes('\\src\\pages\\')) {
      // Split by both forward and backward slashes to handle Windows paths
      const pathParts = currentPath.split(/[\/\\]/);
      const pagesIndex = pathParts.findIndex(part => part === 'pages');
      
      if (pagesIndex !== -1) {
        // Count directories from pages to current location
        const levelsDeep = pathParts.length - pagesIndex - 1;
        basePath = '../'.repeat(levelsDeep) + '../../../public/resources/images/svg/';
      } else {
        // Fallback for other pages under src
        basePath = '../../../public/resources/images/svg/';
      }
    }
    // Case 5: Root index page
    else if (currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/') || currentPath.indexOf('/frontend') !== -1) {
      basePath = './public/resources/images/svg/';
    }
    // Default fallback for any other case
    else {
      console.warn('Using default path fallback for SVG icons');
      basePath = './public/resources/images/svg/';
    }
    
    const result = `${basePath}${svgFileName}`.replace(/\/\//g, '/');
    console.log('Resolved SVG path:', result);
    return result;
  }  // Get cart count from cart system
  function updateCartCount() {
    try {
      let cartCount = 0;
      
      // Debug cart state
      console.log('Updating cart count. CartManager available:', !!window.cartManager);
      
      // Try to get cart count from the cartManager if available
      if (window.cartManager) {
        if (typeof window.cartManager.getTotalQuantity === 'function') {
          cartCount = window.cartManager.getTotalQuantity();
          console.log('Cart count from cartManager.getTotalQuantity():', cartCount);
        } 
        else if (typeof window.cartManager.getCartCount === 'function') {
          cartCount = window.cartManager.getCartCount();
          console.log('Cart count from cartManager.getCartCount():', cartCount);
        }
        else {
          console.log('CartManager missing getTotalQuantity/getCartCount method');
        }
      }
      // Fallback to localStorage
      else {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
          try {
            const cart = JSON.parse(storedCart);
            if (Array.isArray(cart)) {
              // Sum quantities of all items
              cartCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);
            } else if (typeof cart === 'object') {
              // If it's a different format, try to count items
              cartCount = Object.keys(cart).length;
            }
          } catch (e) {
            console.warn('Failed to parse cart data:', e);
          }
        }
        
        // Final fallback
        if (!cartCount && localStorage.getItem('cartCount')) {
          cartCount = parseInt(localStorage.getItem('cartCount')) || 0;
        }
      }
      
      // Update all cart badges
      const cartBadges = document.querySelectorAll('.cart-badge');
      cartBadges.forEach(badge => {
        badge.textContent = cartCount;
        
        // Add visual cue only if cart has items
        if (cartCount > 0) {
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      });
      
      return cartCount;
    } catch (error) {
      console.error('Error updating cart count:', error);
      return 0;
    }
  }
  
  // Run the UI update
  try {
    updateHeaderAuth();
    updateCartCount();
    
    // Listen for cart update events
    document.addEventListener('cart:updated', updateCartCount);
    document.addEventListener('cart:itemAdded', () => {
      // Add animation class to cart badge
      const cartBadges = document.querySelectorAll('.cart-badge');
      cartBadges.forEach(badge => {
        badge.classList.add('animate');
        setTimeout(() => badge.classList.remove('animate'), 750);
      });
      updateCartCount();
    });
    document.addEventListener('cart:itemRemoved', updateCartCount);
    
  } catch (error) {
    console.error("Error updating auth header:", error);
  }
});
