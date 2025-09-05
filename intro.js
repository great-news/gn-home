console.log("Hello World");

// Track drag state for drag-to-pop interaction
let isDragging = false;
let bubblesPopped = false;
let mousePressed = false;
let poppedBubblesInCurrentDrag = new Set(); // Track bubbles popped in current drag session

// Scale down wraps when dragging starts
function scaleDownWraps() {
    const gnGWrap = document.querySelector('.gn-g-wrap');
    const gnNWrap = document.querySelector('.gn-n-wrap');
    
    if (gnGWrap) {
        gsap.to(gnGWrap, {
            scale: 0.95,
            duration: 0.2,
            ease: "power2.out"
        });
    }
    
    if (gnNWrap) {
        gsap.to(gnNWrap, {
            scale: 0.95,
            duration: 0.2,
            ease: "power2.out"
        });
    }
}

// Scale up wraps and cycle when dragging stops
function onDragEnd() {
    console.log('Drag ended, bubblesPopped:', bubblesPopped);
    
    const gnGWrap = document.querySelector('.gn-g-wrap');
    const gnNWrap = document.querySelector('.gn-n-wrap');
    
    console.log('Found wraps:', { gnGWrap: !!gnGWrap, gnNWrap: !!gnNWrap });
    
    // Store the flag value before resetting it
    const shouldCycle = bubblesPopped;
    
    if (gnGWrap) {
        gsap.to(gnGWrap, {
            scale: 1,
            duration: 0.2,
            ease: "back.out(1.2)",
            onComplete: () => {
                console.log('Scale animation complete, shouldCycle:', shouldCycle);
                // Only cycle if bubbles were actually popped during drag
                if (shouldCycle) {
                    console.log('Cycling elements after drag');
                    cycleGnElements();
                } else {
                    console.log('Not cycling - no bubbles were popped');
                }
            }
        });
    }
    
    if (gnNWrap) {
        gsap.to(gnNWrap, {
            scale: 1,
            duration: 0.2,
            ease: "back.out(1.2)"
        });
    }
    
    // If no wraps exist, still cycle (only if bubbles were popped)
    if (!gnGWrap && !gnNWrap && shouldCycle) {
        console.log('Cycling elements after drag (no wraps)');
        cycleGnElements();
    }
    
    // Reset the flag for next drag session
    bubblesPopped = false;
}

// Add drag event listeners to bubbles-wrap
function addDragListeners() {
    const bubblesWrap = document.querySelector('.bubbles-wrap');
    
    if (bubblesWrap) {
        // Mouse events scoped to bubbles-wrap
        bubblesWrap.addEventListener('mousedown', () => {
            if (!mousePressed && !isDragging) {
                console.log('Mouse pressed in bubbles-wrap');
                mousePressed = true;
                bubblesPopped = false; // Reset flag
                poppedBubblesInCurrentDrag.clear(); // Reset popped bubbles for new drag session
            }
        });

        bubblesWrap.addEventListener('mousemove', () => {
            if (mousePressed && !isDragging) {
                console.log('Starting drag from bubbles-wrap');
                isDragging = true;
                scaleDownWraps();
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                console.log('Ending drag');
                isDragging = false;
                onDragEnd();
            }
            mousePressed = false;
        });

        // Touch events scoped to bubbles-wrap
        bubblesWrap.addEventListener('touchstart', (e) => {
            if (!mousePressed && !isDragging) {
                console.log('Touch pressed in bubbles-wrap');
                mousePressed = true;
                bubblesPopped = false; // Reset flag
                poppedBubblesInCurrentDrag.clear(); // Reset popped bubbles for new drag session
            }
        });

        bubblesWrap.addEventListener('touchmove', (e) => {
            if (mousePressed && !isDragging) {
                console.log('Starting touch drag from bubbles-wrap');
                e.preventDefault(); // Prevent scrolling while dragging
                isDragging = true;
                scaleDownWraps();
            } else if (isDragging) {
                e.preventDefault(); // Continue preventing scrolling during drag
                
                // Get touch position and find element underneath
                const touch = e.touches[0];
                if (touch) {
                    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
                    
                    // Check if the element is a bubble or inside a bubble
                    let bubble = null;
                    if (elementUnderTouch) {
                        if (elementUnderTouch.classList.contains('bubble')) {
                            bubble = elementUnderTouch;
                        } else {
                            // Check if it's inside a bubble
                            bubble = elementUnderTouch.closest('.bubble');
                        }
                    }
                    
                    // Pop the bubble if found and not already popped in this drag session
                    if (bubble && bubble.style.pointerEvents !== 'none' && !poppedBubblesInCurrentDrag.has(bubble)) {
                        console.log('Bubble popped during touch drag');
                        popBubble(bubble);
                        bubblesPopped = true; // Track that a bubble was popped during drag
                        poppedBubblesInCurrentDrag.add(bubble); // Mark this bubble as popped in current drag
                    }
                }
            }
        });

        document.addEventListener('touchend', () => {
            if (isDragging) {
                console.log('Ending touch drag');
                isDragging = false;
                onDragEnd();
            }
            mousePressed = false;
        });
    }
}

