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



// Event Listeners
window.onload = animateInitialName;

window.addEventListener('scroll', () => {
    handleLineSymbolContainers();
    handleFadeInScroll();
    handleProjectItems();
    changeHeaderOnScroll();
});

