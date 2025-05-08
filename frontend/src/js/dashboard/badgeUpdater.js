/**
 * Badge Updater Module
 * 
 * This module handles updating the badge counters in the sidebar
 * to display the actual number of items in each section (orders, transactions, products)
 */

// Update all badges when the page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('Badge updater initialized');
  
  // Initial update - with a slight delay to ensure DOM is fully loaded
  setTimeout(removeBadges, 200);
  
  // Listen for tab changes to update badges accordingly
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      // Keep badges removed
      setTimeout(removeBadges, 300);
    });
  });
});

/**
 * Remove all badge counters from the sidebar
 */
function removeBadges() {
  // Get all badge elements in the sidebar
  const badges = document.querySelectorAll('.sidebar-nav .nav-item .badge');
  
  // Remove each badge
  badges.forEach(badge => {
    badge.remove();
  });
  
  console.log('All badges have been removed');
}

// Export functions for use in other modules
export {
  removeBadges
};