/**
 * Product List View Toggle Functionality
 * Switches between grid and list views for product display
 */

document.addEventListener('DOMContentLoaded', () => {
    initViewToggle();
});

/**
 * Initialize the view toggle functionality
 */
function initViewToggle() {
    const gridViewBtn = document.querySelector('.view-btn[title="Grid view"]');
    const listViewBtn = document.querySelector('.view-btn[title="List view"]');
    const productGrid = document.querySelector('.product-grid');
    
    if (!gridViewBtn || !listViewBtn || !productGrid) {
        console.error('View toggle elements not found');
        return;
    }
    
    // Set initial state (grid view is the default)
    productGrid.classList.add('grid-view');
    productGrid.classList.remove('list-view');
    gridViewBtn.classList.add('active');
    listViewBtn.classList.remove('active');
    
    // Grid view button click handler
    gridViewBtn.addEventListener('click', () => {
        productGrid.classList.add('grid-view');
        productGrid.classList.remove('list-view');
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        
        // Save preference to localStorage
        localStorage.setItem('productViewPreference', 'grid');
    });
    
    // List view button click handler
    listViewBtn.addEventListener('click', () => {
        productGrid.classList.remove('grid-view');
        productGrid.classList.add('list-view');
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        
        // Save preference to localStorage
        localStorage.setItem('productViewPreference', 'list');
    });
    
    // Check if there's a saved preference and apply it
    const savedViewPreference = localStorage.getItem('productViewPreference');
    if (savedViewPreference === 'list') {
        // Trigger list view
        listViewBtn.click();
    } else {
        // Default to grid view
        gridViewBtn.click();
    }
}