// SVG Icon path fixer - runs after auth-header.js to ensure icons load correctly
document.addEventListener('DOMContentLoaded', () => {
  // Log the current page we're on to help with debugging
  console.log('SVG Fixer: Running on page', window.location.pathname);
  
  // Wait a bit for auth-header.js to finish
  setTimeout(() => {
    console.log('SVG Fixer: Running icon path verification');
    
    // Get all SVG icons in the header
    const iconSvgs = document.querySelectorAll('.header-links .icon-svg');
    
    iconSvgs.forEach(icon => {
      // Check if the image failed to load or is not visible
      if (icon.complete && (icon.naturalWidth === 0 || getComputedStyle(icon).display === 'none')) {
        console.log('SVG Fixer: Found broken icon, attempting to fix path:', icon.src);
        
        // Get the filename from the broken path
        const fileName = icon.src.split('/').pop();
        
        // Determine the current page context
        const currentPath = window.location.pathname;
        let newPath;
          if (currentPath.includes('/Dashboard/') || currentPath.includes('\\Dashboard\\')) {
          newPath = '/frontend/public/resources/images/svg/' + fileName;
        } 
        else if (currentPath.includes('/productsList/') || currentPath.includes('\\productsList\\')) {
          newPath = '/frontend/public/resources/images/svg/' + fileName;
        }
        else if (currentPath.includes('/product/') || currentPath.includes('\\product\\')) {
          newPath = '/frontend/public/resources/images/svg/' + fileName;
        }        else if (currentPath.includes('/src/pages/')) {
          // Count the number of directories deep we are and generate path accordingly
          const pathParts = currentPath.split('/');
          const pagesIndex = pathParts.indexOf('pages');
          if (pagesIndex !== -1) {
            const levelsDeep = pathParts.length - pagesIndex - 1;
            newPath = '/frontend/public/resources/images/svg/' + fileName;
          } else {
            newPath = '/frontend/public/resources/images/svg/' + fileName;
          }
        }
        else {
          newPath = '/frontend/public/resources/images/svg/' + fileName;
        }
        
        // Update the source
        icon.src = newPath;
        console.log('SVG Fixer: Updated icon path to', newPath);

        // Apply additional styling to ensure visibility
        icon.style.filter = 'brightness(0) invert(1)';
        icon.style.width = '24px';
        icon.style.height = '24px';
        icon.style.display = 'inline-block';
      }
    });

    // Also check for cart badges that need styling
    const cartBadges = document.querySelectorAll('.cart-badge');
    cartBadges.forEach(badge => {
      badge.style.position = 'absolute';
      badge.style.zIndex = '10';
    });
    
  }, 500); // Run after auth-header.js has had time to run

  // Listen for auth-header updates
  document.addEventListener('authHeader:updated', () => {
    // Run the same fix after auth header updates
    setTimeout(() => {
      console.log('SVG Fixer: Auth header updated, re-running fixes');
      const iconSvgs = document.querySelectorAll('.header-links .icon-svg');
      
      iconSvgs.forEach(icon => {
        // Apply styling to ensure visibility
        icon.style.filter = 'brightness(0) invert(1)';
        icon.style.width = '24px';
        icon.style.height = '24px';
        icon.style.display = 'inline-block';
      });
    }, 100);
  });
});
