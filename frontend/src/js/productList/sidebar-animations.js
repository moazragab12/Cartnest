/**
 * Enhanced sidebar animations for the product list page
 * Adds interactive 3D effects, hover animations, and smooth transitions
 */

document.addEventListener("DOMContentLoaded", () => {
  // Set up the enhanced sidebar functionality
  setupEnhancedSidebar();

  // Add parallax effect to sidebar
  setupSidebarParallax();

  // Add category item animations
  setupCategoryAnimations();

  // Add clear filters enhanced animation
  setupClearFiltersAnimation();
});

/**
 * Setup clean sidebar structure - animations removed
 */
function setupEnhancedSidebar() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  // Wrap inner content for proper structure
  if (!sidebar.querySelector(".sidebar-content")) {
    const sidebarContent = document.createElement("div");
    sidebarContent.className = "sidebar-content";

    // Move all sidebar children to the new content wrapper
    while (sidebar.firstChild) {
      sidebarContent.appendChild(sidebar.firstChild);
    }

    // Append the content wrapper back to sidebar
    sidebar.appendChild(sidebarContent);
  }

  // Clean up filter sections, remove animations
  const detailsElements = document.querySelectorAll("details");
  detailsElements.forEach((details) => {
    // Remove animation styling
    details.style.animation = "none";
    details.style.animationDelay = "0s";
  });
}

/**
 * Create a ripple effect on an element when clicked
 */
function createRippleEffect(event) {
  const target = event.currentTarget;
  const ripple = document.createElement("span");
  const rect = target.getBoundingClientRect();

  // Calculate position relative to the target
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Style the ripple
  ripple.className = "ripple";
  ripple.style.left = x + "px";
  ripple.style.top = y + "px";

  // Add ripple to target
  target.appendChild(ripple);

  // Remove after animation completes
  setTimeout(() => {
    ripple.remove();
  }, 600);
}

/**
 * Set up animation for sidebar elements - DISABLED
 */
function setupSidebarParallax() {
  // Animation removed as requested
  return;
}

/**
 * Add subtle background animation to sidebar - DISABLED
 */
function addBackgroundAnimation(sidebar) {
  // Animation removed as requested
  return;
}

/**
 * Set up animation for category items
 */
function setupCategoryAnimations() {
  // Animate category items when categories are loaded
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        const categoryList = document.getElementById("category-list");
        if (categoryList && !categoryList.classList.contains("animated")) {
          const items = categoryList.querySelectorAll(
            "li:not(.loading-categories)"
          );
          if (items.length) {
            // Add animation class to prevent re-animation
            categoryList.classList.add("animated");

            // Animate each item with delay
            items.forEach((item, index) => {
              item.style.animation = `fadeSlideRight 0.5s ${
                index * 0.05 + 0.1
              }s forwards`;
              item.style.opacity = "0";
              item.style.transform = "translateX(-10px)";
            });
          }
        }
      }
    });
  });

  // Start observing
  observer.observe(document.getElementById("category-list") || document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Setup clear filters button enhanced animation
 */
function setupClearFiltersAnimation() {
  const clearBtn = document.getElementById("clear-filters");
  if (!clearBtn) return;

  clearBtn.addEventListener("click", () => {
    // Add click animation class
    clearBtn.classList.add("clear-animation");

    // Show success indicator
    const successIcon = document.createElement("span");
    successIcon.className = "success-icon";
    successIcon.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    clearBtn.appendChild(successIcon);

    // Remove animation and icon after completion
    setTimeout(() => {
      clearBtn.classList.remove("clear-animation");
      if (successIcon) successIcon.remove();
    }, 2000);
  });
}

// Add CSS for dynamic elements
(() => {
  const style = document.createElement("style");
  style.textContent = `
    .ripple {
      position: absolute;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.7);
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    }
    
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    .clear-animation {
      animation: clearBtnPulse 0.5s forwards;
    }
    
    @keyframes clearBtnPulse {
      0% { transform: scale(1); }
      50% { transform: scale(0.95); }
      100% { transform: scale(1); }
    }    .success-icon {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #0d99ff;
      opacity: 0;
      animation: fadeIn 0.3s 0.2s forwards;
    }
    
    @keyframes fadeIn {
      to { opacity: 1; }
    }
    
    @keyframes fadeSlideRight {
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `;
  document.head.appendChild(style);
})();
