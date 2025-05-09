/**
 * Random Categories Module
 * Fetches and displays random categories in the system
 */

import { fetchCategories, navigateToCategory } from './category-service.js';

// Enhanced color palette with more visually appealing gradients (based on provided image)
const categoryGradients = [
    'linear-gradient(135deg, #0ea5e9 10%, #2dd4bf 90%)', // Teal/Cyan - like Beauty/Toys
    'linear-gradient(135deg, #a855f7 10%, #ec4899 90%)', // Purple/Pink - like Automotive/Electronics
    'linear-gradient(135deg, #f97316 10%, #fbbf24 90%)', // Orange/Yellow - like Jewelry/Office
    'linear-gradient(135deg, #22c55e 10%, #84cc16 90%)', // Green/Lime
    'linear-gradient(135deg, #ef4444 10%, #f97316 90%)', // Red/Orange
    'linear-gradient(135deg, #6366f1 10%, #a78bfa 90%)', // Indigo/Violet
];

// Different types of diagonal patterns
// REMOVED

/**
 * Shuffles an array using Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} The shuffled array
 */
const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

/**
 * Create a category card element with random style and animation
 * @param {Object} category - The category object
 * @param {number} index - Index for selecting colors
 * @param {Array} usedGradients - Array of already used gradients to avoid repetition
 * @returns {HTMLElement} The category card element
 */
const createCategoryCard = (category, index, usedGradients) => {
    // Get a unique gradient for this category (no repeats)
    let colorIndex;
    let gradient;
    do {
        colorIndex = Math.floor(Math.random() * categoryGradients.length);
        gradient = categoryGradients[colorIndex];
    } while (usedGradients.includes(colorIndex) && usedGradients.length < categoryGradients.length);
    
    usedGradients.push(colorIndex);
    
    // Choose a diagonal pattern - REMOVED
    // const patternIndex = index % diagonalPatterns.length; // REMOVED
    // const pattern = diagonalPatterns[patternIndex]; // REMOVED
    
    // Create first letter from category name
    const firstLetter = category.name.charAt(0).toUpperCase();
    
    // Create card element
    const card = document.createElement('div');
    card.className = 'category-card';
    card.style.background = gradient;
    card.setAttribute('data-category', category.name);
    card.setAttribute('data-index', index);
    
    // Create card content - Add background shapes div
    card.innerHTML = `
        <div class="background-shapes">
            <div class="shape shape1"></div>
            <div class="shape shape2"></div>
            <div class="shape shape3"></div>
        </div>
        <div class="category-content">
            <div class="category-letter">
                ${firstLetter}
            </div>
            <h3 class="category-title">${category.name}</h3>
            <div class="category-count"></div>
        </div>
        <div class="card-highlight"></div>
    `;
    
    // Add click event to navigate to this category
    card.addEventListener('click', () => {
        // Add clicking animation
        card.classList.add('clicked');
        setTimeout(() => {
            navigateToCategory(category.name);
        }, 300);
    });

    // Add hover listeners for highlight effect
    card.addEventListener('mouseenter', (e) => {
        const highlight = e.currentTarget.querySelector('.card-highlight');
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        highlight.style.opacity = '1';
        highlight.style.transform = `translate(${x}px, ${y}px)`;
    });

    card.addEventListener('mousemove', (e) => {
        const highlight = e.currentTarget.querySelector('.card-highlight');
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        highlight.style.transform = `translate(${x}px, ${y}px)`;
    });

    card.addEventListener('mouseleave', (e) => {
        const highlight = e.currentTarget.querySelector('.card-highlight');
        highlight.style.opacity = '0';
    });
    
    return card;
};

/**
 * Create View All Categories button
 * @returns {HTMLElement} Button element
 */
const createViewAllButton = () => {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'view-all-categories-container';
    
    buttonContainer.innerHTML = `
        <button class="btn btn-primary view-all-categories-btn">
            View All Categories
            <i class="fas fa-arrow-right"></i>
        </button>
    `;
    
    // Add click event to navigate to product list page with all categories
    buttonContainer.querySelector('button').addEventListener('click', () => {
        window.location.href = '/frontend/src/pages/productsList/productList.html';
    });
    
    return buttonContainer;
};

