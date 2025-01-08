import PageScaler from './pageScaler.js';
import PhoneMode from './phoneMode.js';
import FeedbackHandler from './feedbackHandler.js';

const FeedbackMode = (() => {
    // Configuration
    let config;
    const init = (cfg) => {
        config = cfg;
        setupFeedbackAccordion();
    };

    // Element that is permanently highlighted
    let permanentlyHighlightedElement = null;

    // Enable the feedback mode
    const enable = (doc = document) => {
        document.body.classList.add('feedback-mode-active');

        // Scale the page if is not phone mode
        const scaleToPhoneButton = document.getElementById('scale-to-phone');
        if (scaleToPhoneButton.dataset.phoneMode !== 'true') {
            PageScaler.scale();
        }

        // Add event listeners for feedbackmode
        doc.body.addEventListener('mouseover', handleMouseOver);
        doc.body.addEventListener('mouseout', handleMouseOut);
        doc.body.addEventListener('click', handleElementClick);
    };

    const disable = () => {
        document.body.classList.remove('feedback-mode-active');

        // Remove event listeners for feedbackmode
        document.body.removeEventListener('mouseover', handleMouseOver);
        document.body.removeEventListener('mouseout', handleMouseOut);
        document.body.removeEventListener('click', handleElementClick);

        // Remove permanent highlight
        if (permanentlyHighlightedElement) {
            removePermanentHighlight(permanentlyHighlightedElement);
        }

        // Disable phone mode if active
        const scaleToPhoneButton = document.getElementById('scale-to-phone');
        if (scaleToPhoneButton.dataset.phoneMode === 'true') {
            PhoneMode.disablePhoneMode();
        }

        PageScaler.reset();
    };

    // Check the session and enable the feedback mode
    const checkSessionAndEnable = () => {
        fetch(config.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'check_key_session',
                _wpnonce: config.nonce,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    enable(); 
                } else {
                    showAccessKeyForm();
                }
            })
            .catch((error) => console.error(error));
    };

    // Show the access key form
    const showAccessKeyForm = () => {
        const accessKeyForm = document.getElementById('access-key-form');
        const enableButton = document.getElementById('enable-feedback-mode');
        const accessKeyMessage = document.getElementById('access-key-message');
    
        // Show the form and hide the button
        enableButton.style.display = 'none';
        accessKeyForm.style.display = 'block';
    
        // Add event listener to handle form submission
        accessKeyForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
    
            const accessKeyInput = document.getElementById('access-key-input');
            const keyValue = accessKeyInput.value.trim();
    
            // Check if the access key field is empty
            if (!keyValue) {
                accessKeyMessage.textContent = 'Please enter an access key.';
                accessKeyMessage.style.display = 'block';
                return;
            }
    
            validateAccessKey(keyValue, accessKeyForm, enableButton);
        });
    };
    
    // Validate the access key
    const validateAccessKey = (key, form, button) => {
        const accessKeyMessage = document.getElementById('access-key-message');
    
        // Send the key to the server for validation
        fetch(config.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'validate_key',
                key: key,
                _wpnonce: config.nonce,
            }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                form.style.display = 'none'; 
                button.style.display = 'block'; 
                enable(); 
            } else {
                accessKeyMessage.textContent = data.data || 'Invalid access key.';
                accessKeyMessage.style.display = 'block';
            }
        })
        .catch((error) => {
            console.error(error);
            accessKeyMessage.textContent = 'An error occurred. Please try again.';
            accessKeyMessage.style.display = 'block';
        });
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

    // Handles the click on elements and adds a permanent highlight
    const handleElementClick = (event) => {
        const target = event.target.closest('.elementor-element');

        // If the target is null or there is already a permanently highlighted element, return
        if (!target || permanentlyHighlightedElement) return;
    
        // Check if the element has existing feedback items
        const elementorId = target.dataset.id;
        const existingFeedbackItems = document.querySelectorAll(`.feedback-item[data-elementor-id="${elementorId}"]`);
        const userFeedbackExists = Array.from(existingFeedbackItems).some(item => item.classList.contains('editable-feedback'));
    
        // If the user feedback exists, scroll to the last feedback item and show the feedback accordion
        if (existingFeedbackItems.length > 0) {
            existingFeedbackItems.forEach(item => {
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                item.querySelector('.feedback-item-body').style.display = 'block';
            });
            addPermanentHighlight(target);
    
            // If the user does not already has his own feedback show the add feedback accordion
            if (!userFeedbackExists) {
                FeedbackHandler.createFeedback(target, existingFeedbackItems[existingFeedbackItems.length - 1]);
            }
        } else {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
            event.preventDefault();
            event.stopPropagation();
    
            addPermanentHighlight(target);
    
            FeedbackHandler.createFeedback(target);
        }
    };

    // Adds a permanent highlight to the element
    const addPermanentHighlight = (target) => {
        // If the target is null or there is already a permanently highlighted element, return
        if (!target || permanentlyHighlightedElement) {
            removePermanentHighlight(permanentlyHighlightedElement);
        }
        
        // Add the permanent highlight
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
        });

        target.appendChild(closeButton);

        document.body.removeEventListener('mouseover', handleMouseOver);
    }

    // Open the feedback accordion
    const openFeedbackAccordion = (targetElement) => {
        const feedbackItemBodies = document.querySelectorAll(`.feedback-item[data-elementor-id="${targetElement}"] .feedback-item-body`);
        console.log(feedbackItemBodies);
        feedbackItemBodies.forEach(body => {
            body.style.display = 'block';
        });
    };

    // Clears all outlines
    const clearOutlines = () => {
        document.querySelectorAll('.outlined').forEach((el) => el.classList.remove('outlined'));
    };

    // Removes the permanent highlight
    const removePermanentHighlight = (element) => {
        // Remove the permanent highlight
        permanentlyHighlightedElement = null;
        element.classList.remove('permanent-highlight');
        const closeButton = element.querySelector('.close-button-in-element');
        if (closeButton) closeButton.remove();
    
        // Collapse the targeted accordion
        const feedbackItemBodies = document.querySelectorAll(`.feedback-item[data-elementor-id="${element.dataset.id}"] .feedback-item-body`);
        feedbackItemBodies.forEach(body => {
            body.style.display = 'none';
        });
    
        // Remove the AddFeedback accordion if it exists
        const addFeedbackItem = document.querySelector('.feedback-item.new-feedback');
        if (addFeedbackItem) {
            addFeedbackItem.remove();
        }
    };

    // Check if ondomlead setup the feedback accordion opening
    const setupFeedbackAccordion = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const targetElementIs = urlParams.get('targetElementIs');
    
        if (targetElementIs) {
            const targetElement = document.querySelector(`.elementor-element[data-id="${targetElementIs}"]`);
            if (targetElement) {
                await checkSessionAndEnable();
                setTimeout(() => {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    openFeedbackAccordion(targetElementIs);
                    addPermanentHighlight(targetElement);
                }, 1000);
            }
        }
    };

    return { init, checkSessionAndEnable, disable, enable, removePermanentHighlight, addPermanentHighlight };
})();

export default FeedbackMode;