// Track current visible states for cycling wraps
let currentGnGIndex = 1;
let currentGnNIndex = 1;

// Initialize gn wraps on page load
function initializeGnWraps() {
    const gnGWrap = document.querySelector('.gn-g-wrap');
    const gnNWrap = document.querySelector('.gn-n-wrap');
    
    if (gnGWrap) {
        const gnGElements = gnGWrap.querySelectorAll('[class*="gn-g"]');
        
        gnGElements.forEach(el => {
            // Hide all elements first
            el.style.opacity = '0';
        });
        
        // Find and show the _1 element (note: space not dot in class name)
        const firstGnG = gnGWrap.querySelector('.gn-g._1');
        if (firstGnG) firstGnG.style.opacity = '1';
    }
    
    if (gnNWrap) {
        const gnNElements = gnNWrap.querySelectorAll('[class*="gn-n"]');
        
        gnNElements.forEach(el => {
            // Hide all elements first
            el.style.opacity = '0';
        });
        
        // Find and show the _1 element (note: space not dot in class name)  
        const firstGnN = gnNWrap.querySelector('.gn-n._1');
        if (firstGnN) firstGnN.style.opacity = '1';
    }
}

// Cycle to next gn elements
function cycleGnElements() {
    const gnGWrap = document.querySelector('.gn-g-wrap');
    const gnNWrap = document.querySelector('.gn-n-wrap');
    
    if (gnGWrap) {
        const current = gnGWrap.querySelector(`.gn-g._${currentGnGIndex}`);
        if (current) current.style.opacity = '0';
        
        currentGnGIndex++;
        let next = gnGWrap.querySelector(`.gn-g._${currentGnGIndex}`);
        if (!next) {
            currentGnGIndex = 1;
            next = gnGWrap.querySelector(`.gn-g._${currentGnGIndex}`);
        }
        if (next) next.style.opacity = '1';
    }
    
    if (gnNWrap) {
        const current = gnNWrap.querySelector(`.gn-n._${currentGnNIndex}`);
        if (current) current.style.opacity = '0';
        
        currentGnNIndex++;
        let next = gnNWrap.querySelector(`.gn-n._${currentGnNIndex}`);
        if (!next) {
            currentGnNIndex = 1;
            next = gnNWrap.querySelector(`.gn-n._${currentGnNIndex}`);
        }
        if (next) next.style.opacity = '1';
    }
}

// Create circular overlay
function createCircularOverlay(bubble) {
    const overlay = document.createElement('div');
    overlay.classList.add('bubble-overlay');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
    overlay.style.borderRadius = '50%';
    overlay.style.pointerEvents = 'none';
    bubble.appendChild(overlay);
    return overlay;
}

