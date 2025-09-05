console.log("Form.js loaded");

// Auto-response system (global scope)
let responseCounter = 0;
const responses = ["firsts", "ey bybble", "we will be in touch"];
let spawnNewBubbleFunction = null; // Will be set when physics initializes

function scheduleAutoResponse() {
    if (responseCounter < responses.length && spawnNewBubbleFunction) {
        setTimeout(() => {
            spawnNewBubbleFunction(responses[responseCounter], 'bubble-us');
            responseCounter++;
            console.log(`Auto-spawned response ${responseCounter}: "${responses[responseCounter - 1]}"`);
        }, 1000); // 2 second delay
    }
}

// Function to flip gravity (will be set when physics initializes)
let flipGravityDownFunction = null;

// Form navigation logic
document.addEventListener('DOMContentLoaded', function() {
    const sendInputsWrap = document.querySelector('.send-inputs_wrap');
    const sendInputs = document.querySelectorAll('.send-input');
    const sendButton = document.querySelector('.send-button:not(.submit)');
    const submitButton = document.querySelector('.send-button.submit');
    
    let currentInputIndex = 0;
    
    // Initialize button states
    updateButtonStates();
    
    // Add event listeners to all inputs
    sendInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            updateButtonStates();
        });
    });
    
    // Add click handler to send button
    sendButton.addEventListener('click', () => {
        const currentInput = sendInputs[currentInputIndex];
        
        // Spawn bubble with current input content
        if (isInputFilled(currentInput)) {
            spawnNewBubble(currentInput.value, 'bubble-you'); // Response bubble for send button
            console.log('Spawned response bubble with content:', currentInput.value);
            
            // Schedule auto-response after 2 seconds
            scheduleAutoResponse();
        }
        
        // Only proceed if current input is filled and it's not the last input
        if (isInputFilled(currentInput) && currentInputIndex < sendInputs.length - 1) {
            // Move to next input
            currentInputIndex++;
            
            // Animate inputs up by -100%
            gsap.to(sendInputs, {
                y: `-${currentInputIndex * 100}%`,
                duration: 0.6,
                ease: "power2.out"
            });
            
            // Update button states for new current input
            updateButtonStates();
        }
    });
    
    // Add click handler to submit button for spawning new bubble (no preventDefault)
    if (submitButton) {
        submitButton.addEventListener('click', () => {
            const currentInput = sendInputs[currentInputIndex];
            if (isInputFilled(currentInput)) {
                spawnNewBubble(currentInput.value, 'bubble-you'); // Response bubble for submit
                console.log('Spawned response bubble with content:', currentInput.value);
                
                // Schedule auto-response after 2 seconds
                scheduleAutoResponse();
                
                // Wait 3 seconds then flip gravity to make bubbles fall
                setTimeout(() => {
                    if (flipGravityDownFunction) {
                        flipGravityDownFunction();
                    }
                }, 3000);
            }
            // No preventDefault() - let your external form logic handle submission
        });
    }
    
    function isInputFilled(input) {
        return input.value.trim() !== '';
    }
    
    function updateButtonStates() {
        const currentInput = sendInputs[currentInputIndex];
        const isSecondToLastInput = currentInputIndex === sendInputs.length - 1;
        
        if (isSecondToLastInput) {
            // Second to last input: hide send button, show submit button
            sendButton.style.display = 'none';
            submitButton.style.display = 'block';
            
            // Update submit button background based on input state
            if (isInputFilled(currentInput)) {
                submitButton.style.backgroundColor = '#002be1';
            } else {
                submitButton.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            }
        } else {
            // Not second to last input: show send button, hide submit button
            sendButton.style.display = 'block';
            submitButton.style.display = 'none';
            
            // Update send button background based on input state
            if (isInputFilled(currentInput)) {
                sendButton.style.backgroundColor = '#002be1';
            } else {
                sendButton.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            }
        }
    }
});

