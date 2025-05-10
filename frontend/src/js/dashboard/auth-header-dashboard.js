// Dashboard-specific auth-header extensions

document.addEventListener('DOMContentLoaded', () => {
  // Fix dashboard header icon display issues
  const fixDashboardIcons = () => {
    // Make sure all icons are properly visible in dashboard context
    const headerLinks = document.querySelector('.header-links');
    if (!headerLinks) {
      console.warn('Dashboard header links not found');
      return;
    }
      // First check if any SVG icons have incorrect paths
    const iconImages = headerLinks.querySelectorAll('.icon-svg');
    iconImages.forEach(icon => {
      // Check if the image failed to load
      if (icon.complete && icon.naturalWidth === 0) {
        console.log('Found broken SVG icon, attempting to fix path:', icon.src);
        // Try to fix the path - use absolute path with /frontend prefix for consistency
        const fileName = icon.src.split('/').pop();
        icon.src = `/frontend/public/resources/images/svg/${fileName}`;
      }
      
      // Make sure the SVG icon is visible against the gradient background
      icon.style.filter = 'brightness(0) invert(1) !important';
      
      // Add hover effect fixes with cleaner approach
      const parentLink = icon.closest('a');
      if (parentLink) {
        // Remove any existing listeners to avoid duplicates
        const newParent = parentLink.cloneNode(true);
        if (parentLink.parentNode) {
          parentLink.parentNode.replaceChild(newParent, parentLink);
          
          // Add new listeners
          const newIcon = newParent.querySelector('.icon-svg');
          if (newIcon) {
            newParent.addEventListener('mouseenter', () => {
              newIcon.style.filter = 'none !important';
              newIcon.style.transform = 'translateY(-2px)';
            });
            
            newParent.addEventListener('mouseleave', () => {
              newIcon.style.filter = 'brightness(0) invert(1) !important';
              newIcon.style.transform = 'translateY(0)';
            });
          }
        }
      }
    });
  };

  // Fix dashboard cart badge positioning
  const fixDashboardCartBadge = () => {
    // Find all cart badges in the document to handle different DOM structures
    const cartBadges = document.querySelectorAll('.cart-badge');
    
    if (cartBadges.length === 0) {
      console.warn('No cart badges found in dashboard');
      return;
    }
    
    cartBadges.forEach(badge => {
      // Apply important styles for dashboard context
      badge.style.cssText = `
        position: absolute !important;
        top: -8px !important;
        right: -8px !important;
        z-index: 10 !important;
        background: #ff3b30 !important;
        color: white !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      `;
    });
  };
    // Initialize dashboard-specific fixes
  setTimeout(() => {
    console.log('Initializing Dashboard header fixes');
    fixDashboardIcons();
    fixDashboardCartBadge();
  }, 100);
    // Reapply fixes when header might be updated
  document.addEventListener('authHeader:updated', (event) => {
    setTimeout(() => {
      fixDashboardIcons();
      fixDashboardCartBadge();
      
      // Log the auth status for debugging
      console.log('Dashboard detected auth change:', event.detail.isAuthenticated);
    }, 100);
  });
});
