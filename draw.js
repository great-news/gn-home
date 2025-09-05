console.log("draw.js loaded");

// Drawing app functionality
class DrawingApp {
    constructor() {
        this.canvas = document.querySelector('.draw-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentColor = '#ec0fb1'; // Default pink
        this.currentTool = 'pen'; // Default pen
        this.penWidth = 4;
        this.eraserWidth = 30;
        this.currentLineWidth = this.penWidth;
        this.cursorIndicator = null;
        this.isMobile = false;
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.checkMobileBreakpoint();
        this.setDefaultSelections();
        this.setupResizeListener();
    }
    
    setupCanvas() {
        // Set canvas size to match its display size
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Set drawing properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = this.currentLineWidth;
        this.ctx.strokeStyle = this.currentColor;
    }
    
    setupEventListeners() {
        // Canvas drawing events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
        
        // Cursor indicator events
        this.canvas.addEventListener('mouseenter', this.showCursor.bind(this));
        this.canvas.addEventListener('mouseleave', this.hideCursor.bind(this));
        this.canvas.addEventListener('mousemove', this.updateCursor.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
        
        // Color selection
        document.querySelectorAll('.color').forEach(colorDiv => {
            colorDiv.addEventListener('click', this.selectColor.bind(this));
        });
        
        // Tool selection
        document.querySelectorAll('.tool').forEach(toolDiv => {
            toolDiv.addEventListener('click', this.selectTool.bind(this));
        });
        
        this.setupCursorIndicator();
    }
    
    setDefaultSelections() {
        // Set default pink color as active
        const pinkColor = document.querySelector('.color.pink');
        if (pinkColor) {
            pinkColor.classList.add('is--active');
        }
        
        // Set default pen tool as active only if not on mobile
        if (!this.isMobile) {
            const penTool = document.querySelector('.tool.pen');
            if (penTool) {
                penTool.classList.add('is--active');
            }
        }
    }
    
    startDrawing(e) {
        // Don't draw when move tool is active
        if (this.currentTool === 'move') {
            return;
        }
        
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
    }
    
    draw(e) {
        if (!this.isDrawing) return;
        
        const pos = this.getMousePos(e);
        
        if (this.currentTool === 'pen') {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.penWidth;
        } else if (this.currentTool === 'erase') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.eraserWidth;
        }
        
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    }
    
    stopDrawing() {
        this.isDrawing = false;
        this.ctx.beginPath();
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    handleTouch(e) {
        // If move tool is active, allow default touch behavior (scrolling)
        if (this.currentTool === 'move') {
            return;
        }
        
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                        e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }
    
    selectColor(e) {
        // Remove active class from all colors
        document.querySelectorAll('.color').forEach(color => {
            color.classList.remove('is--active');
        });
        
        // Add active class to clicked color
        e.target.classList.add('is--active');
        
        // Set the current color based on the class
        if (e.target.classList.contains('pink')) {
            this.currentColor = '#ec0fb1';
        } else if (e.target.classList.contains('blue')) {
            this.currentColor = '#3115d3';
        } else if (e.target.classList.contains('yellow')) {
            this.currentColor = '#cabd27';
        }
        
        // Update canvas stroke style
        this.ctx.strokeStyle = this.currentColor;
    }
    
    selectTool(e) {
        // Remove active class from all tools
        document.querySelectorAll('.tool').forEach(tool => {
            tool.classList.remove('is--active');
        });
        
        // Add active class to clicked tool
        e.target.classList.add('is--active');
        
        // Set the current tool
        if (e.target.classList.contains('pen')) {
            this.currentTool = 'pen';
            this.currentLineWidth = this.penWidth;
        } else if (e.target.classList.contains('erase')) {
            this.currentTool = 'erase';
            this.currentLineWidth = this.eraserWidth;
        } else if (e.target.classList.contains('move')) {
            this.currentTool = 'move';
            this.currentLineWidth = 0; // No cursor indicator for move tool
        }
        
        // Update cursor size
        this.updateCursorSize();
    }
    
    setupCursorIndicator() {
        // Create cursor indicator element
        this.cursorIndicator = document.createElement('div');
        this.cursorIndicator.style.position = 'fixed';
        this.cursorIndicator.style.pointerEvents = 'none';
        this.cursorIndicator.style.borderRadius = '50%';
        this.cursorIndicator.style.border = '2px solid rgba(0, 0, 0, 0.3)';
        this.cursorIndicator.style.backgroundColor = 'transparent';
        this.cursorIndicator.style.display = 'none';
        this.cursorIndicator.style.zIndex = '10000';
        this.cursorIndicator.style.transform = 'translate(-50%, -50%)';
        this.cursorIndicator.style.boxSizing = 'border-box';
        
        document.body.appendChild(this.cursorIndicator);
        this.updateCursorSize();
    }
    
    updateCursorSize() {
        if (this.cursorIndicator) {
            const size = this.currentLineWidth;
            this.cursorIndicator.style.width = `${size}px`;
            this.cursorIndicator.style.height = `${size}px`;
        }
    }
    
    showCursor(e) {
        // Don't show cursor for move tool
        if (this.currentTool === 'move') {
            return;
        }
        
        if (this.cursorIndicator) {
            this.cursorIndicator.style.display = 'block';
            this.updateCursor(e);
        }
    }
    
    hideCursor() {
        if (this.cursorIndicator) {
            this.cursorIndicator.style.display = 'none';
        }
    }
    
    updateCursor(e) {
        if (this.cursorIndicator && this.cursorIndicator.style.display !== 'none') {
            this.cursorIndicator.style.left = `${e.clientX}px`;
            this.cursorIndicator.style.top = `${e.clientY}px`;
        }
    }
    
    checkMobileBreakpoint() {
        this.isMobile = window.innerWidth <= 991;
        if (this.isMobile) {
            this.setMoveToolAsDefault();
        }
    }
    
    setupResizeListener() {
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.checkMobileBreakpoint();
            
            // If we just switched to mobile, auto-select move tool
            if (this.isMobile && !wasMobile) {
                this.setMoveToolAsDefault();
            }
            // If we switched from mobile to desktop, revert to pen tool
            else if (!this.isMobile && wasMobile && this.currentTool === 'move') {
                this.setDefaultSelections();
            }
        });
    }
    
    setMoveToolAsDefault() {
        const moveTool = document.querySelector('.tool.move');
        if (moveTool) {
            // Remove active class from all tools
            document.querySelectorAll('.tool').forEach(tool => {
                tool.classList.remove('is--active');
            });
            
            // Set move tool as active
            moveTool.classList.add('is--active');
            this.currentTool = 'move';
            this.currentLineWidth = 0;
            
            // Hide cursor indicator
            this.hideCursor();
        }
    }
}

// Initialize the drawing app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DrawingApp();
});