console.log("Gallery script loaded");

// Gallery initialization and interaction system
function initGallery() {
    const container = document.querySelector('.container.is-img-gallery');
    if (!container) {
        console.warn('Gallery container not found');
        return;
    }

    const triggersWrap = container.querySelector('.triggers-wrap');
    const triggers = container.querySelectorAll('.trigger');
    const triggerOffsets = container.querySelectorAll('.trigger-offset');
    const galleryWrap = container.querySelector('.gallery_wrap');
    const galleryItems = container.querySelectorAll('.gallery_item');

    if (!triggers.length || !galleryItems.length) {
        console.warn('Gallery triggers or items not found');
        return;
    }

    // Step 1: Add .is-open to first gallery_item's .gallery_carousell
    const firstGalleryItem = galleryItems[0];
    const firstCarousell = firstGalleryItem.querySelector('.gallery_carousell');
    if (firstCarousell) {
        firstCarousell.classList.add('is-open');
    }

    // Step 2: Store height and set dimensions
    const storedHeight = firstGalleryItem.offsetHeight;
    console.log('Stored height:', storedHeight);

    // Set each trigger height
    triggers.forEach(trigger => {
        trigger.style.height = `${storedHeight}px`;
    });

    // Set each trigger-offset height
    triggerOffsets.forEach(triggerOffset => {
        triggerOffset.style.height = `${storedHeight}px`;
    });

    // Set container height (number of triggers + trigger-offsets * stored height)
    const totalElements = triggers.length + triggerOffsets.length;
    container.style.height = `${totalElements * storedHeight}px`;
    console.log(`Container height set to: ${totalElements} elements × ${storedHeight}px = ${totalElements * storedHeight}px`);

    // Step 3: Remove .is-open from first item
    if (firstCarousell) {
        firstCarousell.classList.remove('is-open');
    }

        // Track current active index and animation state
    let currentActiveIndex = -1;
    let isAnimating = false;

    // Track current image index for each gallery item (persists across open/close)
    const galleryImageIndices = new Map();

    // Animation variables 
    const PREVIEW_INTERMEDIATE = {
        x: "-10%",
        y: "-80%",
        scale: 0.6,
        rotation: 10
    };

    const PREVIEW_FINAL = {
        x: "0%",
        y: "-100%",
        scale: 1,
        rotation: 0
    };

    const PREVIEW_DEFAULT = {
        x: "0%",
        y: "0%",
        scale: 1,
        rotation: 0
    };

    const GALLERY_START = {
        width: "0%",
        rotation: 20,
        y: "10%"
    };

    const GALLERY_FINAL = {
        width: "100%",
        rotation: 0,
        y: "0%"
    };

    // Animation durations
    const DURATIONS = {
        carousell: 0.4,           // Opening height animation
        carousellClose: 0.4,      // Closing height animation - MUST match carousell for sync
        previewIntermediate: 0.3,
        previewFinal: 0.4,
        previewDefault: 0.2,
        galleryAnimation: 0.4
    };

    // Animation easing - consistent across all animations
    const EASING = "power2.inOut";

    // Function to update progress bar based on current image index
    function updateProgressBar(galleryItem, currentIndex, totalImages) {
        const progressBar = galleryItem.querySelector('.gallery_description .gallery_preview .carousell_progress .progress-bar');
        if (progressBar) {
            const progressPercentage = ((currentIndex + 1) / totalImages) * 100;
            gsap.to(progressBar, {
                width: `${progressPercentage}%`,
                duration: 0.3,
                ease: "power2.out"
            });
        }
    }

    // Function to initialize progress bar
    function initializeProgressBar(galleryItem, totalImages) {
        const progressBar = galleryItem.querySelector('.gallery_description .gallery_preview .carousell_progress .progress-bar');
        if (progressBar) {
            const initialWidth = (100 / totalImages);
            gsap.set(progressBar, { width: `${initialWidth}%` });
        }
    }

    // Function to set up image cycling for a gallery item
    function setupImageCycling(galleryItem, itemIndex) {
        const carousell = galleryItem.querySelector('.gallery_carousell');
        const previewImgs = galleryItem.querySelectorAll('.gallery_description .gallery_preview .preview-img');
        const galleryImgs = galleryItem.querySelectorAll('.gallery_carousell .gallery-img');
        
        if (!carousell || !previewImgs.length || !galleryImgs.length) return;
        
        // Track animation state for this specific gallery item
        let isGalleryCycling = false;
        
        // Initialize progress bar
        initializeProgressBar(galleryItem, galleryImgs.length);
        
        // Initialize image index for this gallery item
        if (!galleryImageIndices.has(itemIndex)) {
            galleryImageIndices.set(itemIndex, 0);
        }
        
        // Set up gallery image initial state (for when gallery opens)
        function setInitialGalleryState(activeIndex) {
            const totalImages = galleryImgs.length;
            
            // Update preview images 
            previewImgs.forEach((img, index) => {
                img.style.zIndex = index === activeIndex ? 10 : 1;
            });
            
            // Set transform origin for all gallery images
            galleryImgs.forEach((img) => {
                gsap.set(img, { transformOrigin: "bottom right" });
            });
            
            // Set all gallery images to initial state
            galleryImgs.forEach((img, index) => {
                if (index === activeIndex) {
                    // Current image: starts at GALLERY_START, will animate to full
                    gsap.set(img, GALLERY_START);
                    gsap.set(img, { opacity: 1, zIndex: 10 });
                } else {
                    // All other images: hidden
                    gsap.set(img, {
                        width: "0%",
                        left: "70%",
                        bottom: "5%",
                        rotation: 5,
                        opacity: 0,
                        zIndex: 5
                    });
                }
            });
        }

        // Animate gallery opening (called from main ScrollTrigger)
        function animateGalleryOpen(activeIndex) {
            const totalImages = galleryImgs.length;
            const currentImg = galleryImgs[activeIndex];
            const nextIndex = (activeIndex + 1) % totalImages;
            const nextImg = galleryImgs[nextIndex];
            
            // Update progress bar when gallery opens
            updateProgressBar(galleryItem, activeIndex, totalImages);

            // Animate current image to full width and position
            gsap.to(currentImg, {
                width: GALLERY_FINAL.width,
                left: "0%",
                bottom: "0%",
                rotation: GALLERY_FINAL.rotation,
                y: GALLERY_FINAL.y,
                duration: DURATIONS.galleryAnimation,
                ease: EASING,
                onComplete: () => {
                    // After current becomes full, show next image
                    const nextIndex = (activeIndex + 1) % totalImages;
                    const nextImg = galleryImgs[nextIndex];
                    gsap.set(nextImg, {
                        width: "0%",
                        left: "70%",
                        bottom: "5%",
                        rotation: 5,
                        opacity: 1,
                        zIndex: 15
                    });
                    gsap.to(nextImg, {
                        width: "25%",
                        duration: 0.3,
                        ease: EASING,
                        onComplete: () => {
                            // Reset ALL other images (except the current active and next) to starting position
                            galleryImgs.forEach((img, index) => {
                                if (index !== nextIndex && index !== activeIndex) {
                                    gsap.set(img, {
                                        width: "0%",
                                        left: "70%",
                                        bottom: "5%",
                                        rotation: 5,
                                        opacity: 0,
                                        zIndex: 5
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }

        // Animate gallery closing (called from main ScrollTrigger)
        function animateGalleryClose(activeIndex) {
            const totalImages = galleryImgs.length;
            const currentImg = galleryImgs[activeIndex];
            const nextIndex = (activeIndex + 1) % totalImages;
            const nextImg = galleryImgs[nextIndex];

            // Hide next image first
            gsap.to(nextImg, {
                width: "0%",
                duration: 0.3,
                ease: EASING
            });

            // Then animate current image back to GALLERY_START
            gsap.to(currentImg, {
                width: GALLERY_START.width,
                rotation: GALLERY_START.rotation,
                y: GALLERY_START.y,
                duration: DURATIONS.galleryAnimation,
                ease: EASING
            });
        }
        
        // Set initial state
        setInitialGalleryState(galleryImageIndices.get(itemIndex));
        
        // Add click handler to carousell
        carousell.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (!carousell.classList.contains('is-open')) return;
            
            // Prevent clicking while animation is in progress
            if (isGalleryCycling) {
                console.log(`Gallery ${itemIndex}: Click ignored - animation in progress`);
                return;
            }
            
            // Set animation flag
            isGalleryCycling = true;
            
            // Get current and next indices
            const currentIndex = galleryImageIndices.get(itemIndex);
            const nextIndex = (currentIndex + 1) % previewImgs.length;
            const totalImages = galleryImgs.length;
            
            // Update stored index
            galleryImageIndices.set(itemIndex, nextIndex);
            
            // Update progress bar
            updateProgressBar(galleryItem, nextIndex, galleryImgs.length);
            
            // Update preview images immediately
            previewImgs.forEach((img, index) => {
                img.style.zIndex = index === nextIndex ? 10 : 1;
            });
            
            // Hide current next image first
            const currentNextIndex = (currentIndex + 1) % totalImages;
            const currentNextImg = galleryImgs[currentNextIndex];
            gsap.to(currentNextImg, {
                width: "0%",
                duration: 0.3,
                ease: EASING
            });

            // Hide current image and set next as current
            const currentImg = galleryImgs[currentIndex];
            const nextImg = galleryImgs[nextIndex];
            
            gsap.to(currentImg, {
                width: "0%",
                opacity: 0,
                duration: 0.3,
                ease: EASING,
                onComplete: () => {
                    // Reset current image to starting position for future cycles
                    gsap.set(currentImg, {
                        width: "0%",
                        left: "70%",
                        bottom: "5%",
                        rotation: 5,
                        opacity: 0,
                        zIndex: 5
                    });
                }
            });

            // Animate next image to full width and position
            gsap.to(nextImg, {
                width: GALLERY_FINAL.width,
                left: "0%",
                bottom: "0%",
                rotation: GALLERY_FINAL.rotation,
                y: GALLERY_FINAL.y,
                opacity: 1,
                zIndex: 10,
                duration: DURATIONS.galleryAnimation,
                ease: EASING,
                onComplete: () => {
                    // Reset animation flag - main image is now full, allow next click
                    isGalleryCycling = false;
                    console.log(`Gallery ${itemIndex}: Main animation complete, clicks enabled`);
                    
                    // After new current becomes full, show new next image
                    const newNextIndex = (nextIndex + 1) % totalImages;
                    const newNextImg = galleryImgs[newNextIndex];
                    
                    // Set new next image to starting position
                    gsap.set(newNextImg, {
                        width: "0%",
                        left: "70%",
                        bottom: "5%",
                        rotation: 5,
                        opacity: 1,
                        zIndex: 15
                    });
                    
                    // Animate new next image in
                    gsap.to(newNextImg, {
                        width: "25%",
                        duration: 0.3,
                        ease: EASING,
                        onComplete: () => {
                            // Reset all other images to starting position
                            galleryImgs.forEach((img, index) => {
                                if (index !== nextIndex && index !== newNextIndex) {
                                    gsap.set(img, {
                                        width: "0%",
                                        left: "70%",
                                        bottom: "5%",
                                        rotation: 5,
                                        opacity: 0,
                                        zIndex: 5
                                    });
                                }
                            });
                        }
                    });
                }
            });
            
            console.log(`Gallery ${itemIndex}: clicked from ${currentIndex} to ${nextIndex}`);
        });
        
        return { setInitialGalleryState, animateGalleryOpen, animateGalleryClose };
    }

    // Step 4: Set up image cycling for all gallery items and store controllers
    const galleryControllers = [];
    galleryItems.forEach((item, index) => {
        const controller = setupImageCycling(item, index);
        galleryControllers[index] = controller;
    });

    // Helper function to animate gallery transitions with height animation
    function animateGalleryTransition(targetIndex) {
        // Prevent multiple simultaneous animations
        if (isAnimating || currentActiveIndex === targetIndex) {
            return;
        }

        isAnimating = true;
        console.log(`Switching from ${currentActiveIndex} to ${targetIndex}`);

        // First, close ALL gallery carousells and animate preview images out
        galleryItems.forEach((item, index) => {
            const carousell = item.querySelector('.gallery_carousell');
            const previewImgs = item.querySelectorAll('.gallery_description .gallery_preview .preview-img');
            
            if (carousell) {
                if (carousell.classList.contains('is-open')) {
                    const galleryImgs = item.querySelectorAll('.gallery_carousell .gallery-img');
                    
                    // FLIP animations for closing gallery_content and desc elements
                    const galleryContent = item.querySelector('.gallery_description .gallery_content');
                    const descElements = item.querySelectorAll('.gnp.s.desc');
                    
                    // FLIP animation for desc elements (close first)
                    if (descElements.length > 0) {
                        const descState = Flip.getState(descElements);
                        descElements.forEach(desc => desc.classList.remove('is-open'));
                        Flip.from(descState, {
                            duration: 0.3,
                            ease: "power2.inOut"
                        });
                    }
                    
                    // FLIP animation for gallery_content (close after desc)
                    if (galleryContent) {
                        const state = Flip.getState(galleryContent);
                        galleryContent.classList.remove('is-open');
                        Flip.from(state, {
                            duration: 0.3,
                            ease: "power2.inOut",
                            delay: 0.1
                        });
                    }
                    
                    // Reverse the animation sequence
                    // First: trigger gallery closing animation
                    const currentImageIndex = galleryImageIndices.get(index) || 0;
                    const galleryController = galleryControllers[index];
                    
                    if (galleryController) {
                        galleryController.animateGalleryClose(currentImageIndex);
                    }
                    
                    gsap.to(previewImgs, {
                        x: PREVIEW_INTERMEDIATE.x,
                        y: PREVIEW_INTERMEDIATE.y,
                        scale: PREVIEW_INTERMEDIATE.scale,
                        rotation: PREVIEW_INTERMEDIATE.rotation,
                        duration: DURATIONS.previewIntermediate,
                        ease: EASING,
                        onComplete: () => {
                            // Second: animate preview images back to default
                            gsap.to(previewImgs, {
                                x: PREVIEW_DEFAULT.x,
                                y: PREVIEW_DEFAULT.y,
                                scale: PREVIEW_DEFAULT.scale,
                                rotation: PREVIEW_DEFAULT.rotation,
                                duration: DURATIONS.previewDefault,
                                ease: EASING,
                                // Note: Carousell closing will be handled synchronously with new opening
                            });
                        }
                    });
                } else {
                    // Ensure it's closed and has no class
                    carousell.classList.remove('is-open');
                    gsap.set(carousell, { height: 0 });
                    // Reset preview images and gallery images to default position
                    gsap.set(previewImgs, PREVIEW_DEFAULT);
                    const galleryImgs = item.querySelectorAll('.gallery_carousell .gallery-img');
                    gsap.set(galleryImgs, GALLERY_START);
                }
            }
        });

        // Update current active index
        currentActiveIndex = targetIndex;

        // Find the currently open carousell for synchronized closing
        const currentlyOpenCarousell = Array.from(galleryItems).find(item => 
            item.querySelector('.gallery_carousell')?.classList.contains('is-open')
        )?.querySelector('.gallery_carousell');

        // Then, open ONLY the target gallery item's carousell
        if (targetIndex >= 0 && targetIndex < galleryItems.length) {
            const targetCarousell = galleryItems[targetIndex]?.querySelector('.gallery_carousell');
            const targetPreviewImgs = galleryItems[targetIndex]?.querySelectorAll('.gallery_description .gallery_preview .preview-img');
            
            if (targetCarousell) {
                // Set height to 0 first, add class, then animate to auto
                gsap.set(targetCarousell, { height: 0 });
                targetCarousell.classList.add('is-open');
                
                // Start opening animation
                gsap.to(targetCarousell, {
                    height: "auto",
                    duration: DURATIONS.carousell,
                    ease: EASING
                });

                // Simultaneously close the old carousell if it exists
                if (currentlyOpenCarousell && currentlyOpenCarousell !== targetCarousell) {
                    gsap.to(currentlyOpenCarousell, {
                        height: 0,
                        duration: DURATIONS.carousellClose,
                        ease: EASING,
                        onComplete: () => {
                            currentlyOpenCarousell.classList.remove('is-open');
                        }
                    });
                }

                // Wait for height animation to complete, then start image animations
                gsap.delayedCall(DURATIONS.carousell, () => {
                        // After carousell opens, start the image animation sequence
                        const targetGalleryImgs = galleryItems[targetIndex]?.querySelectorAll('.gallery_carousell .gallery-img');
                        
                        // Add FLIP animations for gallery_content and desc elements
                        const galleryContent = galleryItems[targetIndex]?.querySelector('.gallery_description .gallery_content');
                        const descElements = galleryItems[targetIndex]?.querySelectorAll('.gnp.s.desc');
                        

                        
                        // FLIP animation for gallery_content
                        if (galleryContent) {
                            const state = Flip.getState(galleryContent);
                            galleryContent.classList.add('is-open');
                            Flip.from(state, {
                                duration: 0.4,
                                ease: "power2.inOut"
                            });
                        }
                        
                        // FLIP animation for desc elements
                        if (descElements.length > 0) {
                            const descState = Flip.getState(descElements);
                            descElements.forEach(desc => desc.classList.add('is-open'));
                            Flip.from(descState, {
                                duration: 0.4,
                                ease: "power2.inOut",
                                delay: 0.1 // Slight delay for staggered effect
                            });
                        }
                        
                        // Ensure correct image is shown when opening and trigger gallery animation
                        const currentImageIndex = galleryImageIndices.get(targetIndex) || 0;
                        const galleryController = galleryControllers[targetIndex];
                        
                        if (galleryController) {
                            // Set initial state and trigger opening animation
                            galleryController.setInitialGalleryState(currentImageIndex);
                            galleryController.animateGalleryOpen(currentImageIndex);
                        }
                        
                        // Step 2: Preview images animate to intermediate position
                        gsap.to(targetPreviewImgs, {
                            x: PREVIEW_INTERMEDIATE.x,
                            y: PREVIEW_INTERMEDIATE.y,
                            scale: PREVIEW_INTERMEDIATE.scale,
                            rotation: PREVIEW_INTERMEDIATE.rotation,
                            duration: DURATIONS.previewIntermediate,
                            ease: EASING,
                            onComplete: () => {
                                // Step 3: Preview images to final position
                                // (Gallery images are handled by animateGalleryOpen above)
                                
                                gsap.to(targetPreviewImgs, {
                                    x: PREVIEW_FINAL.x,
                                    y: PREVIEW_FINAL.y,
                                    scale: PREVIEW_FINAL.scale,
                                    rotation: PREVIEW_FINAL.rotation,
                                    duration: DURATIONS.previewFinal,
                                    ease: EASING,
                                    onComplete: () => {
                                        isAnimating = false;
                                    }
                                });
                            }
                        });
                });
            } else {
                isAnimating = false;
            }
        } else {
            isAnimating = false;
        }
    }

    // Helper function to remove all .is-open classes with animation
    function removeAllOpenStates() {
        if (isAnimating) {
            return;
        }

        isAnimating = true;
        currentActiveIndex = -1;
        
        galleryItems.forEach((item, itemIndex) => {
            const carousell = item.querySelector('.gallery_carousell');
            const previewImgs = item.querySelectorAll('.gallery_description .gallery_preview .preview-img');
            
            if (carousell && carousell.classList.contains('is-open')) {
                const galleryImgs = item.querySelectorAll('.gallery_carousell .gallery-img');
                
                // FLIP animations for closing gallery_content and desc elements
                const galleryContent = item.querySelector('.gallery_description .gallery_content');
                const descElements = item.querySelectorAll('.gnp .s .desc');
                
                // FLIP animation for desc elements (close first)
                if (descElements.length > 0) {
                    const descState = Flip.getState(descElements);
                    descElements.forEach(desc => desc.classList.remove('is-open'));
                    Flip.from(descState, {
                        duration: 0.3,
                        ease: "power2.inOut"
                    });
                }
                
                // FLIP animation for gallery_content (close after desc)
                if (galleryContent) {
                    const state = Flip.getState(galleryContent);
                    galleryContent.classList.remove('is-open');
                    Flip.from(state, {
                        duration: 0.3,
                        ease: "power2.inOut",
                        delay: 0.1
                    });
                }
                
                                    // Reverse the animation sequence
                    // First: trigger gallery closing animation
                    const currentImageIndex = galleryImageIndices.get(itemIndex) || 0;
                    const galleryController = galleryControllers[itemIndex];
                    
                    if (galleryController) {
                        galleryController.animateGalleryClose(currentImageIndex);
                    }
                
                gsap.to(previewImgs, {
                    x: PREVIEW_INTERMEDIATE.x,
                    y: PREVIEW_INTERMEDIATE.y,
                    scale: PREVIEW_INTERMEDIATE.scale,
                    rotation: PREVIEW_INTERMEDIATE.rotation,
                    duration: DURATIONS.previewIntermediate,
                                                ease: EASING,
                    onComplete: () => {
                        // Second: animate preview images back to default
                        gsap.to(previewImgs, {
                            x: PREVIEW_DEFAULT.x,
                            y: PREVIEW_DEFAULT.y,
                            scale: PREVIEW_DEFAULT.scale,
                            rotation: PREVIEW_DEFAULT.rotation,
                            duration: DURATIONS.previewDefault,
                            ease: EASING,
                            onComplete: () => {
                                // Finally: close the carousell
                                gsap.to(carousell, {
                                    height: 0,
                                    duration: DURATIONS.carousellClose,
                                    ease: EASING,
                                    onComplete: () => {
                                        carousell.classList.remove('is-open');
                                        isAnimating = false;
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                isAnimating = false;
            }
        });
    }

    // Step 4: Create ScrollTrigger for each trigger
    triggers.forEach((trigger, index) => {
        ScrollTrigger.create({
            trigger: trigger,
            start: "top center",
            end: "bottom center",
            markers: false, // For debugging
            refreshPriority: -1, // Lower priority for better fast-scroll handling
            fastScrollEnd: true, // Handle fast scroll scenarios
            invalidateOnRefresh: true, // Recalculate on refresh
            anticipatePin: 1, // Improve performance during fast scrolling
            onEnter: () => {
                console.log(`Entering trigger ${index}`);
                animateGalleryTransition(index);
            },
            onLeave: () => {
                console.log(`Leaving trigger ${index}`);
                removeAllOpenStates();  
            },
            onEnterBack: () => {
                console.log(`Entering back trigger ${index}`);
                animateGalleryTransition(index);
            },
            onLeaveBack: () => {
                console.log(`Leaving back trigger ${index}`);
                removeAllOpenStates();
            },
            onUpdate: (self) => {
                // Track progress and ensure correct state during fast scrolling
                const progress = self.progress;
                const isActive = self.isActive;
                
                console.log(`Trigger ${index} update: progress=${progress.toFixed(2)}, active=${isActive}, currentActive=${currentActiveIndex}`);
                
                // If this trigger is active but we don't have the right gallery open
                if (isActive && currentActiveIndex !== index) {
                    console.log(`Force correcting: trigger ${index} is active but gallery ${currentActiveIndex} is open`);
                    animateGalleryTransition(index);
                }
                
                // If no trigger is active and we still have a gallery open
                if (!isActive && progress === 0 && currentActiveIndex === index) {
                    console.log(`Force closing: trigger ${index} not active but gallery ${index} is still open`);
                    removeAllOpenStates();
                }
            }
        });
    });

    // Create master ScrollTrigger for progress line
    const firstTrigger = triggers[0];
    const lastTrigger = triggers[triggers.length - 1];
    const progressLine = document.querySelector('.gallery_progress-line');
    
    if (firstTrigger && lastTrigger && progressLine) {
        ScrollTrigger.create({
            trigger: firstTrigger,
            start: "top center",
            endTrigger: lastTrigger,
            end: "bottom center",
            onUpdate: (self) => {
                const progress = self.progress;
                const progressHeight = progress * 100;
                
                // Animate progress line height from 0vh to 100vh
                gsap.set(progressLine, {
                    height: `${progressHeight}vh`
                });
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initGallery);

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGallery);
} else {
    initGallery();
}
