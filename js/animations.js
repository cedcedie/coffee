// Scroll-triggered animations
document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observer for scroll animations - only triggers once when entering viewport
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after animation triggers - ensures it only happens once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all scroll-triggered elements
    document.querySelectorAll('.scroll-fade-in, .scroll-scale-in, .scroll-slide-left, .scroll-slide-right').forEach(el => {
        observer.observe(el);
    });

    // Navbar scroll effect
    let lastScroll = 0;
    const navbar = document.querySelector('nav');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (navbar) {
            if (currentScroll > 100) {
                navbar.classList.add('shadow-lg');
                navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
            } else {
                navbar.classList.remove('shadow-lg');
                navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            }
        }
        
        lastScroll = currentScroll;
    });

    // Removed parallax - elements should stay in place, only animate when entering viewport

    // Smooth page transitions
    document.querySelectorAll('a[href^="#"], a[href$=".html"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            
            // Only handle internal links
            if (href.startsWith('#') || href.endsWith('.html')) {
                // Add fade out effect
                document.body.style.opacity = '0';
                document.body.style.transition = 'opacity 0.3s ease-out';
                
                setTimeout(() => {
                    if (href.startsWith('#')) {
                        // Smooth scroll to anchor
                        const target = document.querySelector(href);
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }
                    // For .html links, let browser handle navigation
                    // The fade in will happen on page load
                }, 150);
            }
        });
    });

    // Page load animation
    window.addEventListener('load', () => {
        document.body.style.opacity = '1';
        document.body.style.transition = 'opacity 0.5s ease-in';
        
        // Animate elements on page load
        document.querySelectorAll('.animate-on-load').forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 100);
        });
    });

    // Add stagger animation to children
    document.querySelectorAll('.stagger-children > *').forEach((child, index) => {
        child.style.animationDelay = `${index * 0.1}s`;
    });
});

// Utility function to add scroll animation to element
function addScrollAnimation(element, animationType = 'fade-in') {
    element.classList.add(`scroll-${animationType}`);
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    observer.observe(element);
}

