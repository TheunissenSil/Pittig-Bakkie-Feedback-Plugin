import FeedbackMode from './feedbackMode.js';
import FeedbackHandler from "./feedbackHandler.js";
import FeedbackSuggestionHandler from "./feedbackSuggestionHandler.js";

// Feedback renderer module
const feedbackRenderer = (() => {
    // Configuration 
    let config;
    const init = (cfg) => {
        config = cfg;
        fetchFeedback();
    };

    // Fetch feedback from the server
    const fetchFeedback = () => {
        const feedbackListContainer = document.getElementById('feedback-list');
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

    // Render feedback list
    const renderFeedbackList = async (feedbackItems) => {
        const feedbackListContainer = document.getElementById('feedback-list');
        const elementorElements = Array.from(document.querySelectorAll('.elementor-element'));
    
        // If no feedback items are available, display no feedback message
        if (!feedbackItems.length) {
            feedbackListContainer.innerHTML = '<p>No feedback available.</p>';
            return;
        } 
    
        // Sort feedback items based on the order of the elements on the page
        // Check if the feedback needs to be displayed on the current page
        const currentPage = window.location.pathname.replace(/\/$/, '');
        const elementPositions = {};
        elementorElements.forEach((el, index) => {
            elementPositions[el.dataset.id] = index;
        });
    
        // Filter feedback items for the current page so that they are displayed in the correct order
        feedbackItems = feedbackItems.filter(item => item.element_feedback_page === currentPage);
        feedbackItems.sort((a, b) => {
            const posA = elementPositions[a.elementor_id];
            const posB = elementPositions[b.elementor_id];
            return posA - posB;
        });
    
        // Render feedback items
        const listHtml = await Promise.all(feedbackItems.map(async (item) => {
            // Get the first 5 words of the feedback comment
            const feedbackTitle = item.feedback_comment.split(' ').slice(0, 5).join(' ') + '...';

            // Get the feedback suggestion 
            const suggestionHtml = await FeedbackSuggestionHandler.renderSuggestion(item.elementor_id, item.id);

            // Get the element type class
            const elementTypeClass = FeedbackSuggestionHandler.getElementType(document.querySelector(`[data-id="${item.elementor_id}"]`));

            // Add the add to page button if the user is an admin and the suggestion is not already added to the page
            const addToPageButton = config.isAdmin && !suggestionHtml.includes('<button class="show-suggestion"') && suggestionHtml !== '<p>Only the owner can add a suggestion.</p>' && (elementTypeClass === 'elementor-widget-text-editor' || elementTypeClass === 'elementor-widget-image') ? `
                <button class="add-to-page" data-suggestion-id="${item.id}">Add to page</button>
            ` : '';
            return `
                <div class="feedback-item ${item.username === config.sessionUsername ? 'editable-feedback' : ''}" data-id="${item.id}" data-elementor-id="${item.elementor_id}">
                    <div class="feedback-item-header">
                        ${feedbackTitle}
                        <div class="feedback-date">${new Date(item.created_at).toLocaleDateString()}</div>
                    </div>
                    <div class="feedback-item-body">
                        <h4>Opmerking:</h4>
                        <div class="feedback-body">
                            <span class="editable-feedback">${item.feedback_comment}</span>
                            ${item.username === config.sessionUsername ? `
                                <button class="edit-feedback" data-id="${item.id}"></button>
                            ` : ''}
                        </div>
                        <h4 class="suggestion-title">Verander content:</h4>
                        <div class="suggestion-wrapper">
                            ${suggestionHtml}
                            ${addToPageButton}
                        </div>
                        <p class="feedback-meta">
                            Username: ${item.username || 'Anonymous'}<br>
                            Display-size: ${item.display_size || 'Unknown'}<br>
                            Status: ${item.status}
                        </p>
                        ${item.admin_comment ? `
                            <div class="admin-comment">
                                ${item.admin_comment}
                            </div>
                        ` : ''}
                        ${item.username === config.sessionUsername ? `
                            <button class="delete-feedback" data-elementor-id="${item.elementor_id}" data-id="${item.id}"></button>
                        ` : ''}
                    </div>
                </div>
            `;
        }));
    
        feedbackListContainer.innerHTML = listHtml.join('');
    
        // Add event listeners for accordion functionality
        document.querySelectorAll('.feedback-item-header').forEach(header => {
            header.addEventListener('click', (e) => {
                // Check if the accordion is open
                const body = header.nextElementSibling;
                const isOpen = body.style.display === 'block';
    
                // Get the target element
                const elementorId = header.closest('.feedback-item').dataset.elementorId;
                const iframe = document.querySelector('#phone-size-iframe');
                const targetDocument = iframe ? iframe.contentDocument || iframe.contentWindow.document : document;
                const targetElement = targetDocument.querySelector(`.elementor-element[data-id="${elementorId}"]`);      
                
                // Return if their is no target element
                if (!targetElement) {
                    return;
                }
    
                if (!isOpen) {
                    // Open accordion and highlight the element
                    e.stopPropagation();
                    FeedbackMode.addPermanentHighlight(targetElement);
                } else {
                    // Close accordion and remove the highlight
                    e.stopPropagation();
                    FeedbackMode.removePermanentHighlight(targetElement);
                }
            });
        });
    
        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-feedback').forEach(button => {
            button.addEventListener('click', FeedbackHandler.handleEditFeedback);
        });
        document.querySelectorAll('.delete-feedback').forEach(button => {
            button.addEventListener('click', FeedbackHandler.handleDeleteFeedback);
        });
    
        // Add event listeners for show suggestion buttons
        addShowSuggestionEventListeners();
    
        // Add event listeners for edit suggestion buttons
        FeedbackSuggestionHandler.addSuggestionEventListeners();
    
        // Add event listeners for add to page buttons
        document.querySelectorAll('.add-to-page').forEach(button => {
            button.addEventListener('click', (e) => {
                const suggestionId = e.target.dataset.suggestionId;
                FeedbackSuggestionHandler.addToPage(suggestionId);
            });
        });
    };
    
    // Function to add event listeners for show suggestion buttons
    const addShowSuggestionEventListeners = () => {
        document.querySelectorAll('.show-suggestion').forEach(button => {
            button.addEventListener('click', (e) => {
                // Get the suggestion body
                const elementorId = e.target.dataset.elementorId;
                const feedbackId = e.target.dataset.feedbackId;
                const suggestionBody = e.target.closest('.feedback-item-body').querySelector('.suggestion-wrapper');
    
                // Save the original content
                const originalContent = suggestionBody.innerHTML; 
    
                // Render the suggestion input
                const suggestionsHtml = FeedbackSuggestionHandler.renderSuggestionInput(elementorId, true);
                suggestionBody.innerHTML = suggestionsHtml;
    
                // Create the cancel suggestion button
                const cancelSuggestionButton = document.createElement('button');
                cancelSuggestionButton.classList.add('cancel-suggestion');
                cancelSuggestionButton.textContent = 'Cancel';
    
                // Create the save suggestion button
                const saveSuggestionButton = document.createElement('button');
                saveSuggestionButton.classList.add('save-suggestion');
                saveSuggestionButton.textContent = 'Save';
    
                // Add the cancel and save suggestion buttons to the suggestion body
                suggestionBody.appendChild(cancelSuggestionButton);
                suggestionBody.appendChild(saveSuggestionButton);
    
                // Initialize TinyMCE if needed
                const element = document.querySelector(`.elementor-element[data-id="${elementorId}"]`);
                const elementTypeClass = FeedbackSuggestionHandler.getElementType(element);
    
                if (!elementTypeClass) {
                    console.error('Element type not found for ID:', elementId);
                    return { success: false, data: 'Element type not found' };
                }
    
                // Add event listener to cancel suggestion button to restore the original content
                cancelSuggestionButton.addEventListener('click', () => {
                    suggestionBody.innerHTML = originalContent;
                    e.target.style.display = 'block';
                    FeedbackSuggestionHandler.destroyTinyMCE(elementorId);
                    addShowSuggestionEventListeners(); // Reapply event listeners
                });
    
                // Add event listener to save suggestion button to save the suggestion
                saveSuggestionButton.addEventListener('click', () => {
                    FeedbackSuggestionHandler.saveSuggestion(elementorId, feedbackId)
                        .then(async response => {
                            if (response.success) {
                                FeedbackHandler.showFeedbackMessage('Suggestion saved successfully.');
                                const newSuggestionHtml = await FeedbackSuggestionHandler.renderSuggestion(elementorId, feedbackId);
                                suggestionBody.innerHTML = newSuggestionHtml;
                                FeedbackSuggestionHandler.addSuggestionEventListeners();
                                addShowSuggestionEventListeners(); // Reapply event listeners
                            } else {
                                FeedbackHandler.showFeedbackMessage('Failed to save suggestion.', true);
                            }
                        })
                        .catch(error => {
                            console.error('Error saving suggestion:', error);
                            FeedbackHandler.showFeedbackMessage('Failed to save suggestion.', true);
                        });
                });
    
                e.target.style.display = 'none';
            });
        });
    };

    return { init, fetchFeedback, addShowSuggestionEventListeners };
})();

export default feedbackRenderer;