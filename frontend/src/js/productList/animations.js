// Animation and interaction enhancements for the product list page

document.addEventListener('DOMContentLoaded', () => {
    // Set up enhanced sidebar behavior with dynamic scrolling
    setupEnhancedSidebar();

    // Add Clear Filters functionality
    setupClearFilters();
});

// Enhanced sidebar with dynamic scrolling behavior - only scroll when needed
function setupEnhancedSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    // Function to check if sidebar needs scrolling
    function checkSidebarOverflow() {
        // Calculate sidebar content height
        const sidebarContent = Array.from(sidebar.children).reduce(
            (total, child) => total + child.offsetHeight, 0
        );
        
        // Get viewport height minus header
        const viewportHeight = window.innerHeight;
        const headerHeight = document.querySelector('.header')?.offsetHeight || 0;
        const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        const topOffset = 90 + 30; // top position + padding
        
        // Available height for sidebar
        const availableHeight = viewportHeight - headerHeight - navbarHeight - topOffset;
        
        // Add or remove scrolling class based on content height
        if (sidebarContent > availableHeight) {
            sidebar.classList.add('needs-scroll');
        } else {
            sidebar.classList.remove('needs-scroll');
        }
    }
    
    // Check initially
    checkSidebarOverflow();
    
    // Add listeners for detail elements open/close state
    const detailsElements = sidebar.querySelectorAll('details');
    detailsElements.forEach(details => {
        details.addEventListener('toggle', () => {
            // Wait a moment for content to expand
            setTimeout(checkSidebarOverflow, 10);
        });
    });
    
    // Add scroll to relevant section when clicking on filter headers
    const summaries = sidebar.querySelectorAll('summary');
    summaries.forEach(summary => {
        summary.addEventListener('click', () => {
            // Get the details element and check if it's opening
            const details = summary.parentElement;
            if (!details.hasAttribute('open')) {
                // Enable scrolling before expanding content
                sidebar.classList.add('needs-scroll');
                
                // Wait for animation then scroll to the section
                setTimeout(() => {
                    const topPosition = summary.offsetTop - 20;
                    sidebar.scrollTo({
                        top: topPosition,
                        behavior: 'smooth'
                    });
                }, 10);
            }
        });
    });

    // Make sidebar position sticky correctly
    function adjustSidebarHeight() {
        // Run overflow check when window is resized
        checkSidebarOverflow();
    }

    // Listen for window resize events
    window.addEventListener('resize', adjustSidebarHeight);
}

