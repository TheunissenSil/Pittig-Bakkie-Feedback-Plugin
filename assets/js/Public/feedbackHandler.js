import FeedbackMode from './feedbackMode.js';

// Feedbackhandler Module
const FeedbackHandler = (() => {
    let config;

    const init = (cfg) => {
        config = cfg;
        fetchFeedback();
    };

    const fetchFeedback = () => {
        fetch(config.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'get_feedback',
                _wpnonce: config.nonce, 
            })
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                renderFeedbackList(data.data);
            } else {
                feedbackListContainer.innerHTML =
                    '<p>' + (data.data || 'No feedback available.') + '</p>';
            }
        })
        .catch((error) => {
            console.error('Error fetching feedback:', error);
            feedbackListContainer.innerHTML =
                '<p>Error loading feedback.</p>';
        });
    };

    const renderFeedbackList = (feedbackItems) => {
        const feedbackListContainer = document.getElementById('feedback-list');
        const elementorElements = Array.from(document.querySelectorAll('.elementor-element'));

        if (!feedbackItems.length) {
            feedbackListContainer.innerHTML = '<p>No feedback available.</p>';
            return;
        }

        const elementPositions = {};
        elementorElements.forEach((el, index) => {
            elementPositions[el.dataset.id] = index;
        });

        feedbackItems.sort((a, b) => {
            const posA = elementPositions[a.elementor_id];
            const posB = elementPositions[b.elementor_id];
            return posA - posB;
        });

        const listHtml = feedbackItems.map((item) => `
            <div class="feedback-item ${item.username === config.sessionUsername ? 'editable-feedback' : ''}" data-id="${item.id}" data-elementor-id="${item.elementor_id}">
                <div class="feedback-item-header">
                    ${item.username || 'Anonymous'}
                    <div class="feedback-date">${new Date(item.created_at).toLocaleDateString()}</div>
                </div>
                <div class="feedback-item-body">
                    <p>
                        <span class="editable-feedback">${item.feedback_comment}</span>
                        ${item.username === config.sessionUsername ? `
                            <button class="edit-feedback" data-id="${item.id}"></button>
                        ` : ''}
                    </p>
                    <p class="feedback-meta">
                        Display-size: ${item.display_size || 'Unknown'}<br>
                        Status: ${item.status}
                    </p>
                    ${item.admin_comment ? `
                        <div class="admin-comment">
                            ${item.admin_comment}
                        </div>
                    ` : ''}
                    ${item.username === config.sessionUsername ? `
                        <button class="delete-feedback" data-id="${item.id}">Delete</button>
                    ` : ''}
                </div>
            </div>
        `).join('');    

        feedbackListContainer.innerHTML = listHtml;

        // Add event listeners for accordion functionality
        document.querySelectorAll('.feedback-item-header').forEach(header => {
            header.addEventListener('click', () => {
                // Remove the new feedback item if it exists
                const addFeedbackItem = document.querySelector('.feedback-item.new-feedback');
                if (addFeedbackItem) {
                    addFeedbackItem.remove();
                }
    
                // Toggle the accordion
                const body = header.nextElementSibling;
                const isOpen = body.style.display === 'block';
    
                // Close any open accordion
                document.querySelectorAll('.feedback-item-body').forEach(body => {
                    if (body.style.display === 'block') {
                        body.style.display = 'none';

                        // Remove the permanent highlight
                        const elementorId = body.closest('.feedback-item').dataset.elementorId;
                        const targetElement = document.querySelector(`.elementor-element[data-id="${elementorId}"]`);
                        if (targetElement) {
                            FeedbackMode.removePermanentHighlight(targetElement);
                        }
                    }
                });
    
                // Open the clicked accordion
                if (!isOpen) {
                    // Scroll to the elementor element and highlight it
                    const elementorId = header.closest('.feedback-item').dataset.elementorId;
                    const targetElement = document.querySelector(`.elementor-element[data-id="${elementorId}"]`);
                    if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        FeedbackMode.addPermanentHighlight(targetElement);
                    }
                    const body = header.nextElementSibling;
                    body.style.display = 'block';
                }
            });
        });
    
        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-feedback').forEach(button => {
            button.addEventListener('click', handleEditFeedback);
        });
        document.querySelectorAll('.delete-feedback').forEach(button => {
            button.addEventListener('click', handleDeleteFeedback);
        });
    };
    
    const showFeedbackMessage = (message, isError = false) => {
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
        // Create a new feedback item
        const feedbackListContainer = document.getElementById('feedback-list');
        const elementorId = target.dataset.id;
    
        const feedbackItem = document.createElement('div');
        feedbackItem.classList.add('feedback-item');
        feedbackItem.classList.add('new-feedback');
        feedbackItem.dataset.elementorId = elementorId;
    
        const feedbackItemHeader = document.createElement('div');
        feedbackItemHeader.classList.add('feedback-item-header');
        feedbackItemHeader.textContent = 'New Feedback';
    
        const feedbackItemBody = document.createElement('div');
        feedbackItemBody.classList.add('feedback-item-body');
        feedbackItemBody.style.display = 'block';
    
        const feedbackTitle = document.createElement('p');
        feedbackTitle.textContent = 'Feedback comment:';
    
        const feedbackTextarea = document.createElement('textarea');
        feedbackTextarea.classList.add('edit-feedback-textarea');
    
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
    
        feedbackItemBody.appendChild(feedbackTitle);
        feedbackItemBody.appendChild(feedbackTextarea);
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
    
        // Add event listeners for save and cancel buttons
        saveButton.addEventListener('click', () => {
            // Check if the comment is empty
            const feedbackComment = feedbackTextarea.value.trim();
            if (!feedbackComment) {
                showFeedbackMessage('Please enter your feedback.', true);
                return;
            }

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
                    showFeedbackMessage('Feedback saved successfully.');
                    feedbackItem.remove();
                    FeedbackMode.removePermanentHighlight(target);
                    FeedbackMode.enable();
                    FeedbackHandler.fetchFeedback();
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
            feedbackItem.remove();
            FeedbackMode.removePermanentHighlight(target);
            FeedbackMode.enable(); 
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
        textarea.style.minHeight = `${feedbackComment.offsetHeight + 20}px`;
    
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
            } else {
                showFeedbackMessage(data.data || 'Failed to delete feedback.', true);
            }
        })
        .catch((error) => {
            console.error('Error deleting feedback:', error);
            showFeedbackMessage('Failed to delete feedback.', true);
        });
    };
            
    return { init, fetchFeedback, createFeedback};
})();

export default FeedbackHandler;