// Remove circular overlay
function removeCircularOverlay(bubble) {
    const overlay = bubble.querySelector('.bubble-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Reset wraps scale
function resetWrapsScale() {
    const gnGWrap = document.querySelector('.gn-g-wrap');
    const gnNWrap = document.querySelector('.gn-n-wrap');
    
    if (gnGWrap) {
        gsap.to(gnGWrap, {
            scale: 1,
            duration: 0.2,
            ease: "back.out(1.2)"
        });
    }
    
    if (gnNWrap) {
        gsap.to(gnNWrap, {
            scale: 1,
            duration: 0.2,
            ease: "back.out(1.2)"
        });
    }
}

// Reusable pop animation function
function popBubble(bubble) {
    // Disable pointer events on popped bubblet
    bubble.style.pointerEvents = 'none';
    
    // Remove any overlay that might be present
    removeCircularOverlay(bubble);
    
    gsap.to(bubble, {
        scale: 1.15,
        duration: 0.2,
        ease: "back.out(1.7)"
    });
    gsap.to(bubble, {
        opacity: 0,
        duration: 0.3,
        delay: 0.1,
        ease: "power2.out"
    });
}

// Page load animation system
class PageLoadAnimations {
    constructor() {
        this.animations = [];
        this.isInitialLoad = true;
    }
    
    // Register an animation to run on page load
    register(name, animationFn, delay = 0) {
        this.animations.push({ name, animationFn, delay });
    }
    
    // Run all registered page load animations
    async runAll() {
        if (!this.isInitialLoad) return;
        
        console.log('Running page load animations...');
        
        // Sort animations by delay
        const sortedAnimations = [...this.animations].sort((a, b) => a.delay - b.delay);
        
        // Run animations with proper delays
        for (const { name, animationFn, delay } of sortedAnimations) {
            setTimeout(() => {
                console.log(`Running animation: ${name}`);
                animationFn();
            }, delay);
        }
        
        this.isInitialLoad = false;
    }
}

// Global animation system instance
const pageAnimations = new PageLoadAnimations();

// Animation timing configuration
const ANIMATION_CONFIG = {
    // Bubble animation timing
    bubbleStartDelay: 200,          // When bubbles start animating
    bubbleWaveDelay: 120,           // Delay between bubble waves (was 80ms)
    bubbleStagger: 0.03,            // Stagger within each wave (was 20ms)
    bubbleDuration: 0.8,            // Duration of each bubble animation (was 600ms)
    
    // Intro elements timing
    introDelay: 1400,               // When intro elements animate (was 1200ms)
    introDuration: 0.8,             // Duration of intro animation
    
    // Footer timing
    footerDelay: 2200,              // When footer animates (after intro completes)
    footerDuration: 0.4,            // Duration of footer animation
    
    // Gn cycling during bubble load
    gnCycleInterval: 150,           // How fast to cycle Gn elements (ms)  
    gnCycleStartDelay: 100          // When to start cycling Gn elements
};

/* 
 * Example of how to add more page load animations:
 * 
 * pageAnimations.register('fadeInHeader', () => {
 *     gsap.from('.header', { opacity: 0, y: -50, duration: 1, ease: "power2.out" });
 * }, 100); // 100ms delay
 * 
 * pageAnimations.register('slideInSidebar', () => {
 *     gsap.from('.sidebar', { x: -300, duration: 0.8, ease: "back.out(1.2)" });
 * }, 300); // 300ms delay
 */

// Bubble wrap generation
function generateBubbles() {
    const introWrap = document.querySelector('.intro-wrap');
    const bubblesWrap = document.querySelector('.bubbles-wrap');
    
    if (!introWrap || !bubblesWrap) {
        console.error('Required elements not found');
        return;
    }
    
    // Find the original bubble to use as template
    const originalBubble = bubblesWrap.querySelector('.bubble');
    if (!originalBubble) {
        console.error('No original .bubble element found to clone');
        return;
    }
    
    // Clone the original bubble before clearing
    const bubbleTemplate = originalBubble.cloneNode(true);
    
    // Clear existing bubbles
    bubblesWrap.innerHTML = '';
    
    // Get dimensions
    const containerHeight = introWrap.offsetHeight;
    const containerWidth = introWrap.offsetWidth;
    
    // Calculate bubble size to ensure full coverage
    const gap = 2;
    const maxBubbleSize = 32; // 1.5rem = 24px (assuming 1rem = 16px)
    const minBubbleSize = 24; // Minimum reasonable size
    
    // Start with max bubble size and calculate how many fit
    let bubbleSize = maxBubbleSize;
    let bubblesPerRow = Math.floor((containerWidth - gap) / (bubbleSize + gap));
    
    // If we can't fit any bubbles, reduce size
    if (bubblesPerRow < 1) {
        bubblesPerRow = 1;
        bubbleSize = Math.min(containerWidth - (2 * gap), maxBubbleSize);
    }
    
    // Calculate how many rows we get with this configuration
    let rowHeight = bubbleSize + gap;
    let numRows = Math.floor((containerHeight - gap) / rowHeight);
    
    // If we don't fill enough height, try smaller bubbles to get more rows
    while (numRows * rowHeight < containerHeight * 0.85 && bubbleSize > minBubbleSize) {
        bubbleSize = Math.max(bubbleSize - 2, minBubbleSize);
        bubblesPerRow = Math.floor((containerWidth - gap) / (bubbleSize + gap));
        rowHeight = bubbleSize + gap;
        numRows = Math.floor((containerHeight - gap) / rowHeight);
    }
    
    // Calculate center of the grid for animation purposes
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    
    // Store bubble data for animation
    const bubbleData = [];
    
    // Generate bubbles row by row
    for (let row = 0; row < numRows; row++) {
        const isOffsetRow = row % 2 === 1;
        const bubblesInThisRow = isOffsetRow ? bubblesPerRow - 1 : bubblesPerRow;
        
        for (let col = 0; col < bubblesInThisRow; col++) {
            const bubble = bubbleTemplate.cloneNode(true);
            
            // Calculate position
            let leftPos = gap + (col * (bubbleSize + gap));
            if (isOffsetRow) {
                leftPos += (bubbleSize + gap) / 2; // Offset every other row
            }
            
            const topPos = gap + (row * rowHeight);
            
            // Apply positioning and size
            bubble.style.position = 'absolute';
            bubble.style.left = leftPos + 'px';
            bubble.style.top = topPos + 'px';
            bubble.style.width = bubbleSize + 'px';
            bubble.style.height = bubbleSize + 'px';
            
            // Calculate bubble center for distance calculation
            const bubbleCenterX = leftPos + (bubbleSize / 2);
            const bubbleCenterY = topPos + (bubbleSize / 2);
            const distanceFromCenter = Math.sqrt(
                Math.pow(bubbleCenterX - centerX, 2) + Math.pow(bubbleCenterY - centerY, 2)
            );
            
            // Initially hide bubble for page load animation
            gsap.set(bubble, { 
                scale: 0, 
                opacity: 0
            });
            
            // Store bubble data for animation
            bubbleData.push({ 
                element: bubble, 
                distanceFromCenter,
                row,
                col
            });
            
            // Add hover functionality with GSAP
            bubble.addEventListener('mouseenter', function() {
                const hoverElements = bubble.querySelectorAll('.bubble-hover');
                gsap.to(hoverElements, {
                    opacity: 1,
                    scale: 0.95,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
            
            bubble.addEventListener('mouseleave', function() {
                if (isDragging && !poppedBubblesInCurrentDrag.has(bubble)) {
                    // Pop animation when dragging over bubbles
                    console.log('Bubble popped during drag');
                    popBubble(bubble);
                    bubblesPopped = true; // Track that a bubble was popped during drag
                    poppedBubblesInCurrentDrag.add(bubble); // Mark this bubble as popped in current drag
                } else {
                    // Remove circular overlay if mouse leaves while pressed
                    removeCircularOverlay(bubble);
                    
                    // Normal hover out behavior
                    const hoverElements = bubble.querySelectorAll('.bubble-hover');
                    gsap.to(hoverElements, {
                        opacity: 0,
                        duration: 0.3,
                        ease: "power2.out"
                    });
                }
            });
            
            // Note: touchleave is unreliable for drag-to-pop on mobile
            // Touch drag-to-pop is now handled in the touchmove event above
            
            // Add touchstart/touchend for individual bubble touches (mobile tap-to-pop)
            bubble.addEventListener('touchstart', function(e) {
                e.preventDefault(); // Prevent scrolling and other touch behaviors
                
                // Add circular overlay for visual feedback
                createCircularOverlay(bubble);
                
                // Scale down wraps for individual bubble press (only if not already dragging)
                if (!isDragging && !mousePressed) {
                    const gnGWrap = document.querySelector('.gn-g-wrap');
                    const gnNWrap = document.querySelector('.gn-n-wrap');
                    
                    if (gnGWrap) {
                        gsap.to(gnGWrap, {
                            scale: 0.9,
                            duration: 0.2,
                            ease: "power2.out"
                        });
                    }
                    
                    if (gnNWrap) {
                        gsap.to(gnNWrap, {
                            scale: 0.9,
                            duration: 0.2,
                            ease: "power2.out"
                        });
                    }
                }
            });
            
            bubble.addEventListener('touchend', function(e) {
                e.preventDefault(); // Prevent unwanted click events
                
                // Remove circular overlay
                removeCircularOverlay(bubble);
                
                // Only pop if not dragging
                if (!isDragging) {
                    popBubble(bubble);
                    
                    // Scale back wraps and cycle for individual touches
                    resetWrapsScale();
                    cycleGnElements();
                } else {
                    // Scale back up for individual bubble release (only if not dragging)
                    const gnGWrap = document.querySelector('.gn-g-wrap');
                    const gnNWrap = document.querySelector('.gn-n-wrap');
                    
                    if (gnGWrap) {
                        gsap.to(gnGWrap, {
                            scale: 1,
                            duration: 0.2,
                            ease: "back.out(1.2)"
                        });
                    }
                    
                    if (gnNWrap) {
                        gsap.to(gnNWrap, {
                            scale: 1,
                            duration: 0.2,
                            ease: "back.out(1.2)"
                        });
                    }
                }
            });
            
            // Add mousedown/mouseup for circular overlay (individual bubble clicks)
            bubble.addEventListener('mousedown', function() {
                // Add circular overlay for visual feedback
                createCircularOverlay(bubble);
                
                // Scale down wraps for individual bubble press (only if not already dragging)
                if (!isDragging && !mousePressed) {
                    const gnGWrap = document.querySelector('.gn-g-wrap');
                    const gnNWrap = document.querySelector('.gn-n-wrap');
                    
                    if (gnGWrap) {
                        gsap.to(gnGWrap, {
                            scale: 0.9,
                            duration: 0.2,
                            ease: "power2.out"
                        });
                    }
                    
                    if (gnNWrap) {
                        gsap.to(gnNWrap, {
                            scale: 0.9,
                            duration: 0.2,
                            ease: "power2.out"
                        });
                    }
                }
            });
            
            bubble.addEventListener('mouseup', function() {
                // Remove circular overlay
                removeCircularOverlay(bubble);
                
                // Scale back up for individual bubble release (only if not dragging)
                if (!isDragging) {
                    const gnGWrap = document.querySelector('.gn-g-wrap');
                    const gnNWrap = document.querySelector('.gn-n-wrap');
                    
                    if (gnGWrap) {
                        gsap.to(gnGWrap, {
                            scale: 1,
                            duration: 0.2,
                            ease: "back.out(1.2)"
                        });
                    }
                    
                    if (gnNWrap) {
                        gsap.to(gnNWrap, {
                            scale: 1,
                            duration: 0.2,
                            ease: "back.out(1.2)"
                        });
                    }
                }
            });
            
            // Add click functionality with pop animation
            bubble.addEventListener('click', function() {
                if (!isDragging) { // Only click if not dragging
                    popBubble(bubble);
                    // Scale back wraps and cycle for individual clicks
                    resetWrapsScale();
                    cycleGnElements();
                }
            });
            
            bubblesWrap.appendChild(bubble);
        }
    }
    
    // Store bubble data globally for animation access
    window.bubbleAnimationData = bubbleData;
    
    // Register bubble spreading animation for page load
    pageAnimations.register('bubbleSpread', animateBubblesFromCenter, ANIMATION_CONFIG.bubbleStartDelay);
}

// Animate bubbles spreading from center
function animateBubblesFromCenter() {
    const bubbleData = window.bubbleAnimationData;
    if (!bubbleData || bubbleData.length === 0) return;
    
    // Sort bubbles by distance from center
    const sortedBubbles = [...bubbleData].sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);
    
    // Group bubbles by distance ranges (create animation waves)
    const maxDistance = Math.max(...bubbleData.map(b => b.distanceFromCenter));
    const numWaves = Math.min(8, Math.ceil(maxDistance / 50)); // Create up to 8 waves
    const waveDistance = maxDistance / numWaves;
    
    const waves = Array.from({ length: numWaves }, () => []);
    
    sortedBubbles.forEach(bubble => {
        const waveIndex = Math.min(numWaves - 1, Math.floor(bubble.distanceFromCenter / waveDistance));
        waves[waveIndex].push(bubble);
    });
    
    // Store wave info globally for Gn cycling sync
    window.bubbleWaveInfo = {
        numWaves: numWaves,
        waveDelay: ANIMATION_CONFIG.bubbleWaveDelay
    };
    
    // Animate each wave with increasing delay
    waves.forEach((wave, waveIndex) => {
        if (wave.length === 0) return;
        
        const waveDelay = waveIndex * (ANIMATION_CONFIG.bubbleWaveDelay / 1000); // Convert to seconds
        const bubbleStagger = ANIMATION_CONFIG.bubbleStagger; // Stagger within each wave
        
        wave.forEach((bubbleInfo, bubbleIndex) => {
            const totalDelay = waveDelay + (bubbleIndex * bubbleStagger);
            
            gsap.to(bubbleInfo.element, {
                scale: 1,
                opacity: 1,
                duration: ANIMATION_CONFIG.bubbleDuration,
                delay: totalDelay,
                ease: "back.out(1.4)"
            });
        });
    });
    
    console.log(`Animated ${bubbleData.length} bubbles in ${numWaves} waves`);
}

// Initialize intro elements with blur and fade
function initializeIntroElements() {
    const introElements = document.querySelectorAll('.gnp.is-intro');
    introElements.forEach(el => {
        gsap.set(el, {
            filter: 'blur(10px)',
            opacity: 0,
            scale: 0.9
        });
    });
}

// Initialize footer with hidden state
function initializeFooter() {
    const footerWrap = document.querySelector('.footer-wrap');
    if (footerWrap) {
        const footerElements = footerWrap.children;
        gsap.set(footerElements, {
            y: '200%'
        });
    }
}

// Initialize gn wraps with loading scale
function initializeGnWrapsForLoading() {
    const gnGWrap = document.querySelector('.gn-g-wrap');
    const gnNWrap = document.querySelector('.gn-n-wrap');
    
    if (gnGWrap) {
        gsap.set(gnGWrap, { scale: 0.95 });
    }
    
    if (gnNWrap) {
        gsap.set(gnNWrap, { scale: 0.95 });
    }
}

// Scale up gn wraps when bubbles finish loading
function scaleUpGnWraps() {
    const gnGWrap = document.querySelector('.gn-g-wrap');
    const gnNWrap = document.querySelector('.gn-n-wrap');
    
    if (gnGWrap) {
        gsap.to(gnGWrap, {
            scale: 1,
            duration: 0.4,
            ease: "back.out(1.2)"
        });
    }
    
    if (gnNWrap) {
        gsap.to(gnNWrap, {
            scale: 1,
            duration: 0.4,
            ease: "back.out(1.2)"
        });
    }
    
    console.log('Scaled up Gn wraps after bubble loading');
}

// Animate intro elements back to normal
function animateIntroElements() {
    const introElements = document.querySelectorAll('.gnp.is-intro');
    if (introElements.length === 0) return;
    
    gsap.to(introElements, {
        filter: 'blur(0px)',
        opacity: 1,
        scale: 1,
        duration: ANIMATION_CONFIG.introDuration,
        ease: "power2.out",
        stagger: 0.1
    });
    
    console.log(`Animated ${introElements.length} intro elements`);
}

// Animate footer from bottom
function animateFooter() {
    const footerWrap = document.querySelector('.footer-wrap');
    if (!footerWrap) return;
    
    const footerElements = footerWrap.children;
    if (footerElements.length === 0) return;
    
    gsap.to(footerElements, {
        y: '0%',
        duration: ANIMATION_CONFIG.footerDuration,
        ease: "power2.inOut",
        stagger: 0.15
    });
    
    console.log(`Animated ${footerElements.length} footer elements with stagger`);
}

// Simple Gn cycling during bubble loading
function cycleGnElementsDuringLoad() {
    // Wait for bubble wave info to be available
    const checkWaveInfo = () => {
        if (!window.bubbleWaveInfo) {
            setTimeout(checkWaveInfo, 10);
            return;
        }
        
        const gnGWrap = document.querySelector('.gn-g-wrap');
        const gnNWrap = document.querySelector('.gn-n-wrap');
        
        if (!gnGWrap && !gnNWrap) return;
        
        const { numWaves, waveDelay } = window.bubbleWaveInfo;
        
        // Set same random starting position for both wraps
        const gElements = gnGWrap ? gnGWrap.querySelectorAll('[class*="gn-g"]') : [];
        const nElements = gnNWrap ? gnNWrap.querySelectorAll('[class*="gn-n"]') : [];
        const maxElements = Math.max(gElements.length, nElements.length);
        
        if (maxElements > 1) {
            const randomStart = Math.floor(Math.random() * maxElements) + 1;
            console.log(`Setting both wraps to random starting index: ${randomStart}`);
            
            // Set gn-g to random start
            if (gnGWrap && gElements.length > 0) {
                const current = gnGWrap.querySelector(`.gn-g._${currentGnGIndex}`);
                if (current) current.style.opacity = '0';
                
                currentGnGIndex = randomStart;
                const starting = gnGWrap.querySelector(`.gn-g._${randomStart}`);
                if (starting) starting.style.opacity = '1';
            }
            
            // Set gn-n to same random start
            if (gnNWrap && nElements.length > 0) {
                const current = gnNWrap.querySelector(`.gn-n._${currentGnNIndex}`);
                if (current) current.style.opacity = '0';
                
                currentGnNIndex = randomStart;
                const starting = gnNWrap.querySelector(`.gn-n._${randomStart}`);
                if (starting) starting.style.opacity = '1';
            }
        }
        
        // Simple cycling using existing function
        let cycleCount = 0;
        const interval = setInterval(() => {
            cycleCount++;
            cycleGnElements(); // Use the existing working function
            
            // Stop after numWaves cycles and trigger scaling
            if (cycleCount >= numWaves) {
                clearInterval(interval);
                console.log(`Gn cycling completed (${cycleCount} cycles synced with bubble waves)`);
                
                // Scale up gn wraps right when cycling ends
                setTimeout(() => {
                    scaleUpGnWraps();
                }, 150); // Small delay to ensure clean transition
            }
        }, waveDelay);
        
        console.log(`Started simple Gn cycling: ${numWaves} cycles at ${waveDelay}ms intervals`);
    };
    
    checkWaveInfo();
}

// Run when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeGnWraps();
    initializeGnWrapsForLoading();  // Scale down gn wraps during loading
    initializeIntroElements();
    initializeFooter();             // Set footer initial state
    generateBubbles();
    addDragListeners();
    
    // Register Gn cycling during bubble load (scaling happens when cycling ends)
    pageAnimations.register('gnCycling', cycleGnElementsDuringLoad, ANIMATION_CONFIG.gnCycleStartDelay);
    
    // Register intro animation to run after bubbles
    pageAnimations.register('introElements', animateIntroElements, ANIMATION_CONFIG.introDelay);
    
    // Register footer animation to run after intro completes
    pageAnimations.register('footerSlideUp', animateFooter, ANIMATION_CONFIG.footerDelay);
    
    // Run page load animations
    pageAnimations.runAll();
});

// Handle window resize - show bubbles immediately, no animation
function handleResize() {
    generateBubbles();
    
    // If bubbles were regenerated during resize, show them immediately
    // (don't run page load animations)
    const bubbleData = window.bubbleAnimationData;
    if (bubbleData && bubbleData.length > 0) {
        bubbleData.forEach(bubbleInfo => {
            gsap.set(bubbleInfo.element, { 
                scale: 1, 
                opacity: 1
            });
        });
    }
    
    // Ensure gn wraps are at normal scale after resize
    const gnGWrap = document.querySelector('.gn-g-wrap');
    const gnNWrap = document.querySelector('.gn-n-wrap');
    
    if (gnGWrap) {
        gsap.set(gnGWrap, { scale: 1 });
    }
    
    if (gnNWrap) {
        gsap.set(gnNWrap, { scale: 1 });
    }
}

// Re-generate on window resize
const resizeDebounce = debounce(handleResize, 150);
window.addEventListener('resize', resizeDebounce);

// Simple debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
