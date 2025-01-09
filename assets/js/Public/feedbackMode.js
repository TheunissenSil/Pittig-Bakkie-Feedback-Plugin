import PageScaler from './pageScaler.js';
import PhoneMode from './phoneMode.js';
import FeedbackHandler from './feedbackHandler.js';

// Feedback mode module
const FeedbackMode = (() => {
    // Configuration
    let config;
    const init = (cfg) => {
        config = cfg;
        checkFromAdminPage();
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
        addEventListeners(doc);
    };

    const disable = () => {
        document.body.classList.remove('feedback-mode-active');

        // Remove event listeners for feedbackmode
        removeEventListeners();

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

    // remove event listeners
    const removeEventListeners = () => {
        document.body.removeEventListener('mouseover', handleMouseOver);
        document.body.removeEventListener('mouseout', handleMouseOut);
        document.body.removeEventListener('click', handleElementClick);
    };

    // add event listeners
    const addEventListeners = (doc = document) => {
        doc.body.addEventListener('mouseover', handleMouseOver);
        doc.body.addEventListener('mouseout', handleMouseOut);
        doc.body.addEventListener('click', handleElementClick);
    }

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
    
        // If no target is found, return early
        if (!target) {
            return;
        }
    
        event.stopPropagation();
        addPermanentHighlight(target);
    };

    // Adds a permanent highlight to the element
    const addPermanentHighlight = (target) => {
        // If the target is null or there is already a permanently highlighted element, return
        if (!target || permanentlyHighlightedElement) {
            removePermanentHighlight(permanentlyHighlightedElement);
        }

        // Remove the event listeners
        removeEventListeners();

        // Check if the element has existing feedback items
        const elementorId = target.dataset.id;
        const existingFeedbackItems = document.querySelectorAll(`.feedback-item[data-elementor-id="${elementorId}"]`);
        const userFeedbackExists = Array.from(existingFeedbackItems).some(item => item.classList.contains('editable-feedback'));
    
        // If the user feedback exists, scroll to the last feedback item and show the feedback accordion
        if (existingFeedbackItems.length > 0) {
            existingFeedbackItems.forEach(item => {
                item.querySelector('.feedback-item-body').style.display = 'block';
            });
    
            // If the user does not already has his own feedback show the add feedback accordion
            if (!userFeedbackExists) {
                FeedbackHandler.createFeedback(target, existingFeedbackItems[existingFeedbackItems.length - 1]);
            }
        } else {
            FeedbackHandler.createFeedback(target);
        }

        // Scroll the target into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
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
        });

        target.appendChild(closeButton);

        document.body.removeEventListener('mouseover', handleMouseOver);
    }

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
        
        addEventListeners();
    };

    // Clears all outlines
    const clearOutlines = () => {
        document.querySelectorAll('.outlined').forEach((el) => el.classList.remove('outlined'));
    };

    // Check if the user is coming from the admin page.
    const checkFromAdminPage = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const targetElementId = urlParams.get('targetElementIs');
    
        // If the targetElementId is present in the URL, enable the feedback mode
        if (targetElementId) {
            await checkSessionAndEnable();
            const targetElement = document.querySelector(`.elementor-element[data-id="${targetElementId}"]`);

            // If the target element is found, start observing for the items in the feedback sidebar
            if (targetElement) {
                const observer = new MutationObserver((mutations, obs) => {

                    // When feedabck items are loaded add the permanent highlight
                    const existingFeedbackItems = document.querySelectorAll(`.feedback-item[data-elementor-id="${targetElementId}"]`);
                    if (existingFeedbackItems.length > 0) {
                        obs.disconnect(); // Stop observing once feedback items are loaded
                        addPermanentHighlight(targetElement);
    
                        // Remove the variable from the URL
                        urlParams.delete('targetElementIs');
                        let newUrl = window.location.pathname;
                        if (urlParams.toString()) {
                            newUrl += `?${urlParams.toString()}`;
                        }
                        history.replaceState(null, '', newUrl);
                    }
                });
    
                // Start observing the document for child list changes
                observer.observe(document.body, { childList: true, subtree: true });
            }
        }
    };

    return { init, checkSessionAndEnable, disable, enable, removePermanentHighlight, addPermanentHighlight };
})();

export default FeedbackMode;