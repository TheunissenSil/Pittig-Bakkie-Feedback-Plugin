// Page scaler module
const PageScaler = (() => {
    // Configuration
    let config;
    const init = (cfg) => {
        config = cfg;
    };

    const scale = () => {
        // Calculate the available width for the page
        const viewportWidth = window.innerWidth;
        const availableWidth = viewportWidth - config.sidebar;
        
        const scaleX = availableWidth / viewportWidth;
        
        // Scale the page
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
        // Reset the page
        Array.from(document.body.children).filter(
            (child) => !child.matches('#feedback-sidebar, #wpadminbar')
        ).forEach((child) => {
            child.style.transform = '';
            child.style.transformOrigin = '';
            child.style.height = '';
        });

        document.body.style.height = '';
    };

    return { init, scale, reset };
})();

export default PageScaler;