/**
 * Profile Tab Enhancement JavaScript
 * Adds interactive effects and animations to the profile tab
 */

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Set up profile photo container tilt effect
  setupProfilePhotoTilt();
  
  // Generate dynamic floating particles
  createFloatingParticles();
  
  // Add interactive effects to form elements
  enhanceFormInteractions();
  
  // Add effect to balance card
  enhanceBalanceCard();
});

/**
 * Sets up 3D tilt effect for profile photo
 */
function setupProfilePhotoTilt() {
  const container = document.querySelector('.profile-photo-container');
  if (!container) return;
  
  // Variables for tilt effect
  let tiltEffectSettings = {
    max: 15,     // max tilt rotation (deg)
    perspective: 1000,   // transform perspective, the lower the more extreme the tilt gets
    scale: 1.05,      // transform scale - 2 = 200%, 1.5 = 150%, etc
    speed: 500,    // transition speed - 500ms
    easing: "cubic-bezier(.03,.98,.52,.99)"    // transition easing
  };
  
  // Add event listeners for mouse movements
  container.addEventListener('mousemove', (e) => {
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const centerX = containerRect.left + containerWidth / 2;
    const centerY = containerRect.top + containerHeight / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateXUncapped = -1 * tiltEffectSettings.max * mouseY / (containerHeight / 2);
    const rotateYUncapped = tiltEffectSettings.max * mouseX / (containerWidth / 2);
    
    // Cap rotation to tiltEffectSettings.max
    const rotateX = rotateXUncapped < -tiltEffectSettings.max ? -tiltEffectSettings.max : 
                   (rotateXUncapped > tiltEffectSettings.max ? tiltEffectSettings.max : rotateXUncapped);
    const rotateY = rotateYUncapped < -tiltEffectSettings.max ? -tiltEffectSettings.max : 
                   (rotateYUncapped > tiltEffectSettings.max ? tiltEffectSettings.max : rotateYUncapped);
    
    // Apply transformation to container
    container.style.transform = `perspective(${tiltEffectSettings.perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${tiltEffectSettings.scale})`;
  });
  
  // Reset transform when mouse leaves
  container.addEventListener('mouseleave', () => {
    container.style.transform = `perspective(${tiltEffectSettings.perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
    container.style.transition = `all ${tiltEffectSettings.speed}ms ${tiltEffectSettings.easing}`;
  });
  
  // Set initial state
  container.addEventListener('mouseenter', () => {
    container.style.transition = `none`;
  });
  
  // Apply initial transform
  container.style.transform = `perspective(${tiltEffectSettings.perspective}px) rotateX(0deg) rotateY(0deg)`;
}

/**
 * Creates floating particles in the background
 */
function createFloatingParticles() {
  const profileBackground = document.querySelector('.profile-background');
  if (!profileBackground) return;
  
  // Clear existing particles first
  const existingParticles = profileBackground.querySelectorAll('.floating-particle');
  existingParticles.forEach(p => p.remove());
  
  // Generate new particles
  const particleCount = 20; // Number of particles
  const colors = [
    'linear-gradient(145deg, rgba(13, 153, 255, 0.25), rgba(11, 94, 215, 0.2))', 
    'linear-gradient(145deg, rgba(255, 255, 255, 0.2), rgba(220, 240, 255, 0.15))',
    'linear-gradient(145deg, rgba(89, 144, 222, 0.15), rgba(13, 153, 255, 0.1))',
    'linear-gradient(145deg, rgba(15, 170, 255, 0.15), rgba(11, 94, 215, 0.1))'
  ];
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.classList.add('floating-particle');
    
    // Random properties
    const size = Math.random() * 15 + 5; // 5-20px
    const top = Math.random() * 100; // 0-100%
    const left = Math.random() * 100; // 0-100%
    const duration = Math.random() * 15 + 10; // 10-25s
    const delay = Math.random() * 10; // 0-10s
    const distanceX = (Math.random() * 100 - 50); // -50px to +50px
    const distanceY = (Math.random() * 100 - 50); // -50px to +50px
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Apply styles
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.top = `${top}%`;
    particle.style.left = `${left}%`;
    particle.style.background = color;
    particle.style.boxShadow = '0 0 10px rgba(13, 153, 255, 0.2)';
    particle.style.setProperty('--duration', `${duration}s`);
    particle.style.setProperty('--distance-x', `${distanceX}px`);
    particle.style.setProperty('--distance-y', `${distanceY}px`);
    particle.style.animationDelay = `${delay}s`;
    particle.style.opacity = Math.random() * 0.35 + 0.15;
    
    // Add to background
    profileBackground.appendChild(particle);
  }
}

/**
 * Enhances form input interactions
 */
function enhanceFormInteractions() {
  const formGroups = document.querySelectorAll('.enhanced-form-group');
  if (!formGroups.length) return;
  
  formGroups.forEach(group => {
    const input = group.querySelector('input, .form-control');
    const label = group.querySelector('.enhanced-form-label');
    
    if (input) {
      // Focus effects
      input.addEventListener('focus', () => {
        group.classList.add('focused');
        group.style.transform = 'translateY(-3px)';
        
        if (label) {
          label.style.color = 'var(--primary-color)';
          label.style.transform = 'translateY(-2px)';
        }
        
        // Add subtle glow
        input.style.boxShadow = '0 5px 20px rgba(13, 153, 255, 0.15), inset 0 0 0 1px rgba(13, 153, 255, 0.3)';
      });
      
      input.addEventListener('blur', () => {
        group.classList.remove('focused');
        group.style.transform = 'translateY(0)';
        
        if (label) {
          label.style.color = '';
          label.style.transform = '';
        }
        
        // Remove glow
        input.style.boxShadow = '';
      });
      
      // Hover effects
      group.addEventListener('mouseenter', () => {
        if (!group.classList.contains('focused')) {
          group.style.transform = 'translateY(-2px)';
        }
      });
      
      group.addEventListener('mouseleave', () => {
        if (!group.classList.contains('focused')) {
          group.style.transform = 'translateY(0)';
        }
      });
    }
  });
}

/**
 * Enhances balance card with interactive effects
 */
function enhanceBalanceCard() {
  const balanceCard = document.querySelector('.enhanced-card');
  if (!balanceCard) return;
  
  balanceCard.addEventListener('mousemove', (e) => {
    const rect = balanceCard.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate distance from center (0-1)
    const distanceX = (x - centerX) / centerX;
    const distanceY = (y - centerY) / centerY;
    
    // Apply subtle tilt effect (max 5deg)
    balanceCard.style.transform = `translateY(-8px) rotateX(${-distanceY * 5}deg) rotateY(${distanceX * 5}deg)`;
    
    // Add dynamic light reflection based on mouse position
    balanceCard.style.background = `
      linear-gradient(
        145deg,
        rgba(13, 153, 255, 0.85),
        rgba(11, 94, 215, 0.9)
      )
    `;
    
    // Add inner light reflection that follows cursor
    balanceCard.style.boxShadow = `
      0 10px 30px rgba(11, 94, 215, 0.3),
      inset ${x/20}px ${y/20}px 30px rgba(255, 255, 255, 0.15)
    `;
  });
  
  balanceCard.addEventListener('mouseleave', () => {
    balanceCard.style.transform = '';
    balanceCard.style.background = '';
    balanceCard.style.boxShadow = '';
  });
  
  // Make deposit button more interactive
  const depositBtn = balanceCard.querySelector('.deposit-btn');
  if (depositBtn) {
    depositBtn.addEventListener('mouseenter', () => {
      depositBtn.style.transform = 'translateY(-2px) scale(1.05)';
      depositBtn.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
    });
    
    depositBtn.addEventListener('mouseleave', () => {
      depositBtn.style.transform = '';
      depositBtn.style.boxShadow = '';
    });
  }
}