// Setup Clear Filters functionality
function setupClearFilters() {
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (!clearFiltersBtn) return;

    clearFiltersBtn.addEventListener('click', () => {
        // Clear all checkboxes
        const checkboxes = document.querySelectorAll('.sidebar input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // Reset price inputs if they exist
        const minInput = document.querySelector('.input-min');
        const maxInput = document.querySelector('.input-max');
        if (minInput && maxInput) {
            minInput.value = '0';
            maxInput.value = '999';
        }

        // Visual feedback that filters were cleared
        clearFiltersBtn.textContent = 'Filters Cleared!';
        clearFiltersBtn.style.backgroundColor = '#e6f4ff';
        clearFiltersBtn.style.color = '#0D99FF';
        clearFiltersBtn.style.borderColor = '#0D99FF';
        
        setTimeout(() => {
            clearFiltersBtn.textContent = 'Clear all filters';
            clearFiltersBtn.style.backgroundColor = '';
            clearFiltersBtn.style.color = '';
            clearFiltersBtn.style.borderColor = '';
        }, 1500);

        // Scroll sidebar to top
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    });
}

// Initialize all details elements to be closed when the page loads
function initializeCollapsibleSections() {
    const allDetails = document.querySelectorAll('.sidebar details');
    allDetails.forEach(detail => {
        detail.removeAttribute('open');
    });
}

// Enhanced sticky sidebar behavior with scroll effects
function setupEnhancedStickySidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Create container for sidebar if it doesn't exist
    if (!sidebar.parentElement.classList.contains('sidebar-container')) {
        const sidebarContainer = document.createElement('div');
        sidebarContainer.classList.add('sidebar-container');
        sidebar.parentNode.insertBefore(sidebarContainer, sidebar);
        sidebarContainer.appendChild(sidebar);
    }

    const sidebarContainer = sidebar.parentElement;
    const sidebarTop = sidebar.getBoundingClientRect().top + window.scrollY;
    const header = document.querySelector('.header');
    const navbar = document.querySelector('.navbar');
    
    let lastScrollTop = 0;
    const scrollThreshold = 50; // Threshold for scroll direction change (in px)

    // Add scroll event listener with throttling for performance
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleStickyScroll();
                ticking = false;
            });
            ticking = true;
        }
    });

    function handleStickyScroll() {
        const scrollTop = window.scrollY;
        const headerHeight = header ? header.offsetHeight : 0;
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const headerOffset = headerHeight + navbarHeight + 20;
        
        // Calculate scroll direction and speed
        const scrollDirection = scrollTop > lastScrollTop ? 'down' : 'up';
        const scrollSpeed = Math.abs(scrollTop - lastScrollTop);
        lastScrollTop = scrollTop;

        if (scrollTop > sidebarTop - headerOffset) {
            // Apply sticky class
            sidebar.classList.add('sticky');
            sidebarContainer.classList.add('sticky-activated');
            
            // Adjust top position based on scroll direction for smoother experience
            const topOffset = scrollDirection === 'down' && scrollSpeed > scrollThreshold ? 
                headerOffset + 5 : headerOffset;
                
            sidebar.style.top = `${topOffset}px`;
            
            // Add parallax effect based on scroll speed
            if (scrollSpeed > 10) {
                const parallaxOffset = Math.min(scrollSpeed / 20, 5);
                const transformValue = scrollDirection === 'down' ? 
                    `translateY(${parallaxOffset}px)` : 
                    `translateY(-${parallaxOffset}px)`;
                sidebar.style.transform = transformValue;
                
                // Reset transform after short delay
                setTimeout(() => {
                    sidebar.style.transform = 'translateY(0)';
                }, 200);
            }
        } else {
            // Remove sticky class
            sidebar.classList.remove('sticky');
            sidebarContainer.classList.remove('sticky-activated');
            sidebar.style.top = '90px';
            sidebar.style.transform = 'translateY(0)';
        }

        // Handle footer overlap
        const footer = document.querySelector('footer');
        if (footer) {
            const footerRect = footer.getBoundingClientRect();
            const sidebarRect = sidebar.getBoundingClientRect();
            
            if (footerRect.top < sidebarRect.bottom) {
                const overlapAmount = sidebarRect.bottom - footerRect.top;
                sidebar.style.transform = `translateY(-${overlapAmount}px)`;
            }
        } else {
            // If no footer, check for bottom of page
            const footerOffset = document.body.scrollHeight - window.innerHeight - 100;
            if (scrollTop > footerOffset) {
                sidebar.style.transform = `translateY(${footerOffset - scrollTop}px)`;
            }
        }
    }

    // Add hover effects for sticky sidebar
    sidebar.addEventListener('mouseenter', () => {
        if (sidebar.classList.contains('sticky')) {
            sidebar.style.boxShadow = '0 15px 45px rgba(13, 153, 255, 0.12)';
        }
    });

    sidebar.addEventListener('mouseleave', () => {
        if (sidebar.classList.contains('sticky')) {
            sidebar.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.12)';
        }
    });

    // Initialize position on page load
    setTimeout(handleStickyScroll, 100);
}

