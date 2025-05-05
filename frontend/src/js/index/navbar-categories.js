/**
 * Navbar categories functionality for the homepage
 * Fetches categories from API and renders them in the navbar
 */

import { fetchCategories, navigateToCategory } from './category-service.js';

/**
 * Handle category link click
 * @param {Event} event - Click event
 * @param {string} categoryName - Name of the clicked category
 */
function handleCategoryClick(event, categoryName) {
    event.preventDefault(); // Prevent default anchor behavior
    navigateToCategory(categoryName);
}

/**
 * Render categories in the navigation bar
 * Categories are sorted by item count (highest to lowest)
 * Limited to a reasonable number for display
 */
async function renderNavbarCategories() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    try {
        // Fetch all categories
        const categories = await fetchCategories();
        
        // Clear existing navbar links
        navbar.innerHTML = '';
        
        if (categories.length === 0) {
            // If no categories, show placeholder
            const placeholder = document.createElement('a');
            placeholder.href = '#';
            placeholder.textContent = 'Categories';
            navbar.appendChild(placeholder);
            return;
        }
        
        // Sort categories by item count (highest to lowest)
        categories.sort((a, b) => b.item_count - a.item_count);
        
        // Determine how many categories to show (responsive design)
        // This can be adjusted based on UI requirements
        const maxCategories = Math.min(8, categories.length);
        
        // Create links for categories
        for (let i = 0; i < maxCategories; i++) {
            const category = categories[i];
            const categoryLink = document.createElement('a');
            categoryLink.href = '#';
            // Make the first category active
            if (i === 0) {
                categoryLink.className = 'active';
            }
            categoryLink.innerHTML = `${category.name} <i class="fas fa-chevron-down dropdown-icon"></i>`;
            
            // Add click event listener to navigate to products list with category filter
            categoryLink.addEventListener('click', (event) => 
                handleCategoryClick(event, category.name)
            );
            
            navbar.appendChild(categoryLink);
        }
    } catch (error) {
        console.error('Error rendering navbar categories:', error);
        
        // Fallback to default categories in case of error
        navbar.innerHTML = `
            <a href="#" class="active">Categories <i class="fas fa-chevron-down dropdown-icon"></i></a>
        `;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', renderNavbarCategories);

export { renderNavbarCategories };