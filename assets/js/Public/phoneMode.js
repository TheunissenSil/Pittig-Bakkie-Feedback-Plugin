import FeedbackMode from './feedbackMode.js';
import PageScaler from './pageScaler.js';

// Phone mode module
const PhoneMode = (() => {
    const enablePhoneMode = () => {
        // Make sure the sidebar and admin bar are not included in the iframe
        const bodyChildren = Array.from(document.body.children).filter(
            (child) => !child.matches('#feedback-sidebar, #wpadminbar')
        );
    
        // Hide scrollbars and center content
        document.body.style.height = '100vh';
        document.body.style.overflow = 'hidden';
        document.body.style.display = 'flex';
        document.body.style.justifyContent = 'center';
        document.body.style.alignItems = 'center';
        document.body.style.paddingRight = '300px';
    
        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'phone-size-iframe';
        iframe.style.width = '394px';
        iframe.style.height = '700px';
        iframe.style.border = '1px solid #000';
        iframe.style.borderRadius = '10px';
        iframe.style.overflowY = 'scroll';
        iframe.style.position = 'relative';
    
        document.body.appendChild(iframe);

        // Move all children except excluded ones into the iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.body.className = document.body.className;
    
        // Set iframe body styles
        iframeDoc.body.style.width = '375px';
        iframeDoc.body.style.height = '700px';
        iframeDoc.body.style.boxSizing = 'border-box';
        iframeDoc.body.style.margin = '0';
    
        // Copy head contents to iframe
        const headContent = document.head.cloneNode(true);
        iframeDoc.head.innerHTML = '';
        Array.from(headContent.children).forEach((child) => {
            iframeDoc.head.appendChild(child.cloneNode(true));
        });
    
        // Move body children to iframe
        bodyChildren.forEach((child) => {
            iframeDoc.body.appendChild(child);
            child.style.transform = '';
            child.style.transformOrigin = '';
            child.style.height = 'auto';
        });
    
        // Add viewport meta tag for media queries inside the iframe
        const viewportMetaTag = iframeDoc.createElement('meta');
        viewportMetaTag.name = 'viewport';
        viewportMetaTag.content = 'width=375, initial-scale=1';
        iframeDoc.head.appendChild(viewportMetaTag);
    
        // Update button text and state
        const scaleToPhoneButton = document.getElementById('scale-to-phone');
        scaleToPhoneButton.textContent = 'Scale Back to Desktop';
        scaleToPhoneButton.dataset.phoneMode = 'true';

        FeedbackMode.enable(iframeDoc);
    };

    const disablePhoneMode = () => {
        const iframe = document.getElementById('phone-size-iframe');
        if (iframe) {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const iframeBodyChildren = Array.from(iframeDoc.body.children);
    
            // Move children back to the main document body
            iframeBodyChildren.forEach((child) => {
                document.body.appendChild(child);
            });
    
            // Remove the iframe
            iframe.remove();
        }
    
        // Reset body styles
        document.body.style.height = '';
        document.body.style.overflow = '';
        document.body.style.display = '';
        document.body.style.justifyContent = '';
        document.body.style.alignItems = '';
        document.body.style.paddingRight = '';
    
        // Scale back to desktop
        PageScaler.scale();
    
        // Update button text and state
        const scaleToPhoneButton = document.getElementById('scale-to-phone');
        scaleToPhoneButton.textContent = 'Scale to Phone';
        scaleToPhoneButton.dataset.phoneMode = 'false';
    };

    // Toggle phone mode
    const togglePhoneMode = () => {
        const scaleToPhoneButton = document.getElementById('scale-to-phone');
        let isPhoneMode = scaleToPhoneButton.dataset.phoneMode === 'true';

        if (!isPhoneMode) {
            enablePhoneMode();
        } else {
            disablePhoneMode();
        }
    };

    return { toggle: togglePhoneMode, disablePhoneMode };
})();

export default PhoneMode;