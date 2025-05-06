/**
 * Main dashboard initialization file
 * Coordinates all dashboard functionality
 */

// Import dashboard-specific modules
import { initDepositModal, updateWalletBalance } from './wallet.js';

// Initialize all dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tabs functionality
    initTabs();
    
    // Initialize wallet functionality
    initDepositModal();
    updateWalletBalance();
    
    // Initialize charts if they exist
    initCharts();
});

// Function to handle tab navigation
function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    // Initialize tab navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Show corresponding content section
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId)?.classList.add('active');
        });
    });
    
    // For manually showing tabs by ID
    window.showTab = function(tabId) {
        const targetNavItem = document.querySelector(`.nav-item[data-target="${tabId}"]`);
        if (targetNavItem) {
            targetNavItem.click();
        }
    };
}

// Function to initialize charts
function initCharts() {
    // This would initialize any charts in the dashboard
    // We'll leave this as a placeholder for now
    console.log('Chart initialization would happen here');
}

// Make it available globally
window.dashboardInit = {
    showTab: showTab
};

// Export functions for potential use in other modules
export {
    initTabs,
    initCharts
};