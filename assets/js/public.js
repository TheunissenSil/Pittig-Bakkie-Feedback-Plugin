document.addEventListener('DOMContentLoaded', function () {
    // Constants
    const SIDEBAR_WIDTH = 300;

    // FeedbackMode Module
    const FeedbackMode = (() => {
        let permanentlyHighlightedElement = null;

        // Enable Feedback Mode
        const enable = () => {
            document.body.classList.add('feedback-mode-active');
            PageScaler.scale();
            document.body.addEventListener('mouseover', handleMouseOver);
            document.body.addEventListener('mouseout', handleMouseOut);
            document.body.addEventListener('click', handleElementClick);
        };

        // Disable Feedback Mode
        const disable = () => {
            document.body.classList.remove('feedback-mode-active');
            PageScaler.reset();
            document.body.removeEventListener('mouseover', handleMouseOver);
            document.body.removeEventListener('mouseout', handleMouseOut);
            document.body.removeEventListener('click', handleElementClick);

            if (permanentlyHighlightedElement) {
                removePermanentHighlight(permanentlyHighlightedElement);
                permanentlyHighlightedElement = null;
            }
        };

        // Handles the hover over the elements
        const handleMouseOver = (event) => {
            if (permanentlyHighlightedElement) return;

            const target = event.target.closest('.elementor-element');
            if (target) {
                clearOutlines();
                target.classList.add('outlined');
            }
        };

        // Handles the hover out of the elements
        const handleMouseOut = (event) => {
            const target = event.target.closest('.elementor-element');
            if (target && target !== permanentlyHighlightedElement) {
                target.classList.remove('outlined');
            }
        };

        // Handles the click and adds a permanent highlight
        const handleElementClick = (event) => {
            const target = event.target.closest('.elementor-element');
            if (!target || permanentlyHighlightedElement) return;

            event.preventDefault();
            event.stopPropagation();

            permanentlyHighlightedElement = target;
            clearOutlines();
            target.classList.add('permanent-highlight');

            // add close button
            const closeButton = document.createElement('button');
            closeButton.classList.add('close-button-in-element');
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                removePermanentHighlight(target);
                enable(); 
                permanentlyHighlightedElement = null;
            });

            target.appendChild(closeButton);

            document.body.removeEventListener('mouseover', handleMouseOver);
        };

        // Clears all outlines
        const clearOutlines = () => {
            document.querySelectorAll('.outlined').forEach((el) => el.classList.remove('outlined'));
        };

        // Removes the permanent highlight
        const removePermanentHighlight = (element) => {
            element.classList.remove('permanent-highlight');
            const closeButton = element.querySelector('.close-button-in-element');
            if (closeButton) closeButton.remove();
        };

        return { enable, disable };
    })();

    // PageScaler Module
    const PageScaler = (() => {
        const scale = () => {
            const viewportWidth = window.innerWidth;
            const availableWidth = viewportWidth - SIDEBAR_WIDTH;
            
            const scaleX = availableWidth / viewportWidth;
            
            Array.from(document.body.children).filter(
                (child) => !child.matches('#feedback-sidebar, #wpadminbar')
            ).forEach((child) => {
                child.style.transform = `scale(${scaleX})`;
                child.style.transformOrigin = 'top left';
                child.style.height = `${child.offsetHeight * scaleX}px`;
            });

            document.body.style.height = `${document.body.scrollHeight * scaleX}px`;
        };

        const reset = () => {
            Array.from(document.body.children).filter(
                (child) => !child.matches('#feedback-sidebar, #wpadminbar')
            ).forEach((child) => {
                child.style.transform = '';
                child.style.transformOrigin = '';
                child.style.height = '';
            });

            document.body.style.height = '';
        };

        return { scale, reset };
    })();

    // Button Event Listeners
    document.getElementById('enable-feedback-mode').addEventListener('click', FeedbackMode.enable);
    document.getElementById('disable-feedback-mode').addEventListener('click', FeedbackMode.disable);
});