document.addEventListener('DOMContentLoaded', function () {
    // Constants
    const SIDEBAR_WIDTH = 300;
    const ajaxUrl = pittigBakkieFeedbackPlugin.ajaxUrl;
    const nonce = pittigBakkieFeedbackPlugin.nonce;

    // FeedbackMode Module
    const FeedbackMode = (() => {
        let permanentlyHighlightedElement = null;

        const enable = (doc = document) => {
            document.body.classList.add('feedback-mode-active');

            // Scale the page if is not phone mode
            const scaleToPhoneButton = document.getElementById('scale-to-phone');
            if (scaleToPhoneButton.dataset.phoneMode !== 'true') {
                PageScaler.scale();
            }

            doc.body.addEventListener('mouseover', handleMouseOver);
            doc.body.addEventListener('mouseout', handleMouseOut);
            doc.body.addEventListener('click', handleElementClick);

            FeedbackHandler.fetchFeedback();
        };

        const disable = () => {
            document.body.classList.remove('feedback-mode-active');
            document.body.removeEventListener('mouseover', handleMouseOver);
            document.body.removeEventListener('mouseout', handleMouseOut);
            document.body.removeEventListener('click', handleElementClick);

            if (permanentlyHighlightedElement) {
                removePermanentHighlight(permanentlyHighlightedElement);
                permanentlyHighlightedElement = null;
            }

            // Disable phone mode if active
            const scaleToPhoneButton = document.getElementById('scale-to-phone');
            if (scaleToPhoneButton.dataset.phoneMode === 'true') {
                PhoneMode.disablePhoneMode();
            }

            PageScaler.reset();
        };

        const checkSessionAndEnable = () => {
            fetch(ajaxUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'check_key_session',
                    _wpnonce: nonce,
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

        const showAccessKeyForm = () => {
            const accessKeyForm = document.getElementById('access-key-form');
            const enableButton = document.getElementById('enable-feedback-mode');
            const accessKeyMessage = document.getElementById('access-key-message');
        
            // Show the form and hide the button
            enableButton.style.display = 'none';
            accessKeyForm.style.display = 'block';
        
            // Add event listener to handle form submission
            accessKeyForm.addEventListener('submit', (e) => {
                e.preventDefault(); // Prevent default form submission
        
                const accessKeyInput = document.getElementById('access-key-input');
                const keyValue = accessKeyInput.value.trim();
        
                if (!keyValue) {
                    accessKeyMessage.textContent = 'Please enter an access key.';
                    accessKeyMessage.style.display = 'block';
                    return;
                }
        
                validateAccessKey(keyValue, accessKeyForm, enableButton);
            });
        };
        
        const validateAccessKey = (key, form, button) => {
            const accessKeyMessage = document.getElementById('access-key-message');
        
            fetch(ajaxUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'validate_key',
                    key: key,
                    _wpnonce: nonce,
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

        return { checkSessionAndEnable, disable, enable };
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

    // PhoneMode Module
    const PhoneMode = (() => {
        const enablePhoneMode = () => {
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

    // FeedbackFetcher Module
    const FeedbackHandler = (() => {
        const feedbackListContainer = document.getElementById('feedback-list');

        // Fetch feedback from the server
        const fetchFeedback = () => {
            fetch(ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'get_feedback',
                    _wpnonce: nonce, 
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

        // Render feedback items in the list
        const renderFeedbackList = (feedbackItems) => {
            const feedbackListContainer = document.getElementById('feedback-list');
        
            if (!feedbackItems.length) {
                feedbackListContainer.innerHTML = '<p>No feedback available.</p>';
                return;
            }
        
            const listHtml = feedbackItems.map((item) => `
                <div class="feedback-item" data-id="${item.id}">
                    <div class="feedback-item-header">
                        ${item.username || 'Anonymous'}
                        <div class="feedback-date">${new Date(item.created_at).toLocaleDateString()}</div>
                    </div>
                    <div class="feedback-item-body">
                        <p>
                            <span class="editable-feedback">${item.feedback_comment}</span>
                            ${item.username === pittigBakkieFeedbackPlugin.sessionUsername ? `
                                <button class="edit-feedback" data-id="${item.id}"></button>
                            ` : ''}
                        </p>
                        <p class="feedback-meta">
                            Display-size: ${item.display_size || 'Unknown'}<br>
                            Status: ${item.status}
                        </p>
                        ${item.admin_comment ? `<div class="admin-comment">${item.admin_comment}</div>` : ''}
                        ${item.username === pittigBakkieFeedbackPlugin.sessionUsername ? `
                            <button class="delete-feedback" data-id="${item.id}">Delete</button>
                        ` : ''}
                    </div>
                </div>
            `).join('');    
        
            feedbackListContainer.innerHTML = listHtml;

            // Add event listeners for accordion functionality
            document.querySelectorAll('.feedback-item-header').forEach(header => {
                header.addEventListener('click', () => {
                    const body = header.nextElementSibling;
                    body.style.display = body.style.display === 'block' ? 'none' : 'block';
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
        
                fetch(ajaxUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        action: 'edit_feedback',
                        id: feedbackId,
                        feedback_comment: newComment,
                        _wpnonce: nonce,
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
        
            if (!confirm('Are you sure you want to delete this feedback?')) {
                return;
            }
        
            fetch(ajaxUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'delete_feedback',
                    id: feedbackId,
                    _wpnonce: nonce,
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
                
        return {fetchFeedback};
    })();

    // Button Event Listeners 
    document.getElementById("enable-feedback-mode").addEventListener("click", FeedbackMode.checkSessionAndEnable);  
    document.getElementById("disable-feedback-mode").addEventListener("click", FeedbackMode.disable);
    document.getElementById('scale-to-phone').addEventListener('click', () => {
        PhoneMode.toggle();
    });
});