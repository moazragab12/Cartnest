/**
 * Show loading state for a container
 * @param {HTMLElement} container - Container element to show loading state
 */
export function showLoadingState(container) {
  if (!container) {
    console.error('Container not found for showLoadingState');
    return;
  }
  
  // Add loading class to container
  container.classList.add('loading');
  
  // Create loading indicator if it doesn't exist
  let loadingElement = container.querySelector('.loading-indicator');
  if (!loadingElement) {
    loadingElement = document.createElement('div');
    loadingElement.className = 'loading-indicator';
    loadingElement.innerHTML = '<div class="spinner"></div><p>Loading dashboard data...</p>';
    container.appendChild(loadingElement);
  } else {
    // If it exists, make sure it's visible
    loadingElement.style.display = 'flex';
  }
}

/**
 * Hide loading state for a container
 * @param {HTMLElement} container - Container element to hide loading state
 */
export function hideLoadingState(container) {
  if (!container) {
    console.error('Container not found for hideLoadingState');
    return;
  }
  
  // Remove loading class from container
  container.classList.remove('loading');
  
  // Hide loading indicator if it exists
  const loadingElement = container.querySelector('.loading-indicator');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}

/**
 * Show error state for a container
 * @param {HTMLElement} container - Container element to show error state
 * @param {string} message - Error message to display
 */
export function showErrorState(container, message = 'Failed to load dashboard data. Please try again later.') {
  if (!container) {
    console.error('Container not found for showErrorState');
    return;
  }
  
  // Remove loading state if it exists
  hideLoadingState(container);
  
  // Add error class to container
  container.classList.add('error');
  
  // Create or update error indicator
  let errorElement = container.querySelector('.error-indicator');
  if (!errorElement) {
    errorElement = document.createElement('div');
    errorElement.className = 'error-indicator';
    errorElement.innerHTML = `
      <div class="error-icon">⚠️</div>
      <p>${message}</p>
      <button class="retry-button">Retry</button>
    `;
    container.appendChild(errorElement);
  } else {
    errorElement.querySelector('p').textContent = message;
    errorElement.style.display = 'flex';
  }
  
  // Add retry button functionality
  const retryButton = errorElement.querySelector('.retry-button');
  if (retryButton) {
    // Remove any existing event listeners
    const newRetryButton = retryButton.cloneNode(true);
    retryButton.parentNode.replaceChild(newRetryButton, retryButton);
    
    newRetryButton.addEventListener('click', () => {
      // Import dynamically to avoid circular dependency
      import('../controllers/DashboardController.js').then(module => {
        const dashboardController = module.default;
        // Hide error state before retrying
        container.classList.remove('error');
        errorElement.style.display = 'none';
        // Retry loading data
        dashboardController.loadDashboardData();
      });
    });
  }
}