import FeedbackMode from './feedbackMode.js';
import feedbackRenderer from './feedbackRenderer.js';
import FeedbackSuggestionHandler from './feedbackSuggestionHandler.js';

// Feedbackhandler Module
const FeedbackHandler = (() => {
    // Configuration 
    let config;
    const init = (cfg) => {
        config = cfg;
    };

    // Show feedback message for errors or success messages
    const showFeedbackMessage = (message, isError = false) => {
        // Display the message
        const feedbackMessage = document.getElementById('feedback-message');
        feedbackMessage.textContent = message;
        feedbackMessage.style.color = isError ? 'red' : 'green';
        feedbackMessage.style.display = 'block';
    
        // Hide the message after 5 seconds
        setTimeout(() => {
            feedbackMessage.style.display = 'none';
        }, 5000);
    };

    const createFeedback = (target, existingFeedbackItem = null) => {
        // Get the feedback list container
        const feedbackListContainer = document.getElementById('feedback-list');
        const elementorId = target.dataset.id;
    
        // Create a new feedback item
        const feedbackItem = document.createElement('div');
        feedbackItem.classList.add('feedback-item');
        feedbackItem.classList.add('new-feedback');
        feedbackItem.dataset.elementorId = elementorId;
    
        // Create the feedback item header 
        const feedbackItemHeader = document.createElement('div');
        feedbackItemHeader.classList.add('feedback-item-header');
        feedbackItemHeader.textContent = 'New Feedback';
    
        // Create the feedback item body
        const feedbackItemBody = document.createElement('div');
        feedbackItemBody.classList.add('feedback-item-body');
        feedbackItemBody.style.display = 'block';
    
        // Create the feedback form elements
        const feedbackTitle = document.createElement('h4');
        feedbackTitle.textContent = 'Verander content:';
    
        const feedbackTextarea = document.createElement('textarea');
        feedbackTextarea.classList.add('edit-feedback-textarea');
    
        // Create save and cancel buttons
        const saveButton = document.createElement('button');
        saveButton.classList.add('save-feedback');
        saveButton.textContent = 'Save';
    
        const cancelButton = document.createElement('button');
        cancelButton.classList.add('cancel-feedback');
        cancelButton.textContent = 'Cancel';
    
        // Set the display size based on the current mode
        const scaleToPhoneButton = document.getElementById('scale-to-phone');
        const displaySize = scaleToPhoneButton.dataset.phoneMode === 'true' ? 'Phone' : `${window.innerWidth}x${window.innerHeight}`;
        const feedbackMeta = document.createElement('p');
        feedbackMeta.classList.add('feedback-meta');
        feedbackMeta.innerHTML = `Display-size: ${displaySize}<br>Elementor ID: ${elementorId}`;

        // Create the suggestion header
        const suggestionHeader = document.createElement('h4');
        suggestionHeader.classList.add('suggestion-title');
        suggestionHeader.textContent = 'Verander content:';
    
        // Create the show suggestion button
        const showSuggestionButton = document.createElement('button');
        showSuggestionButton.classList.add('show-suggestion');
        showSuggestionButton.textContent = 'Verander content suggestie';
    
        // Insert the feedback form elements
        feedbackItemBody.appendChild(feedbackTitle);
        feedbackItemBody.appendChild(feedbackTextarea);

        
        feedbackItemBody.appendChild(suggestionHeader);
        feedbackItemBody.appendChild(showSuggestionButton);
        
        
        feedbackItemBody.appendChild(feedbackMeta);
        feedbackItemBody.appendChild(saveButton);
        feedbackItemBody.appendChild(cancelButton);
    
        feedbackItem.appendChild(feedbackItemHeader);
        feedbackItem.appendChild(feedbackItemBody);
    
        // Insert the new feedback item after the existing feedback item if it exists
        if (existingFeedbackItem) {
            existingFeedbackItem.after(feedbackItem);
        } else {
            // Insert the new feedback item in the correct order
            const elementorElements = Array.from(document.querySelectorAll('.elementor-element'));
            const elementPositions = {};
            elementorElements.forEach((el, index) => {
                elementPositions[el.dataset.id] = index;
            });
    
            // Sort feedback items based on the position of the corresponding elementor elements
            const feedbackItems = Array.from(feedbackListContainer.children);
            let inserted = false;
            for (let i = 0; i < feedbackItems.length; i++) {
                const item = feedbackItems[i];
                const itemElementorId = item.dataset.elementorId;
                if (elementPositions[elementorId] < elementPositions[itemElementorId]) {
                    feedbackListContainer.insertBefore(feedbackItem, item);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                feedbackListContainer.appendChild(feedbackItem);
            }
        }

        // Add event listener to show suggestion button
        showSuggestionButton.addEventListener('click', () => {
            const suggestionsHtml = FeedbackSuggestionHandler.renderSuggestionInput(elementorId, true);
            const suggestionBody = document.createElement('div');
            suggestionBody.classList.add('suggestion-body');
            suggestionBody.innerHTML = suggestionsHtml;

            // Create the cancel suggestion button
            const cancelSuggestionButton = document.createElement('button');
            cancelSuggestionButton.classList.add('cancel-suggestion');
            cancelSuggestionButton.textContent = 'Cancel Suggestion';

            // Add the cancel suggestion button to the suggestion body
            suggestionBody.appendChild(cancelSuggestionButton);

            // Add the suggestion body to the feedback item body
            feedbackItemBody.insertBefore(suggestionBody, feedbackMeta);
            showSuggestionButton.style.display = 'none';

            // Initialize TinyMCE if needed
            const elementTypeClass = FeedbackSuggestionHandler.getElementType(target);
            console.log(elementTypeClass);

            if (!elementTypeClass) {
                console.error('Element type not found for ID:', elementId);
                return { success: false, data: 'Element type not found' };
            }

            // Add event listener to cancel suggestion button to remove the suggestion body
            cancelSuggestionButton.addEventListener('click', () => {
                suggestionBody.remove();
                showSuggestionButton.style.display = 'block';
                FeedbackSuggestionHandler.destroyTinyMCE(elementorId);
            });
        });
    
        // Add event listeners for save and cancel buttons
        saveButton.addEventListener('click', () => {
            // Check if the comment is empty
            const feedbackComment = feedbackTextarea.value.trim();
            if (!feedbackComment) {
                showFeedbackMessage('Please enter your feedback.', true);
                return;
            }
        
            // Get the display size
            let currentPage = window.location.pathname;
            currentPage = currentPage.replace(/\/$/, ''); // Remove trailing slash if it exists
        
            // Save the feedback
            fetch(config.ajaxUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'save_feedback',
                    elementor_id: elementorId,
                    element_feedback_page: currentPage,
                    feedback_comment: feedbackComment,
                    display_size: displaySize,
                    _wpnonce: config.nonce,
                }),
            })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    const feedbackId = data.data.feedback_id;
                    showFeedbackMessage('Feedback saved successfully.');
        
                    // Check if suggestions are filled in
                    const suggestionBody = feedbackItemBody.querySelector('.suggestion-body');
                    if (suggestionBody) {
                        FeedbackSuggestionHandler.saveSuggestion(elementorId, feedbackId)
                    }
        
                    feedbackItem.remove();
                    FeedbackMode.removePermanentHighlight(target);
                    feedbackRenderer.fetchFeedback();
                } else {
                    showFeedbackMessage(data.data || 'Failed to save feedback.', true);
                }
            })
            .catch((error) => {
                console.error('Error saving feedback:', error);
                showFeedbackMessage('Failed to save feedback.', true);
            });
        });
    
        // Handle cancel action
        cancelButton.addEventListener('click', () => {
            FeedbackMode.removePermanentHighlight(target);
            feedbackItem.remove();
        });
    };
    
    // Handle edit feedback
    const handleEditFeedback = (event) => {
        const feedbackId = event.target.dataset.id;
        const feedbackItem = document.querySelector(`.feedback-item[data-id="${feedbackId}"]`);
        const feedbackComment = feedbackItem.querySelector('.editable-feedback');
        const originalComment = feedbackComment.textContent;
        const editButton = feedbackItem.querySelector('.edit-feedback');
    
        // Hide the edit button
        editButton.style.display = 'none';
    
        // Create a textarea for editing
        const textarea = document.createElement('textarea');
        textarea.value = originalComment;
        textarea.classList.add('edit-feedback-textarea');
        textarea.style.minHeight = `${feedbackComment.offsetHeight + 40}px`;
    
        // Adjust the height of the textarea to fit its content
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight + 20}px`;
    
        // Replace the comment with the textarea
        feedbackComment.replaceWith(textarea);
    
        // Create save and cancel buttons
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.classList.add('save-feedback');
    
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.classList.add('cancel-feedback');
    
        textarea.after(saveButton, cancelButton);
    
        // Adjust the height of the textarea on input
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight + 20}px`;
        });
    
        // Handle save action
        saveButton.addEventListener('click', () => {
            const newComment = textarea.value;
    
            fetch(config.ajaxUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'edit_feedback',
                    id: feedbackId,
                    feedback_comment: newComment,
                    _wpnonce: config.nonce,
                }),
            })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    feedbackComment.textContent = newComment;
                    textarea.replaceWith(feedbackComment);
                    saveButton.remove();
                    cancelButton.remove();
                    editButton.style.display = 'block';
                    showFeedbackMessage('Feedback updated successfully.');
                } else {
                    showFeedbackMessage(data.data || 'Failed to update feedback.', true);
                }
            })
            .catch((error) => {
                console.error('Error updating feedback:', error);
                showFeedbackMessage('Failed to update feedback.', true);
            });
        });
    
        // Handle cancel action
        cancelButton.addEventListener('click', () => {
            textarea.replaceWith(feedbackComment);
            saveButton.remove();
            cancelButton.remove();
            editButton.style.display = 'block';
        });
    };
    
    // Handle delete feedback
    const handleDeleteFeedback = (event) => {
        const feedbackId = event.target.dataset.id;
    
        // Confirm before deleting
        if (!confirm('Are you sure you want to delete this feedback?')) {
            return;
        }
    
        // Delete the feedback
        fetch(config.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'delete_feedback',
                id: feedbackId,
                _wpnonce: config.nonce,
            }),
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                const feedbackItem = document.querySelector(`.feedback-item[data-id="${feedbackId}"]`);
                feedbackItem.remove();
                showFeedbackMessage('Feedback deleted successfully.');

                // Remove the permanent highlight
                const elementorId = event.srcElement.dataset.elementorId;
                const target = document.querySelector(`.elementor-element[data-id="${elementorId}"]`);
                FeedbackMode.removePermanentHighlight(target);
            } else {
                showFeedbackMessage(data.data || 'Failed to delete feedback.', true);
            }
        })
        .catch((error) => {
            console.error('Error deleting feedback:', error);
            showFeedbackMessage('Failed to delete feedback.', true);
        });
    };
            
    return { init, createFeedback, handleEditFeedback, handleDeleteFeedback, showFeedbackMessage };
})();

export default FeedbackHandler;