// Set up price range slider functionality
function setupPriceRangeSlider() {
    const rangeSlider = document.querySelector('.price-range-slider');
    
    // If there's no range slider (for example, on smaller screens), exit early
    if (!rangeSlider) return;
    
    const minSlider = document.querySelector('.range-slider-min');
    const maxSlider = document.querySelector('.range-slider-max');
    const rangeTrack = document.querySelector('.range-slider-track');
    const minInput = document.querySelector('.input-min');
    const maxInput = document.querySelector('.input-max');
    
    // Update the range track width and position with animation
    function updateRangeTrack() {
        const minPct = ((minSlider.value - minSlider.min) / (minSlider.max - minSlider.min)) * 100;
        const maxPct = ((maxSlider.value - minSlider.min) / (minSlider.max - minSlider.min)) * 100;
        
        // Apply with animation
        rangeTrack.style.transition = 'all 0.3s ease';
        rangeTrack.style.left = minPct + '%';
        rangeTrack.style.width = (maxPct - minPct) + '%';
        
        // Add pulse animation when track changes
        rangeTrack.classList.add('pulse-track');
        setTimeout(() => {
            rangeTrack.classList.remove('pulse-track');
        }, 400);
    }
    
    // Update input fields when sliders change with enhanced feedback
    minSlider.addEventListener('input', () => {
        const minVal = parseInt(minSlider.value);
        const maxVal = parseInt(maxSlider.value);
        
        if (minVal > maxVal) {
            minSlider.value = maxVal;
        }
        
        minInput.value = minSlider.value;
        updateRangeTrack();
        
        // Add visual feedback
        minInput.style.transition = 'all 0.2s ease';
        minInput.style.backgroundColor = 'rgba(13, 153, 255, 0.05)';
        setTimeout(() => {
            minInput.style.backgroundColor = '';
        }, 400);
    });
    
    maxSlider.addEventListener('input', () => {
        const minVal = parseInt(minSlider.value);
        const maxVal = parseInt(maxSlider.value);
        
        if (maxVal < minVal) {
            maxSlider.value = minVal;
        }
        
        maxInput.value = maxSlider.value;
        updateRangeTrack();
        
        // Add visual feedback
        maxInput.style.transition = 'all 0.2s ease';
        maxInput.style.backgroundColor = 'rgba(13, 153, 255, 0.05)';
        setTimeout(() => {
            maxInput.style.backgroundColor = '';
        }, 400);
    });
    
    // Update sliders when input fields change
    minInput.addEventListener('change', () => {
        const minVal = parseInt(minInput.value || minSlider.min);
        const maxVal = parseInt(maxInput.value || maxSlider.max);
        
        if (minVal < parseInt(minSlider.min)) {
            minInput.value = minSlider.min;
        } else if (minVal > maxVal) {
            minInput.value = maxVal;
        }
        
        minSlider.value = minInput.value;
        updateRangeTrack();
    });
    
    maxInput.addEventListener('change', () => {
        const minVal = parseInt(minInput.value || minSlider.min);
        const maxVal = parseInt(maxInput.value || maxSlider.max);
        
        if (maxVal > parseInt(maxSlider.max)) {
            maxInput.value = maxSlider.max;
        } else if (maxVal < minVal) {
            maxInput.value = minVal;
        }
        
        maxSlider.value = maxInput.value;
        updateRangeTrack();
    });
    
    // Enhanced apply button functionality
    const applyBtn = document.querySelector('.apply-btn');
    if (applyBtn) {
        applyBtn.addEventListener('click', (e) => {
            // Add ripple effect
            createRippleEffect(applyBtn, e);
            
            // Add clicked class for animation
            applyBtn.classList.add('clicked');
            
            // Add textual feedback
            const originalText = applyBtn.textContent;
            applyBtn.textContent = 'Applied!';
            
            setTimeout(() => {
                applyBtn.classList.remove('clicked');
                applyBtn.textContent = originalText;
            }, 1200);
        });
    }
    
    // Initialize track position
    updateRangeTrack();
}

