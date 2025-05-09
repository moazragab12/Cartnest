/**
 * Ensure that cart badge shows the correct count for productsList page
 */
document.addEventListener('DOMContentLoaded', () => {
  // Wait for everything to load, then explicitly update the cart badge
  setTimeout(() => {
    try {
      console.log('Ensuring cart badge is updated...');
      
      // First try to use the cartManager directly
      if (window.cartManager) {
        if (typeof window.cartManager.updateCartBadge === 'function') {
          window.cartManager.updateCartBadge();
          console.log('Cart badge updated via cartManager.updateCartBadge()');
        } 
        else if (typeof window.cartManager.getTotalQuantity === 'function') {
          const cartBadge = document.getElementById('cart-badge');
          if (cartBadge) {
            const totalItems = window.cartManager.getTotalQuantity();
            cartBadge.textContent = totalItems;
            
            if (totalItems > 0) {
              cartBadge.style.display = 'flex';
            } else {
              cartBadge.style.display = 'none';
            }
            console.log('Cart badge updated via getTotalQuantity():', totalItems);
          }
        }
      }
      // Fallback to direct cart access
      else {
        // Try to get cart from localStorage
        try {
          const storedCart = localStorage.getItem('cart');
          if (storedCart) {
            const cart = JSON.parse(storedCart);
            const cartBadge = document.getElementById('cart-badge');
            
            if (cartBadge) {
              let totalItems = 0;
              
              if (Array.isArray(cart)) {
                totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
              } else if (typeof cart === 'object') {
                totalItems = Object.keys(cart).length;
              }
              
              cartBadge.textContent = totalItems;
              
              if (totalItems > 0) {
                cartBadge.style.display = 'flex';
              } else {
                cartBadge.style.display = 'none';
              }
              
              console.log('Cart badge updated from localStorage, count:', totalItems);
            }
          }
        } catch (e) {
          console.warn('Failed to update cart badge:', e);
        }
      }
    } catch (error) {
      console.error('Error in ensure-cart-badge.js:', error);
    }
  }, 500); // Wait 500ms after DOMContentLoaded to ensure all other scripts have run
});
