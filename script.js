// Initial Name Animation
function animateInitialName() {
    const prominentLetters = document.querySelectorAll('#initial-name .prominent');
    prominentLetters.forEach((letter, index) => {
        setTimeout(() => {
            letter.style.animationDelay = `${index * 0.2}s`;
        }, 0);
    });

    setTimeout(() => {
        fadeOutInitialName();
    }, prominentLetters.length * 170 + 1500);
}

function fadeOutInitialName() {
    document.querySelector('.container').classList.add('fade-in');
    const initialName = document.getElementById('initial-name');
    initialName.style.opacity = '0';
    setTimeout(() => {
        initialName.style.display = 'none';
    }, 1000);
}

// Line Symbol Container Animation
function handleLineSymbolContainers() {
    const containers = document.querySelectorAll('.line-symbol-container:not(.lets-connect-section .line-symbol-container)');
    const windowHeight = window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset;

    containers.forEach(container => {
        animateContainer(container, windowHeight, scrollY);
    });
}

function animateContainer(container, windowHeight, scrollY) {
    const containerPosition = container.getBoundingClientRect().top + scrollY;
    const containerVisiblePosition = windowHeight - 150;

    if (scrollY > containerPosition - containerVisiblePosition) {
        container.style.opacity = 1;
        container.style.transform = 'translateY(0)';
        rotateUnicodeSymbols(container, scrollY, containerPosition, containerVisiblePosition);
    } else {
        container.style.opacity = 0;
        container.style.transform = 'translateY(20px)';
    }
}

function rotateUnicodeSymbols(container, scrollY, containerPosition, containerVisiblePosition) {
    const unicodeSymbols = container.querySelectorAll('.unicode-symbol');
    unicodeSymbols.forEach(symbol => {
        const rotationDegree = (scrollY - containerPosition + containerVisiblePosition) * 2;
        symbol.style.transform = `rotate(${rotationDegree}deg)`;
    });
}

// Fade-in Scroll Animation
function handleFadeInScroll() {
    const elements = document.querySelectorAll('.fade-in-scroll:not(.lets-connect-section .fade-in-scroll)');
    elements.forEach(element => {
        animateElementOnScroll(element);
    });
}

function animateElementOnScroll(element) {
    const position = element.getBoundingClientRect();

    if(position.top < window.innerHeight && position.bottom >= 0) {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        element.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    } else {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
    }
}

// Project Items Animation
function handleProjectItems() {
    const projectItems = document.querySelectorAll('.project-section:not(.lets-connect-section .project-section)');
    const windowHeight = window.innerHeight;

    projectItems.forEach((item, index) => {
        animateProjectItem(item, index, windowHeight);
    });
}

function animateProjectItem(item, index, windowHeight) {
    const position = item.getBoundingClientRect();
    const isVisible = position.top < windowHeight;

    if (isVisible) {
        const zIndex = 90 - index;
        const translateY = Math.max(-30, -position.top * 0.05);
        const scale = 1 - Math.max(0, position.top * 0.0005);
        item.style.transform = `translateY(${translateY}px) scale(${scale})`;
        item.style.zIndex = zIndex;
        item.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
    } else {
        item.style.transform = 'translateY(30px) scale(0.9)';
        item.style.zIndex = 'auto';
        item.style.boxShadow = 'none';
    }
}

// Function for nav bar to change color as scroll
function changeHeaderOnScroll() {
    const header = document.querySelector('header');
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;

    if (scrollPosition > 80) { // Change '50' to the scroll position you prefer
        header.style.backgroundColor = 'rgba(0, 0, 0, 0.9)'; // Semi-opaque background
    } else {
        header.style.backgroundColor = 'rgba(255, 255, 255, 0)'; // Transparent background
    }
}



// Custom Cursor
function initCustomCursor() {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    let mouseX = 0, mouseY = 0;
    let outlineX = 0, outlineY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';
    });

    // Smooth follow effect for outline
    function animateOutline() {
        outlineX += (mouseX - outlineX) * 0.15;
        outlineY += (mouseY - outlineY) * 0.15;

        cursorOutline.style.left = outlineX + 'px';
        cursorOutline.style.top = outlineY + 'px';

        requestAnimationFrame(animateOutline);
    }
    animateOutline();

    // Hover effects
    const hoverElements = document.querySelectorAll('a, button, .magnetic-btn, .tech-item');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorDot.classList.add('hover');
            cursorOutline.classList.add('hover');
        });
        el.addEventListener('mouseleave', () => {
            cursorDot.classList.remove('hover');
            cursorOutline.classList.remove('hover');
        });
    });
}

// Magnetic Button Effect
function initMagneticButtons() {
    const magneticBtns = document.querySelectorAll('.magnetic-btn');

    magneticBtns.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });
}

// Reveal Sections on Scroll
function revealSections() {
    const sections = document.querySelectorAll('.reveal-section');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, {
        threshold: 0.15
    });

    sections.forEach(section => observer.observe(section));
}

// Enhanced Header Scroll Effect
function enhanceHeaderScroll() {
    const header = document.querySelector('header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Smooth Scroll for Navigation
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

// Parallax Effect for Background
function initParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.background-image');

        parallaxElements.forEach(el => {
            const speed = 0.5;
            el.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

// Event Listeners
window.onload = () => {
    animateInitialName();
    initCustomCursor();
    initMagneticButtons();
    revealSections();
    enhanceHeaderScroll();
    initSmoothScroll();
    initParallax();
};

window.addEventListener('scroll', () => {
    handleLineSymbolContainers();
    handleFadeInScroll();
    handleProjectItems();
    changeHeaderOnScroll();
});