// Add animations to filter interactions
function setupFilterAnimations() {
    // Add a clear all filters button at the bottom of the sidebar
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar.querySelector('.clear-filters-btn')) {
        const clearBtn = document.createElement('button');
        clearBtn.classList.add('clear-filters-btn');
        clearBtn.textContent = 'Clear All Filters';
        sidebar.appendChild(clearBtn);
        
        clearBtn.addEventListener('click', (e) => {
            // Add ripple effect
            createRippleEffect(clearBtn, e);
            
            // Clear all checkboxes
            document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(checkbox => {
                if (checkbox.checked) {
                    checkbox.checked = false;
                    animatePulse(checkbox.parentElement);
                }
            });
            
            // Reset price range
            const minInput = document.querySelector('.input-min');
            const maxInput = document.querySelector('.input-max');
            const minSlider = document.querySelector('.range-slider-min');
            const maxSlider = document.querySelector('.range-slider-max');
            
            if (minInput && maxInput && minSlider && maxSlider) {
                minInput.value = minSlider.min;
                maxInput.value = maxSlider.max;
                minSlider.value = minSlider.min;
                maxSlider.value = maxSlider.max;
                
                // Update range track if it exists
                const rangeTrack = document.querySelector('.range-slider-track');
                if (rangeTrack) {
                    rangeTrack.style.left = '0%';
                    rangeTrack.style.width = '100%';
                }
            }
            
            // Add temporary feedback
            clearBtn.textContent = 'Filters Cleared';
            setTimeout(() => {
                clearBtn.textContent = 'Clear All Filters';
            }, 1200);
        });
    }

    // Enhanced checkbox interaction
    document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                animatePulse(checkbox.parentElement);
            }
        });
    });

    // Enhanced summary interactions
    document.querySelectorAll('.sidebar summary').forEach(summary => {
        summary.addEventListener('click', (e) => {
            // Add ripple effect
            createRippleEffect(summary, e);
            
            // Add hover sound when available
            playInteractionSound('click');
        });
    });
    
    // Make "See all" links interactive with enhanced animations
    document.querySelectorAll('.see-all').forEach(link => {
        link.addEventListener('click', (e) => {
            // Add ripple effect
            createRippleEffect(link, e);
            
            const categoryList = link.previousElementSibling;
            const listItems = categoryList.querySelectorAll('li');
            
            // If we're showing only a few items
            if (!categoryList.classList.contains('expanded')) {
                // Stagger animation for showing items
                listItems.forEach((item, index) => {
                    if (index >= 5) {
                        setTimeout(() => {
                            item.style.display = 'flex';
                            item.style.opacity = '0';
                            item.style.transform = 'translateY(-10px)';
                            
                            setTimeout(() => {
                                item.style.transition = 'all 0.3s ease';
                                item.style.opacity = '1';
                                item.style.transform = 'translateY(0)';
                            }, 10);
                        }, (index - 5) * 60);
                    }
                });
                
                categoryList.classList.add('expanded');
                link.textContent = 'See less';
            } else {
                // Hide items after the 5th one with fade out
                listItems.forEach((item, index) => {
                    if (index >= 5) {
                        item.style.transition = 'all 0.2s ease';
                        item.style.opacity = '0';
                        item.style.transform = 'translateY(-5px)';
                        
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 200);
                    }
                });
                
                categoryList.classList.remove('expanded');
                link.textContent = 'See all';
            }
        });
        
        // Initially hide items after the 5th one
        const categoryList = link.previousElementSibling;
        const listItems = categoryList.querySelectorAll('li');
        
        listItems.forEach((item, index) => {
            if (index >= 5) {
                item.style.display = 'none';
            }
        });
    });
}

// Helper function to animate a pulse effect on elements
function animatePulse(element) {
    element.style.animation = 'none';
    element.offsetHeight; // Trigger reflow
    element.style.animation = 'pulse 0.5s ease';
}

// Helper function to create ripple effect
function createRippleEffect(element, event) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode === element) {
            element.removeChild(ripple);
        }
    }, 600);
}

// Optional helper function to play subtle interaction sounds
function playInteractionSound(type) {
    // Only implement if site has audio enabled
    // This is just a placeholder for potential audio feedback
}