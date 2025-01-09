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
    const renderFeedbackList = (feedbackItems) => {
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

        feedbackItems = feedbackItems.filter(item => item.element_feedback_page === currentPage);

        feedbackItems.sort((a, b) => {
            const posA = elementPositions[a.elementor_id];
            const posB = elementPositions[b.elementor_id];
            return posA - posB;
        });

        // Render feedback items
        const listHtml = feedbackItems.map((item) => {
            const feedbackTitle = item.feedback_comment.split(' ').slice(0, 5).join(' ') + '...';
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
                        ${FeedbackSuggestionHandler.renderSuggestions()}
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
                            <button class="delete-feedback" data-id="${item.id}"></button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');  

        feedbackListContainer.innerHTML = listHtml;

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
    };

    return { init, fetchFeedback };
})();

export default feedbackRenderer;