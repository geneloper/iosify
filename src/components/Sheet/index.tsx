import { useEffect, useState, useRef } from 'react';
import withPortal from '../../HOCs/withPortal';
import styles from './styles.module.scss';

interface Props {
    isOpened: boolean; // Determines if the Sheet component is visible
    setIsOpened: React.Dispatch<React.SetStateAction<boolean>>; // Function to control the visibility of the Sheet
    children?: React.ReactNode; // Optional children to render inside the Sheet
}

function Sheet({ isOpened, setIsOpened, children }: Props) {
    // State to track drag position, start time, and dragging status
    const [dragState, setDragState] = useState({
        startY: null as number | null, // Starting Y position of the drag
        currentY: null as number | null, // Current Y position during the drag
        startTime: null as number | null, // Time when dragging started
        isDragging: false, // Whether dragging is in progress
        direction: null as 'up' | 'down' | null, // Direction of the drag
        totalDistance: 0, // Total distance moved
        totalTime: 0 // Total time spent dragging
    });
    const [overlayOpacity, setOverlayOpacity] = useState(0); // State for overlay opacity
    const contentRef = useRef<HTMLDivElement | null>(null); // Ref to the content element

    // Effect to handle opening and closing animations
    useEffect(() => {
        if (isOpened) {
            setOverlayOpacity(1); // Set overlay opacity to full when opened
            document.body.style.overflow = 'hidden'; // Prevent scrolling when opened
            if (contentRef.current) {
                contentRef.current.style.transform = ''; // Reset transform
                contentRef.current.style.transition = 'transform .3s ease'; // Apply transition for smooth closing
            }
        } else {
            setOverlayOpacity(0); // Set overlay opacity to none when closed
            document.body.style.overflow = ''; // Restore scrolling
            if (contentRef.current) {
                contentRef.current.style.transform = ''; // Reset transform
                contentRef.current.style.transition = 'transform .3s ease'; // Apply transition for smooth closing
            }
        }
    }, [isOpened]);

    // Start dragging and initialize drag state
    const startDrag = (y: number) => {
        setDragState({
            startY: y, // Set initial drag position
            currentY: null,
            startTime: Date.now(), // Record start time
            isDragging: true, // Set dragging status to true
            direction: null, // Reset direction
            totalDistance: 0, // Reset total distance
            totalTime: 0 // Reset total time
        });
        if (contentRef.current) {
            contentRef.current.style.transition = 'unset'; // Disable transition during dragging
        }
    };

    // Handle drag movement and update UI accordingly
    const dragMove = (y: number) => {
        if (!dragState.isDragging || dragState.startY === null) return; // Return early if not dragging

        const dragDistance = y - (dragState.startY || 0); // Calculate distance moved
        const resistance = 0.1; // Resistance factor for upward dragging
        const maxUpwardDrag = window.innerHeight * 0.01; // Max upward drag distance
        const adjustedDragDistance = dragDistance > 0
            ? dragDistance // Downwards: move freely
            : Math.max(-maxUpwardDrag, dragDistance * resistance); // Upwards: with resistance and limited

        // Determine the direction of the drag
        const direction = dragDistance > 0 ? 'down' : 'up';
        setDragState(prev => ({
            ...prev,
            currentY: y,
            direction, // Update direction
            totalDistance: prev.totalDistance + Math.abs(y - (prev.currentY || y)), // Update total distance
            totalTime: (Date.now() - (prev.startTime || Date.now())) / 1000 // Update total time in seconds
        }));

        // Calculate opacity based on downward drag distance
        const maxDragDistance = window.innerHeight * 0.5; // Maximum drag distance for minimum opacity
        const opacity = dragDistance > 0
            ? Math.max(0, 1 - Math.abs(dragDistance) / maxDragDistance) // Calculate opacity only for downward movement
            : 1; // Full opacity if dragging upwards

        setOverlayOpacity(opacity); // Update overlay opacity
        if (contentRef.current) {
            contentRef.current.style.transform = `translateY(${adjustedDragDistance}px) translateZ(0)`; // Apply drag transform
        }
    };

    // End dragging and handle sheet closing logic
    const endDrag = () => {
        if (!dragState.isDragging || dragState.startY === null || dragState.currentY === null || dragState.startTime === null) return;

        const dragDistance = dragState.currentY - dragState.startY; // Calculate total drag distance
        const screenHeight = window.innerHeight;
        const velocity = dragState.totalDistance / dragState.totalTime; // Calculate average velocity in pixels per second

        const threshold = screenHeight / 2; // Threshold for deciding if the sheet should close
        const fastCloseThreshold = 500; // Velocity threshold for fast close

        // Determine if the sheet should close or open based on drag distance and velocity
        if ((dragDistance > threshold || velocity > fastCloseThreshold) && dragState.direction === 'down') {
            setIsOpened(false); // Close the sheet if dragged enough or too fast
            if (contentRef.current) {
                contentRef.current.style.transition = 'transform .3s ease'; // Apply transition for closing
                setTimeout(() => {
                    contentRef.current!.style.transform = 'translateY(100%) translateZ(0)'; // Move sheet out of view
                }, 10);
            }
        } else if (dragState.direction === 'up' && dragDistance < threshold && velocity > fastCloseThreshold) {
            setIsOpened(true); // Reopen the sheet if dragging upwards with high velocity
            if (contentRef.current) {
                contentRef.current.style.transition = 'transform .3s ease'; // Apply transition for opening
                setTimeout(() => {
                    contentRef.current!.style.transform = ''; // Reset transform
                }, 10);
            }
        } else {
            if (contentRef.current) {
                contentRef.current.style.transition = 'transform .3s ease'; // Apply transition for returning
                setTimeout(() => {
                    contentRef.current!.style.transform = ''; // Reset transform
                }, 10);
            }
        }

        // Reset drag state
        setDragState({
            startY: null,
            currentY: null,
            startTime: null,
            isDragging: false,
            direction: null, // Reset direction
            totalDistance: 0, // Reset total distance
            totalTime: 0 // Reset total time
        });

        setOverlayOpacity(1); // Ensure overlay opacity is set to full
    };

    // Handle touch start events
    const handleTouchStart = (e: React.TouchEvent) => startDrag(e.touches[0].clientY);
    // Handle touch move events
    const handleTouchMove = (e: React.TouchEvent) => dragMove(e.touches[0].clientY);
    // Handle touch end events
    const handleTouchEnd = () => endDrag();

    // Handle mouse down events
    const handleMouseDown = (e: React.MouseEvent) => startDrag(e.clientY);
    // Handle mouse move events
    const handleMouseMove = (e: React.MouseEvent) => {
        if (dragState.isDragging) dragMove(e.clientY);
    };
    // Handle mouse up events
    const handleMouseUp = () => endDrag();

    // Effect to manage mouse events during dragging
    useEffect(() => {
        if (dragState.isDragging) {
            const handleMouseMove = (e: MouseEvent) => dragMove(e.clientY);
            const handleMouseUp = () => {
                endDrag(); // End drag on mouse up
                document.removeEventListener('mousemove', handleMouseMove); // Clean up event listeners
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove); // Set up event listeners
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove); // Clean up event listeners on unmount
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragState.isDragging]);

    return (
        <div className={`${styles.wrapper} ${isOpened ? styles.wrapperOpened : ''}`}>
            <div
                className={styles.overlay}
                style={{ opacity: overlayOpacity, transition: dragState.isDragging ? 'unset' : 'opacity .3s ease' }} // Apply dynamic opacity to overlay with transition control
                onClick={() => setIsOpened(false)} // Close the sheet when overlay is clicked
            ></div>
            <div
                ref={contentRef} // Reference to the content element for transformations
                className={styles.content}
                onTouchStart={handleTouchStart} // Handle touch start
                onTouchMove={handleTouchMove} // Handle touch move
                onTouchEnd={handleTouchEnd} // Handle touch end
                onMouseDown={handleMouseDown} // Handle mouse down
                onMouseMove={handleMouseMove} // Handle mouse move
                onMouseUp={handleMouseUp} // Handle mouse up
                onMouseLeave={handleMouseUp} // Handle mouse leaving the area
            >
                {children} // Render children inside the Sheet
            </div>
        </div>
    );
}

export default withPortal(Sheet);
