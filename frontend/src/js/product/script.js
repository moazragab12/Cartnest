// Simple JavaScript for interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Quantity buttons
    const minusBtn = document.querySelector('.minus');
    const plusBtn = document.querySelector('.plus');
    const qtyInput = document.querySelector('.qty-input');
    const maxQuantity = 12; // Maximum available quantity
    
    minusBtn.addEventListener('click', function() {
        let qty = parseInt(qtyInput.value);
        if (qty > 1) {
            qtyInput.value = qty - 1;
        }
    });
    
    plusBtn.addEventListener('click', function() {
        let qty = parseInt(qtyInput.value);
        if (qty < maxQuantity) {
            qtyInput.value = qty + 1;
        } else {
            // Show a message that max quantity is reached
            showNotification('Sorry, only ' + maxQuantity + ' items available in stock.');
        }
    });
    
    // Validate manual input
    qtyInput.addEventListener('change', function() {
        let qty = parseInt(qtyInput.value);
        if (isNaN(qty) || qty < 1) {
            qtyInput.value = 1;
        } else if (qty > maxQuantity) {
            qtyInput.value = maxQuantity;
            showNotification('Sorry, only ' + maxQuantity + ' items available in stock.');
        }
    });
    
    // Color selection
    const colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            colorBtns.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            
            // Update color text
            const colorText = document.querySelector('.color-options h3');
            if (this.classList.contains('blue')) colorText.textContent = 'Color: Blue';
            if (this.classList.contains('orange')) colorText.textContent = 'Color: Orange';
            if (this.classList.contains('silver')) colorText.textContent = 'Color: Silver';
            if (this.classList.contains('black')) colorText.textContent = 'Color: Black';
        });
    });
    
    // Storage selection
    const storageBtns = document.querySelectorAll('.storage-options button');
    storageBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            storageBtns.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Image Carousel - Enhanced version
    const mainImages = document.querySelectorAll('.image-container img');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const prevBtn = document.querySelector('.nav-btn.prev');
    const nextBtn = document.querySelector('.nav-btn.next');
    const imageContainer = document.querySelector('.image-container');
    let currentIndex = 0;
    let isTransitioning = false;
    
    // Function to show image at specific index with improved transition
    function showImage(index) {
        if (isTransitioning || index === currentIndex) return;
        isTransitioning = true;
        
        // Apply fade out to current image
        mainImages[currentIndex].style.opacity = '0';
        
        setTimeout(() => {
            // Hide all images
            mainImages.forEach(img => {
                img.classList.remove('active');
            });
            
            // Show selected image with fade in
            mainImages[index].classList.add('active');
            mainImages[index].style.opacity = '1';
            
            // Update thumbnails
            thumbnails.forEach(thumb => thumb.classList.remove('active'));
            thumbnails[index].classList.add('active');
            
            // Scroll the thumbnail into view if necessary
            const thumbnailsContainer = document.querySelector('.thumbnail-gallery');
            const activeThumb = thumbnails[index];
            const containerRect = thumbnailsContainer.getBoundingClientRect();
            const activeRect = activeThumb.getBoundingClientRect();
            
            if (activeRect.right > containerRect.right) {
                thumbnailsContainer.scrollLeft += (activeRect.right - containerRect.right + 10);
            } else if (activeRect.left < containerRect.left) {
                thumbnailsContainer.scrollLeft -= (containerRect.left - activeRect.left + 10);
            }
            
            // Update current index
            currentIndex = index;
            isTransitioning = false;
        }, 300); // Match this with CSS transition duration
    }
    
    // Next button click with debounce
    nextBtn.addEventListener('click', function() {
        if (!isTransitioning) {
            let newIndex = (currentIndex + 1) % mainImages.length;
            showImage(newIndex);
        }
    });
    
    // Previous button click with debounce
    prevBtn.addEventListener('click', function() {
        if (!isTransitioning) {
            let newIndex = (currentIndex - 1 + mainImages.length) % mainImages.length;
            showImage(newIndex);
        }
    });
    
    // Thumbnail click with improved feedback
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function() {
            let index = parseInt(this.getAttribute('data-index'));
            
            // Apply visual feedback on click
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
            
            showImage(index);
        });
    });
    
    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (document.querySelector('.product-images:hover')) {
            if (e.key === 'ArrowRight') {
                if (!isTransitioning) {
                    let newIndex = (currentIndex + 1) % mainImages.length;
                    showImage(newIndex);
                }
            } else if (e.key === 'ArrowLeft') {
                if (!isTransitioning) {
                    let newIndex = (currentIndex - 1 + mainImages.length) % mainImages.length;
                    showImage(newIndex);
                }
            }
        }
    });
    
    // Add touch swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    imageContainer.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    imageContainer.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
            // Swipe left - show next
            if (!isTransitioning) {
                let newIndex = (currentIndex + 1) % mainImages.length;
                showImage(newIndex);
            }
        } else if (touchEndX > touchStartX + 50) {
            // Swipe right - show previous
            if (!isTransitioning) {
                let newIndex = (currentIndex - 1 + mainImages.length) % mainImages.length;
                showImage(newIndex);
            }
        }
    }
    
    // Initialize first image
    showImage(0);
    
    // Shipping option selection
    const shippingOptions = document.querySelectorAll('.shipping-option');
    shippingOptions.forEach(option => {
        option.addEventListener('click', function() {
            shippingOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Add to cart
    const addToCartBtn = document.querySelector('.add-to-cart-btn');
    addToCartBtn.addEventListener('click', function() {
        showNotification('Product added to cart!');
        this.classList.add('pulse');
        setTimeout(() => {
            this.classList.remove('pulse');
        }, 2000);
    });
    
    // Wishlist button
    const wishlistBtn = document.querySelector('.wishlist-btn');
    wishlistBtn.addEventListener('click', function() {
        this.classList.toggle('active');
        const icon = this.querySelector('i');
        
        if (this.classList.contains('active')) {
            icon.className = 'fas fa-heart';
            showNotification('Added to wishlist!');
        } else {
            icon.className = 'far fa-heart';
            showNotification('Removed from wishlist!');
        }
    });
    
    // Compare button
    const compareBtn = document.querySelector('.compare-btn');
    compareBtn.addEventListener('click', function() {
        this.classList.toggle('active');
        
        if (this.classList.contains('active')) {
            showNotification('Added to compare!');
        } else {
            showNotification('Removed from compare!');
        }
    });
    
    // Related Products and Viewed Products carousel navigation
    const carouselPrevBtns = document.querySelectorAll('.carousel-btn.prev-btn');
    const carouselNextBtns = document.querySelectorAll('.carousel-btn.next-btn');
    
    carouselPrevBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const productsGrid = this.closest('.products-grid');
            productsGrid.scrollBy({
                left: -300,
                behavior: 'smooth'
            });
        });
    });
    
    carouselNextBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const productsGrid = this.closest('.products-grid');
            productsGrid.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
        });
    });
    
    // Add to cart from product cards
    const addToCartIcons = document.querySelectorAll('.add-to-cart-icon');
    addToCartIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const productName = this.closest('.product-card').querySelector('.product-name').textContent;
            showNotification(`${productName} added to cart!`);
            this.classList.add('pulse');
            setTimeout(() => {
                this.classList.remove('pulse');
            }, 2000);
        });
    });
    
    // Notification function
    function showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Add smooth fade-in effect when page loads
    document.body.classList.add('loaded');
    
    // Add hover effects to buttons
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-1px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
        
        button.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(1px)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-1px)';
        });
    });
    
    // Animate rating bars on scroll
    const ratingBars = document.querySelectorAll('.bar');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.width = entry.target.style.getPropertyValue('--width');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    ratingBars.forEach(bar => {
        observer.observe(bar);
    });
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add animation to product content on load
    setTimeout(() => {
        document.querySelector('.product-content').style.opacity = '1';
    }, 300);
});