/**
 * Render random categories in the categories container
 */
const renderRandomCategories = async () => {
    try {
        // Get the categories container
        const categoriesContainer = document.querySelector('.categories');
        if (!categoriesContainer) return;
        
        // Get the categories header
        const categoriesHeader = document.querySelector('.categories-header');
        if (!categoriesHeader) return;
        
        // Add "View All Categories" button after the header but before the cards
        const viewAllButton = createViewAllButton();
        if (!document.querySelector('.view-all-categories-container')) {
            categoriesHeader.after(viewAllButton);
        }
        
        // Clear any existing content
        categoriesContainer.innerHTML = '';
        
        // Show loading state
        categoriesContainer.innerHTML = '<div class="loading-categories">Loading categories...</div>';
        
        // Fetch all categories from API
        let categories = await fetchCategories();
        
        // If no categories returned, show placeholder
        if (!categories || categories.length === 0) {
            categoriesContainer.innerHTML = '<div class="no-categories">No categories found</div>';
            return;
        }
        
        // Shuffle and take 6 random categories (or less if fewer are available)
        categories = shuffleArray(categories);
        const randomCategories = categories.slice(0, 6);
        
        // Clear loading message
        categoriesContainer.innerHTML = '';
        
        // Track used gradients to avoid repetition
        const usedGradients = [];
        
        // Create and append category cards
        randomCategories.forEach((category, index) => {
            const card = createCategoryCard(category, index, usedGradients);
            categoriesContainer.appendChild(card);
        });
        
        // Add animation classes after rendering to trigger animations
        setTimeout(() => {
            document.querySelectorAll('.category-card').forEach((card, index) => {
                card.classList.add('animate');
                card.style.animationDelay = `${index * 0.1}s`;
            });
        }, 100);
        
    } catch (error) {
        console.error('Error rendering random categories:', error);
        const categoriesContainer = document.querySelector('.categories');
        if (categoriesContainer) {
            categoriesContainer.innerHTML = '<div class="error-categories">Error loading categories</div>';
        }
    }
};

// Function to observe category cards and animate them when they become visible
function initializeCategories() {
    const categories = document.querySelectorAll('.category-card');
    
    if (categories.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                // Add spotlight element
                if (!entry.target.querySelector('.card-highlight')) {
                    const spotlight = document.createElement('div');
                    spotlight.className = 'card-highlight';
                    entry.target.appendChild(spotlight);
                }
            }
        });
    }, { threshold: 0.1 });
    
    categories.forEach((card) => {
        observer.observe(card);
        
        // Add background shapes
        const shapes = document.createElement('div');
        shapes.className = 'background-shapes';
        
        for (let i = 1; i <= 3; i++) {
            const shape = document.createElement('div');
            shape.className = `shape shape${i}`;
            shapes.appendChild(shape);
        }
        
        card.appendChild(shapes);
        
        // Add spotlight effect that follows mouse movements
        card.addEventListener('mousemove', (e) => {
            const spotlight = card.querySelector('.card-highlight');
            if (!spotlight) return;
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            spotlight.style.opacity = '1';
            spotlight.style.left = `${x}px`;
            spotlight.style.top = `${y}px`;
        });
        
        // Reset spotlight when mouse leaves
        card.addEventListener('mouseleave', (e) => {
            const spotlight = card.querySelector('.card-highlight');
            if (!spotlight) return;
            
            spotlight.style.opacity = '0';
        });
        
        // Add click animation
        card.addEventListener('click', () => {
            card.classList.add('clicked');
            
            // Remove the clicked class after animation completes
            setTimeout(() => {
                card.classList.remove('clicked');
            }, 300);
        });
    });
}

// Call this function when DOM is loaded or when categories are dynamically loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeCategories();
    
    // If categories are loaded dynamically after page load, call initializeCategories() again
    // For example, if using a fetch call to get categories:
    // fetchCategories().then(() => initializeCategories());
});

document.addEventListener('DOMContentLoaded', renderRandomCategories);

export { renderRandomCategories };