// Matter.js physics for bubbles
document.addEventListener('DOMContentLoaded', function() {
    // Wait for .field-wrap to have display: flex before initializing physics
    function checkFieldWrapReady() {
        const fieldWrap = document.querySelector('.field-wrap');
        if (fieldWrap && getComputedStyle(fieldWrap).display === 'flex') {
            console.log('.field-wrap has display: flex - initializing physics');
            initializeBubblePhysics();
        } else {
            console.log('Waiting for .field-wrap to have display: flex...');
            setTimeout(checkFieldWrapReady, 100); // Check every 100ms
        }
    }
    
    // Start checking after a short delay
    setTimeout(checkFieldWrapReady, 500);
});

function initializeBubblePhysics() {
    const bubblesContainer = document.querySelector('.bubbles_container');
    if (!bubblesContainer) {
        console.log('No bubbles container found');
        return;
    }
    
    // Matter.js aliases
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          World = Matter.World,
          Bodies = Matter.Bodies,
          Body = Matter.Body,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint,
          Constraint = Matter.Constraint,
          Events = Matter.Events;
    
    // Create engine with better physics settings
    const engine = Engine.create();
    const world = engine.world;
    
    // Adjust gravity and physics settings for floating bubbles
    engine.world.gravity.y = -0.3; // Stronger negative gravity - bubbles float up more
    engine.world.gravity.x = 0;
    
    // Enable collision detection and debugging
    engine.enableSleeping = false; // Keep bodies always active
    console.log('Engine collision detector:', engine.detector);
    
    // Get container dimensions with fallback
    const containerRect = bubblesContainer.getBoundingClientRect();
    let containerWidth = containerRect.width || bubblesContainer.offsetWidth || 800;
    let containerHeight = containerRect.height || bubblesContainer.offsetHeight || 600;
    
    console.log('Container dimensions:', { width: containerWidth, height: containerHeight });
    
    // Ensure minimum dimensions
    if (containerWidth < 100) containerWidth = 800;
    if (containerHeight < 100) containerHeight = 600;
    
    // Create renderer (hidden - no wireframes)
    const render = Render.create({
        element: bubblesContainer,
        engine: engine,
        options: {
            width: containerWidth,
            height: containerHeight,
            wireframes: false,    // Hide wireframes
            background: 'transparent',
            showVelocity: false,
            showAngleIndicator: false,
            showDebug: false,
            wireframeBackground: 'transparent',
            showBounds: false,
            showIds: false
        }
    });
    
    // Don't run the renderer - we only need physics, not visual rendering
    // Render.run(render);
    
    // Hide the canvas completely
    render.canvas.style.display = 'none';
    
    // Create boundaries (walls) - positioned at container edges, but allow bottom spawning
    const wallThickness = 50;
    const walls = [
        Bodies.rectangle(containerWidth / 2, -wallThickness/2, containerWidth, wallThickness, { 
            isStatic: true,
            render: { fillStyle: 'transparent' }
        }), // top
        Bodies.rectangle(containerWidth / 2, containerHeight + wallThickness/2, containerWidth, wallThickness, { 
            isStatic: true,
            render: { fillStyle: 'transparent' }
        }), // bottom
        Bodies.rectangle(-wallThickness/2, containerHeight / 2, wallThickness, containerHeight, { 
            isStatic: true,
            render: { fillStyle: 'transparent' }
        }), // left
        Bodies.rectangle(containerWidth + wallThickness/2, containerHeight / 2, wallThickness, containerHeight, { 
            isStatic: true,
            render: { fillStyle: 'transparent' }
        }) // right
    ];
    
    console.log('Created walls for container:', { 
        containerWidth, 
        containerHeight, 
        walls: walls.map(w => ({ x: w.position.x, y: w.position.y }))
    });
    
    World.add(world, walls);
    
    // Create physics bodies for existing bubbles
    const bubbleElements = bubblesContainer.querySelectorAll('.bubble-us, .bubble-you');
    const bubbleBodies = [];
    
    console.log('Found bubble elements:', bubbleElements.length);
    
    bubbleElements.forEach((bubbleEl, index) => {
        const rect = bubbleEl.getBoundingClientRect();
        const containerRect = bubblesContainer.getBoundingClientRect();
        
        // Set pointer events and draggable
        bubbleEl.style.pointerEvents = 'auto';
        bubbleEl.draggable = true;
        
        console.log(`Bubble ${index}:`, {
            element: bubbleEl,
            rect: rect,
            pointerEvents: bubbleEl.style.pointerEvents,
            draggable: bubbleEl.draggable
        });
        
        // Calculate position relative to container
        let x = rect.left - containerRect.left + rect.width / 2;
        let y = rect.top - containerRect.top + rect.height / 2;
        
        // Fallback for position calculation if values are invalid
        if (isNaN(x) || x < 0) x = containerWidth / 2;
        if (isNaN(y) || y < 0) y = containerHeight / 2;
        
        // Create rectangular body with 3% padding to prevent visual overlap
        const bodyWidth = rect.width * 1.03;
        const bodyHeight = rect.height * 1.03;
        
        // Use minimum dimension for boundary checking (like a radius)
        const boundaryRadius = Math.min(bodyWidth, bodyHeight) / 2;
        
        console.log(`Bubble ${index} calculations:`, {
            rectWidth: rect.width,
            rectHeight: rect.height,
            bodyWidth: bodyWidth,
            bodyHeight: bodyHeight,
            position: { x, y }
        });
        
        // Create rounded rectangle body (floating bubbles)
        const body = Bodies.rectangle(x, y, bodyWidth, bodyHeight, {
            restitution: 0.6, // More bouncy for floating
            friction: 0.1,    // Less friction for smooth movement
            frictionAir: 0.02, // Less air resistance for floating
            density: 0.001,   // Lighter for floating
            chamfer: { radius: Math.min(bodyWidth, bodyHeight) / 2 }, // Rounded corners
            collisionFilter: {
                category: 0x0001,    // Default category
                mask: 0xFFFF,        // Collides with everything
                group: 0             // No group filtering
            }
        });
        
        // Store reference to DOM element and dimensions
        body.bubbleElement = bubbleEl;
        body.originalElement = bubbleEl;
        body.circleRadius = boundaryRadius; // Store for boundary checking
        body.bodyWidth = bodyWidth;
        body.bodyHeight = bodyHeight;
        
        console.log(`Created physics body for bubble ${index}:`, {
            position: { x, y },
            dimensions: { width: bodyWidth, height: bodyHeight },
            boundaryRadius: boundaryRadius,
            body: body,
            bodyPosition: body.position
        });
        
        bubbleBodies.push(body);
    });
    
    World.add(world, bubbleBodies);
    
    // Add collision detection events
    Events.on(engine, 'collisionStart', function(event) {
        const pairs = event.pairs;
        console.log('Collision started between', pairs.length, 'pairs:');
        pairs.forEach((pair, index) => {
            console.log(`Pair ${index}:`, {
                bodyA: pair.bodyA.id,
                bodyB: pair.bodyB.id,
                bodyAPos: pair.bodyA.position,
                bodyBPos: pair.bodyB.position
            });
        });
    });
    
    Events.on(engine, 'collisionActive', function(event) {
        // Only log occasionally to avoid spam
        if (Math.random() < 0.01) {
            console.log('Active collisions:', event.pairs.length);
        }
    });
    
    // Custom mouse interaction for bubble elements
    let draggedBody = null;
    let dragConstraint = null;
    
    bubbleElements.forEach((bubbleEl, index) => {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        bubbleEl.addEventListener('mousedown', function(e) {
            e.preventDefault();
            isDragging = true;
            draggedBody = bubbleBodies[index];
            
            const rect = bubblesContainer.getBoundingClientRect();
            let mouseX = e.clientX - rect.left;
            let mouseY = e.clientY - rect.top;
            
            // Get the bubble's dimensions for boundary checking
            const bubbleWidth = draggedBody.bodyWidth || 60;
            const bubbleHeight = draggedBody.bodyHeight || 30;
            
            // Clamp initial mouse position to stay within container boundaries
            mouseX = Math.max(bubbleWidth / 2, Math.min(containerWidth - bubbleWidth / 2, mouseX));
            mouseY = Math.max(bubbleHeight / 2, Math.min(containerHeight - bubbleHeight / 2, mouseY));
            
            dragOffset.x = mouseX - draggedBody.position.x;
            dragOffset.y = mouseY - draggedBody.position.y;
            
            console.log('Started dragging bubble:', index, { 
                mouseX, 
                mouseY, 
                bodyPos: draggedBody.position,
                bubbleWidth: bubbleWidth,
                bubbleHeight: bubbleHeight
            });
            
            // Create constraint to mouse position
            dragConstraint = Constraint.create({
                bodyA: draggedBody,
                pointB: { x: mouseX, y: mouseY },
                stiffness: 0.5, // Less stiff for smoother dragging
                length: 0,
                damping: 0.1    // Add damping to reduce oscillation
            });
            
            World.add(world, dragConstraint);
        });
        
        bubbleEl.addEventListener('touchstart', function(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            bubbleEl.dispatchEvent(mouseEvent);
        });
    });
    
    // Global mouse move and up events
    document.addEventListener('mousemove', function(e) {
        if (draggedBody && dragConstraint) {
            const rect = bubblesContainer.getBoundingClientRect();
            let mouseX = e.clientX - rect.left;
            let mouseY = e.clientY - rect.top;
            
            // Get the bubble's dimensions for boundary checking
            const bubbleWidth = draggedBody.bodyWidth || 60;
            const bubbleHeight = draggedBody.bodyHeight || 30;
            
            // Clamp mouse position to stay within container boundaries
            mouseX = Math.max(bubbleWidth / 2, Math.min(containerWidth - bubbleWidth / 2, mouseX));
            mouseY = Math.max(bubbleHeight / 2, Math.min(containerHeight - bubbleHeight / 2, mouseY));
            
            // Update constraint position
            dragConstraint.pointB.x = mouseX;
            dragConstraint.pointB.y = mouseY;
            
            console.log('Dragging to (clamped):', { 
                originalMouse: { x: e.clientX - rect.left, y: e.clientY - rect.top },
                clampedMouse: { x: mouseX, y: mouseY },
                bubbleWidth: bubbleWidth,
                bubbleHeight: bubbleHeight
            });
        }
    });
    
    document.addEventListener('mouseup', function(e) {
        if (draggedBody && dragConstraint) {
            console.log('Stopped dragging');
            World.remove(world, dragConstraint);
            dragConstraint = null;
            draggedBody = null;
        }
    });
    
    document.addEventListener('touchmove', function(e) {
        if (draggedBody) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            document.dispatchEvent(mouseEvent);
        }
    });
    
    document.addEventListener('touchend', function(e) {
        const mouseEvent = new MouseEvent('mouseup', {});
        document.dispatchEvent(mouseEvent);
    });
    
    // Update DOM elements to match physics bodies
    function updateBubblePositions() {
        bubbleBodies.forEach((body, index) => {
            if (body.bubbleElement) {
                const element = body.bubbleElement;
                
                // Use stored dimensions instead of getBoundingClientRect to avoid layout thrashing
                const width = body.bodyWidth;
                const height = body.bodyHeight;
                
                // Update position using transform for better performance and synchronization
                const x = body.position.x - width / 2;
                const y = body.position.y - height / 2;
                
                element.style.position = 'absolute';
                element.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
                
                // Clear any existing left/top positioning to avoid conflicts
                element.style.left = '';
                element.style.top = '';
                
                // Log position updates occasionally for debugging
                if (index === 0 && Math.random() < 0.01) { // Log first bubble 1% of the time
                    console.log(`Bubble ${index} position:`, {
                        physicsPos: body.position,
                        transformPos: { x, y },
                        angle: body.angle
                    });
                }
            }
        });
    }
    
    // Create and run the runner
    const runner = Runner.create();
    Runner.run(runner, engine);
    
    // Update positions on each frame using both engine events and requestAnimationFrame
    Events.on(engine, 'afterUpdate', updateBubblePositions);
    
    // Stuck bubble detection and nudging system
    const bubbleStuckTracker = new Map(); // Track bubble positions over time
    
    function checkForStuckBubbles() {
        bubbleBodies.forEach((body, index) => {
            if (!body.bubbleElement) return;
            
            const currentPos = { x: body.position.x, y: body.position.y };
            const currentTime = Date.now();
            
            if (!bubbleStuckTracker.has(index)) {
                bubbleStuckTracker.set(index, {
                    positions: [{ pos: currentPos, time: currentTime }],
                    lastNudge: 0
                });
                return;
            }
            
            const tracker = bubbleStuckTracker.get(index);
            tracker.positions.push({ pos: currentPos, time: currentTime });
            
            // Keep only last 3 seconds of positions
            tracker.positions = tracker.positions.filter(p => currentTime - p.time < 3000);
            
            // Check if bubble hasn't moved much in the last 2 seconds
            if (tracker.positions.length > 10) { // Need some history
                const oldestPos = tracker.positions[0];
                const distance = Math.sqrt(
                    Math.pow(currentPos.x - oldestPos.pos.x, 2) + 
                    Math.pow(currentPos.y - oldestPos.pos.y, 2)
                );
                
                // If moved less than 20px in 2+ seconds and hasn't been nudged recently
                if (distance < 20 && currentTime - tracker.lastNudge > 5000) {
                    console.log(`Bubble ${index} appears stuck - giving it a nudge`);
                    
                    // Apply random nudge force
                    const nudgeForce = 0.02;
                    const forceX = (Math.random() - 0.5) * nudgeForce;
                    const forceY = -Math.random() * nudgeForce; // Bias upward
                    
                    Body.applyForce(body, body.position, { x: forceX, y: forceY });
                    tracker.lastNudge = currentTime;
                    
                    // Clear position history after nudging
                    tracker.positions = [{ pos: currentPos, time: currentTime }];
                }
            }
        });
    }
    
    // Additional smooth update loop for better synchronization
    function smoothUpdateLoop() {
        updateBubblePositions();
        
        // Check for stuck bubbles every 30 frames (~0.5 seconds at 60fps)
        if (Math.random() < 0.033) {
            checkForStuckBubbles();
        }
        
        requestAnimationFrame(smoothUpdateLoop);
    }
    smoothUpdateLoop();
    
    // Handle window resize
    function handleResize() {
        const newRect = bubblesContainer.getBoundingClientRect();
        const newWidth = newRect.width;
        const newHeight = newRect.height;
        
        // Update render size
        render.options.width = newWidth;
        render.options.height = newHeight;
        
        // Update wall positions
        Body.setPosition(walls[0], { x: newWidth / 2, y: -25 }); // top
        Body.setPosition(walls[1], { x: newWidth / 2, y: newHeight + 25 }); // bottom
        Body.setPosition(walls[2], { x: -25, y: newHeight / 2 }); // left
        Body.setPosition(walls[3], { x: newWidth + 25, y: newHeight / 2 }); // right
    }
    
    window.addEventListener('resize', handleResize);
    
    // Function to spawn a new bubble with text content
    function spawnNewBubble(text, bubbleClass = 'bubble-you') {
        // Create new bubble element
        const newBubble = document.createElement('div');
        newBubble.className = bubbleClass;
        newBubble.draggable = true;
        newBubble.style.pointerEvents = 'auto';
        
        // Add max-width constraint and ensure text wrapping
        newBubble.style.maxWidth = '220px';
        newBubble.style.width = 'max-content';
        newBubble.style.wordWrap = 'break-word';
        newBubble.style.overflowWrap = 'break-word';
        newBubble.style.whiteSpace = 'normal';
        newBubble.style.wordBreak = 'break-word';
        newBubble.style.hyphens = 'auto';
        
        // Add text content
        const textElement = document.createElement('p');
        textElement.className = 'gnp';
        if (bubbleClass === 'bubble-us') {
            textElement.classList.add('is--white');
        }
        textElement.textContent = text;
        textElement.style.margin = '0'; // Remove default paragraph margins
        textElement.style.setProperty('word-wrap', 'break-word', 'important');
        textElement.style.setProperty('overflow-wrap', 'break-word', 'important');
        textElement.style.setProperty('word-break', 'break-word', 'important');
        textElement.style.setProperty('white-space', 'normal', 'important');
        textElement.style.setProperty('hyphens', 'auto', 'important');
        textElement.style.setProperty('max-width', '100%', 'important');
        newBubble.appendChild(textElement);
        
        // Add to container first to get dimensions
        newBubble.style.position = 'absolute';
        newBubble.style.left = '0px';
        newBubble.style.top = '0px';
        bubblesContainer.appendChild(newBubble);
        
        // Wait a frame for DOM to update, then position based on actual dimensions
        requestAnimationFrame(() => {
            const rect = newBubble.getBoundingClientRect();
            const containerRect = bubblesContainer.getBoundingClientRect();
            
            // Calculate safe spawn position based on bubble's actual width
            const bubbleWidth = rect.width;
            const bubbleHeight = rect.height;
            
            let spawnX;
            if (bubbleClass === 'bubble-you') {
                // bubble-you spawns in right half, accounting for bubble width
                const rightHalfStart = containerWidth / 2;
                const rightHalfEnd = containerWidth - bubbleWidth - 20; // 20px margin from edge
                spawnX = Math.random() * Math.max(50, rightHalfEnd - rightHalfStart) + rightHalfStart;
            } else {
                // bubble-us spawns in left half, accounting for bubble width
                const leftHalfStart = 20; // 20px margin from edge
                const leftHalfEnd = containerWidth / 2 - bubbleWidth;
                spawnX = Math.random() * Math.max(50, leftHalfEnd - leftHalfStart) + leftHalfStart;
            }
            
            const spawnY = containerHeight - bubbleHeight / 2; // Account for bubble height
            
            // Update position with safe coordinates
            newBubble.style.left = spawnX + 'px';
            newBubble.style.top = spawnY + 'px';
            
            console.log(`Spawning ${bubbleClass} at:`, { 
                x: spawnX, 
                y: spawnY, 
                bubbleWidth: bubbleWidth,
                bubbleHeight: bubbleHeight,
                containerWidth: containerWidth,
                containerHeight: containerHeight,
                text: text
            });
            
            // Calculate physics body position
            const x = spawnX + bubbleWidth / 2;
            const y = spawnY + bubbleHeight / 2;
            
            // Create physics body with 3% padding
            const bodyWidth = rect.width * 1.03;
            const bodyHeight = rect.height * 1.03;
            
            const body = Bodies.rectangle(x, y, bodyWidth, bodyHeight, {
                restitution: 0.6, // More bouncy for floating
                friction: 0.1,    // Less friction for smooth movement
                frictionAir: 0.02, // Less air resistance for floating
                density: 0.001,   // Lighter for floating
                chamfer: { radius: Math.min(bodyWidth, bodyHeight) / 2 },
                collisionFilter: {
                    category: 0x0001,
                    mask: 0xFFFF,
                    group: 0
                }
            });
            
            // Store references and dimensions
            body.bubbleElement = newBubble;
            body.originalElement = newBubble;
            body.circleRadius = Math.min(bodyWidth, bodyHeight) / 2;
            body.bodyWidth = bodyWidth;
            body.bodyHeight = bodyHeight;
            
            // Add to physics world
            bubbleBodies.push(body);
            World.add(world, body);
            
            // Add mouse interaction for the new bubble
            addBubbleInteraction(newBubble, bubbleBodies.length - 1);
            
            // Initialize stuck tracker for new bubble
            const bubbleIndex = bubbleBodies.length - 1;
            if (typeof bubbleStuckTracker !== 'undefined') {
                bubbleStuckTracker.set(bubbleIndex, {
                    positions: [{ pos: { x, y }, time: Date.now() }],
                    lastNudge: 0
                });
            }
            
            // Add some initial velocity for dynamic entry
            const force = bubbleClass === 'bubble-us' ? 0.02 : -0.02;
            Body.applyForce(body, body.position, { x: force, y: -0.01 });
            
            console.log('Created new bubble:', { text, class: bubbleClass, position: { x, y } });
        });
    }
    
    // Function to add interaction to a bubble element
    function addBubbleInteraction(bubbleEl, index) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        bubbleEl.addEventListener('mousedown', function(e) {
            e.preventDefault();
            isDragging = true;
            draggedBody = bubbleBodies[index];
            
            const rect = bubblesContainer.getBoundingClientRect();
            let mouseX = e.clientX - rect.left;
            let mouseY = e.clientY - rect.top;
            
            // Get the bubble's dimensions for boundary checking
            const bubbleWidth = draggedBody.bodyWidth || 60;
            const bubbleHeight = draggedBody.bodyHeight || 30;
            
            // Clamp initial mouse position to stay within container boundaries
            mouseX = Math.max(bubbleWidth / 2, Math.min(containerWidth - bubbleWidth / 2, mouseX));
            mouseY = Math.max(bubbleHeight / 2, Math.min(containerHeight - bubbleHeight / 2, mouseY));
            
            dragOffset.x = mouseX - draggedBody.position.x;
            dragOffset.y = mouseY - draggedBody.position.y;
            
            console.log('Started dragging bubble:', index, { 
                mouseX, 
                mouseY, 
                bodyPos: draggedBody.position,
                bubbleWidth: bubbleWidth,
                bubbleHeight: bubbleHeight
            });
            
            // Create constraint to mouse position
            dragConstraint = Constraint.create({
                bodyA: draggedBody,
                pointB: { x: mouseX, y: mouseY },
                stiffness: 0.5, // Less stiff for smoother dragging
                length: 0,
                damping: 0.1    // Add damping to reduce oscillation
            });
            
            World.add(world, dragConstraint);
        });
        
        bubbleEl.addEventListener('touchstart', function(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            bubbleEl.dispatchEvent(mouseEvent);
        });
    }

    // Function to add new bubble dynamically (legacy support)
    window.addBubble = function(bubbleElement, isUser = true) {
        const rect = bubbleElement.getBoundingClientRect();
        const containerRect = bubblesContainer.getBoundingClientRect();
        
        const x = rect.left - containerRect.left + rect.width / 2;
        const y = rect.top - containerRect.top + rect.height / 2;
        const radius = Math.min(rect.width, rect.height) / 2;
        
        const body = Bodies.circle(x, y, radius, {
            restitution: 0.6,
            friction: 0.1,
            frictionAir: 0.01,
            density: 0.001
        });
        
        body.bubbleElement = bubbleElement;
        bubbleBodies.push(body);
        World.add(world, body);
        
        // Add some initial velocity for dynamic entry
        const force = isUser ? 0.02 : -0.02;
        Body.applyForce(body, body.position, { x: force, y: -0.01 });
    };
    
    // Function to flip gravity and make bubbles fall
    function flipGravityDown() {
        engine.world.gravity.y = 0.8; // Strong downward gravity
        console.log('Gravity flipped - bubbles will fall down');
    }
    
    // Set up global function references
    spawnNewBubbleFunction = spawnNewBubble;
    flipGravityDownFunction = flipGravityDown;
    
    // Expose functions globally
    window.spawnNewBubble = spawnNewBubble;
    window.flipGravityDown = flipGravityDown;
    
    // Function to apply force to all bubbles (for interactions)
    window.shakeBubbles = function(intensity = 0.01) {
        bubbleBodies.forEach(body => {
            const forceX = (Math.random() - 0.5) * intensity;
            const forceY = (Math.random() - 0.5) * intensity;
            Body.applyForce(body, body.position, { x: forceX, y: forceY });
        });
    };
    
    // Function to test collisions by pushing bubbles together
    window.testCollisions = function() {
        if (bubbleBodies.length >= 2) {
            console.log('Testing collisions by pushing bubbles together');
            // Push first bubble towards second
            const force = 0.05;
            Body.applyForce(bubbleBodies[0], bubbleBodies[0].position, { x: force, y: 0 });
            Body.applyForce(bubbleBodies[1], bubbleBodies[1].position, { x: -force, y: 0 });
            
            console.log('Bubble positions:', {
                bubble0: bubbleBodies[0].position,
                bubble1: bubbleBodies[1].position,
                distance: Math.sqrt(
                    Math.pow(bubbleBodies[0].position.x - bubbleBodies[1].position.x, 2) +
                    Math.pow(bubbleBodies[0].position.y - bubbleBodies[1].position.y, 2)
                )
            });
        }
    };
    
    // Expose physics bodies for debugging
    window.bubbleBodies = bubbleBodies;
    window.physicsEngine = engine;
}

