// Folder interaction script
document.addEventListener('DOMContentLoaded', function() {
    console.log('Field script loaded');
    
    // Z-index management
    let highestZIndex = 1000;
    
    function bringToFront(element) {
        highestZIndex++;
        element.style.zIndex = highestZIndex;
        console.log('Brought element to front with z-index:', highestZIndex);
    }
    
    // State management for folders
    const folderStates = new Map();
    
    function saveFolderState(element) {
        const id = element.className || element.id || 'unknown';
        const state = {
            width: element.style.width,
            height: element.style.height,
            left: element.style.left,
            top: element.style.top,
            hasBeenOpened: true
        };
        folderStates.set(id, state);
        console.log('Saved state for folder:', id, state);
    }
    
    function getFolderState(element) {
        const id = element.className || element.id || 'unknown';
        return folderStates.get(id);
    }
    
    // Get all folder wraps and open folders
    const folderWraps = document.querySelectorAll('.folder_wrap');
    const openFolders = document.querySelectorAll('.open-folder');
    
    console.log('Found folder_wraps:', folderWraps.length);
    console.log('Found open-folders:', openFolders.length);
    
    // Log each folder_wrap's classes
    folderWraps.forEach((fw, index) => {
        console.log(`Folder wrap ${index} classes:`, fw.classList.toString());
    });
    
    // Create mapping between folder types and their corresponding open folders
    const folderMapping = {
        'what': 'txxt',
        'how': 'howto', 
        'acoo': 'acoo',
        'game': 'game'
    };
    
    // Function to find matching open folder for a folder wrap
    function findMatchingOpenFolder(folderWrap) {
        console.log('Looking for match for folder with classes:', folderWrap.classList.toString());
        
        // Check if folder_wrap has any of the mapped classes
        for (const [folderType, openType] of Object.entries(folderMapping)) {
            if (folderWrap.classList.contains(folderType)) {
                console.log(`Found match: ${folderType} -> ${openType}`);
                const openFolder = document.querySelector(`.open-folder.${openType}`);
                console.log('Found open folder element:', openFolder);
                return openFolder;
            }
        }
        console.log('No match found');
        return null;
    }
    
    // Function to close open folder
    function closeOpenFolder(openFolder) {
        // Save current state before closing
        saveFolderState(openFolder);
        
        gsap.to(openFolder, {
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            ease: "power2.out",
            onComplete: function() {
                openFolder.style.display = 'none';
            }
        });
    }
    
    // Function to check if folder is already open
    function isFolderOpen(openFolder) {
        const isDisplayed = openFolder.style.display !== 'none';
        const currentOpacity = gsap.getProperty(openFolder, "opacity");
        return isDisplayed && currentOpacity > 0;
    }
    
    // Function to open folder
    function openFolder(openFolder) {
        // Check if folder is already open
        if (isFolderOpen(openFolder)) {
            console.log('Folder is already open, skipping');
            return;
        }
        
        console.log('Opening folder animation started');
        
        // Check if folder has been opened before
        const savedState = getFolderState(openFolder);
        
        if (savedState && savedState.hasBeenOpened) {
            console.log('Restoring previous state for folder');
            // Restore previous state
            openFolder.style.width = savedState.width;
            openFolder.style.height = savedState.height;
            openFolder.style.left = savedState.left;
            openFolder.style.top = savedState.top;
        } else {
            console.log('First time opening, setting random size and positio with ratio');
            // First time opening - set random width and calculate height based on image aspect ratio
            const folderImg = openFolder.querySelector('.folder-img');
            let aspectRatio = 1; // default fallback
            
            // Better Safari compatibility for getting aspect ratio
            if (folderImg) {
                if (folderImg.complete && folderImg.naturalWidth && folderImg.naturalHeight) {
                    // Image is loaded and has dimensions
                    aspectRatio = folderImg.naturalWidth / folderImg.naturalHeight;
                } else if (folderImg.width && folderImg.height) {
                    // Fallback to current dimensions if natural dimensions aren't available
                    aspectRatio = folderImg.width / folderImg.height;
                } else if (folderImg.getAttribute('width') && folderImg.getAttribute('height')) {
                    // Fallback to attribute dimensions
                    aspectRatio = parseInt(folderImg.getAttribute('width')) / parseInt(folderImg.getAttribute('height'));
                }
            }
            
            // Set random width with max 70vw constraint
            const maxWidthVw = Math.min(window.innerWidth * 0.7, 450); // Max 70vw or 450px, whichever is smaller
            const minWidth = Math.min(300, maxWidthVw * 0.67); // Ensure min width doesn't exceed reasonable bounds
            const randomWidth = Math.random() * (maxWidthVw - minWidth) + minWidth;
            const calculatedHeight = randomsidth / aspectRatio;
            
            openFolder.style.width = `${randomWidth}px`;
            openFolder.style.height = `${calculatedHeight}px`;
            
            // Get screen dimensions with some padding
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const padding = 20; // 20px padding from edges
            
            // Calculate safe bounds with padding
            const safeWidth = screenWidth - padding * 2;
            const safeHeight = screenHeight - padding * 2;
            
            // Calculate maximum positions ensuring element stays within bounds
            const maxLeft = Math.max(padding, safeWidth - randomWidth + padding);
            const maxTop = Math.max(padding, safeHeight - calculatedHeight + padding);
            
            // Generate random position and clamp to safe bounds
            let randomLeft = Math.random() * (maxLeft - padding) + padding;
            let randomTop = Math.random() * (maxTop - padding) + padding;
            
            // Additional clamping to ensure bounds
            randomLeft = Math.max(padding, Math.min(randomLeft, screenWidth - randomWidth - padding));
            randomTop = Math.max(padding, Math.min(randomTop, screenHeight - calculatedHeight - padding));
            
            // Set position
            openFolder.style.left = `${randomLeft}px`;
            openFolder.style.top = `${randomTop}px`;
        }
        
        // Make it absolutely positioned
        openFolder.style.position = 'absolute';
        
        // Show it temporarily to get dimensions
        openFolder.style.display = 'block';
        openFolder.style.visibility = 'hidden';
        
        // Make it visible again
        openFolder.style.visibility = 'visible';
        
        // Bring to front BEFORE animation starts
        bringToFront(openFolder);
        
        console.log('Folder positioned and sized');
        
        gsap.to(openFolder, {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out",
            onComplete: function() {
                console.log('Opening animation completed');
                // Make draggable and resizable after animation completes
                makeDraggable(openFolder);
                makeResizable(openFolder);
            }
        });
    }
    
    // Utility function to get event coordinates (mouse or touch)
    function getEventCoordinates(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
        } else {
            return { x: e.clientX, y: e.clientY };
        }
    }

    // Function to make element draggable
    function makeDraggable(element) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        // Use the entire element as drag handle with standard cursor
        element.style.cursor = 'default';
        
        // Start drag function for both mouse and touch
        function startDrag(e) {
            // Don't start dragging if clicking on resize handle
            if (e.target.classList.contains('resize-handle')) {
                return;
            }
            
            // Don't start dragging if clicking on close buttons
            if (e.target.classList.contains('x') || 
                e.target.classList.contains('close') || 
                e.target.classList.contains('close-btn') || 
                e.target.hasAttribute('data-close') ||
                e.target.closest('.x, .close, .close-btn, [data-close]')) {
                return;
            }
            
            // Bring to front when starting to drag
            bringToFront(element);
            
            isDragging = true;
            const coords = getEventCoordinates(e);
            startX = coords.x;
            startY = coords.y;
            startLeft = parseInt(element.style.left) || 0;
            startTop = parseInt(element.style.top) || 0;
            
            e.preventDefault();
        }
        
        // Handle drag function for both mouse and touch
        function handleDrag(e) {
            if (!isDragging) return;
            
            const coords = getEventCoordinates(e);
            const deltaX = coords.x - startX;
            const deltaY = coords.y - startY;
            
            let newLeft = startLeft + deltaX;
            let newTop = startTop + deltaY;
            
            // Constrain to screen bounds
            const rect = element.getBoundingClientRect();
            const padding = 20;
            
            newLeft = Math.max(padding, Math.min(newLeft, window.innerWidth - rect.width - padding));
            newTop = Math.max(padding, Math.min(newTop, window.innerHeight - rect.height - padding));
            
            element.style.left = newLeft + 'px';
            element.style.top = newTop + 'px';
        }
        
        // End drag function
        function endDrag() {
            isDragging = false;
        }
        
        // Mouse events
        element.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', endDrag);
        
        // Touch events - only prevent default when actually dragging
        element.addEventListener('touchstart', function(e) {
            // Check if this is a close button before starting drag
            if (e.target.classList.contains('x') || 
                e.target.classList.contains('close') || 
                e.target.classList.contains('close-btn') || 
                e.target.hasAttribute('data-close') ||
                e.target.closest('.x, .close, .close-btn, [data-close]')) {
                return; // Let the close button handle the touch
            }
            startDrag(e);
        }, { passive: false });
        
        document.addEventListener('touchmove', handleDrag, { passive: false });
        document.addEventListener('touchend', endDrag);
        document.addEventListener('touchcancel', endDrag);
    }
    
    // Function to make element resizable
    function makeResizable(element) {
        // Find the folder image inside the element
        const folderImg = element.querySelector('.folder-img');
        if (!folderImg) {
            console.log('No .folder-img found, skipping resize functionality');
            return;
        }
        
        // Get the original aspect ratio of the image
        let aspectRatio = null;
        
        const setAspectRatio = () => {
            if (folderImg.naturalWidth && folderImg.naturalHeight) {
                aspectRatio = folderImg.naturalWidth / folderImg.naturalHeight;
                console.log('Image aspect ratio:', aspectRatio);
            }
        };
        
        // Set aspect ratio when image loads
        if (folderImg.complete) {
            setAspectRatio();
        } else {
            folderImg.onload = setAspectRatio;
        }
        
        // Create resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.style.cssText = `
            position: absolute;
            bottom: 0;
            right: 0;
            width: 30px;
            height: 30px;
            background: rgba(0,0,0,0);
            cursor: se-resize;
            z-index: 1000;
        `;
        
        element.appendChild(resizeHandle);
        element.style.position = 'absolute';
        
        // Keep folder image with standard cursor for dragging
        folderImg.style.cursor = 'default';
        folderImg.style.userSelect = 'none';
        
        let isResizing = false;
        let startX, startY, startWidth, startHeight;
        
        // Function to handle resize logic
        const handleResize = (e) => {
            if (!isResizing || !aspectRatio) return;
            
            const coords = getEventCoordinates(e);
            const deltaX = coords.x - startX;
            const deltaY = coords.y - startY;
            
            // Calculate new width based on movement
            let newWidth = Math.max(200, startWidth + deltaX);
            
            // Calculate height based on aspect ratio
            let newHeight = newWidth / aspectRatio;
            
            // Ensure minimum height
            if (newHeight < 100) {
                newHeight = 100;
                newWidth = newHeight * aspectRatio;
            }
            
            // Constrain to screen bounds
            const elementRect = element.getBoundingClientRect();
            const maxWidth = window.innerWidth - elementRect.left - 20;
            const maxHeight = window.innerHeight - elementRect.top - 20;
            
            if (newWidth > maxWidth) {
                newWidth = maxWidth;
                newHeight = newWidth / aspectRatio;
            }
            
            if (newHeight > maxHeight) {
                newHeight = maxHeight;
                newWidth = newHeight * aspectRatio;
            }
            
            // Apply new dimensions
            element.style.width = newWidth + 'px';
            element.style.height = newHeight + 'px';
            folderImg.style.width = '100%';
            folderImg.style.height = '100%';
            folderImg.style.objectFit = 'contain';
        };
        
        // Start resize function for both mouse and touch
        const startResize = (e) => {
            if (!aspectRatio) {
                console.log('Aspect ratio not yet determined, skipping resize');
                return;
            }
            
            // Bring to front when starting to resize
            bringToFront(element);
            
            isResizing = true;
            const coords = getEventCoordinates(e);
            startX = coords.x;
            startY = coords.y;
            startWidth = parseInt(window.getComputedStyle(element).width);
            startHeight = parseInt(window.getComputedStyle(element).height);
            
            e.preventDefault();
            e.stopPropagation();
        };
        
        // End resize function
        const endResize = () => {
            isResizing = false;
        };
        
        // Mouse events for resize handle
        resizeHandle.addEventListener('mousedown', startResize);
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', endResize);
        
        // Touch events for resize handle
        resizeHandle.addEventListener('touchstart', startResize, { passive: false });
        document.addEventListener('touchmove', handleResize, { passive: false });
        document.addEventListener('touchend', endResize);
        document.addEventListener('touchcancel', endResize);
    }
    
    // Add click handlers to folder wraps
    folderWraps.forEach((folderWrap, index) => {
        console.log(`Adding click handler to folder wrap ${index}`);
        folderWrap.addEventListener('click', function(e) {
            console.log('Folder wrap clicked!', e.target);
            e.preventDefault();
            
            const matchingOpenFolder = findMatchingOpenFolder(folderWrap);
            if (matchingOpenFolder) {
                console.log('Opening folder:', matchingOpenFolder);
                // Open the matching folder (allow multiple to be open)
                openFolder(matchingOpenFolder);
            } else {
                console.log('No matching open folder found');
            }
        });
    });
    
    // Add click handlers to close buttons within open folders
    openFolders.forEach(openFolder => {
        // Look for elements with class that starts with a dot or common close button classes
        const closeButtons = openFolder.querySelectorAll('.close, .close-btn, [data-close], .x');
        closeButtons.forEach(closeButton => {
            closeButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                closeOpenFolder(openFolder);
            });
        });
    });
});