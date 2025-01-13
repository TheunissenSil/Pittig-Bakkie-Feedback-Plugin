import FeedbackHandler from "./feedbackHandler.js";
import feedbackRenderer from "./feedbackRenderer.js";

const FeedbackSuggestionHandler = (() => {
    // Configuration
    let config;
    const init = (cfg) => {
        config = cfg;
    };

    // render the suggestion
    const renderSuggestion = (elementId, feedbackId) => {
        return fetchfeedbackSuggestions(feedbackId)
            .then((data) => {
                if (data.success && data.data.length > 0) {
                    // Fetch feedback to check the username
                    return fetchFeedbackById(feedbackId)
                        .then(feedbackData => {
                            if (feedbackData.success) {
                                const isOwner = feedbackData.data.username === config.sessionUsername;
                                // Render existing suggestions
                                return data.data.map(suggestion => {
                                    const editIcon = isOwner ? `
                                        <button class="edit-suggestion" data-elementor-id="${elementId}" data-feedback-id="${feedbackId}" data-suggestion-id="${suggestion.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                    ` : '';
                                    const deleteIcon = isOwner ? `
                                        <button class="delete-suggestion" data-elementor-id="${elementId}" data-feedback-id="${feedbackId}" data-suggestion-id="${suggestion.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    ` : '';
                                    if (suggestion.element_type === 'elementor-widget-image') {
                                        return `
                                            <div class="suggestion-body">
                                                ${editIcon}
                                                ${deleteIcon}
                                                <img src="${suggestion.suggestion_value}" alt="Suggested Image" />
                                            </div>
                                        `;
                                    } else {
                                        return `
                                            <div class="suggestion-body">
                                                ${editIcon}
                                                ${deleteIcon}
                                                ${suggestion.suggestion_value}
                                            </div>
                                        `;
                                    }
                                }).join('');
                            } else {
                                return '<p>Error loading feedback data.</p>';
                            }
                        });
                } else {
                    // Fetch feedback to check the username
                    return fetchFeedbackById(feedbackId)
                        .then(feedbackData => {
                            if (feedbackData.success) {
                                const isOwner = feedbackData.data.username === config.sessionUsername;
                                if (isOwner) {
                                    // Render the button to add a new suggestion
                                    return `
                                        <button class="show-suggestion" data-elementor-id="${elementId}" data-feedback-id="${feedbackId}">Verander content suggestie</button>
                                    `;
                                } else {
                                    return '<p>Only the owner can add a suggestion.</p>';
                                }
                            } else {
                                return '<p>Error loading feedback data.</p>';
                            }
                        });
                }
            })
            .catch((error) => {
                console.error('Error fetching suggestions:', error);
                return '<p>Error loading suggestions.</p>';
            });
    };
    
    // Fetch feedback by ID to check the username
    const fetchFeedbackById = (feedbackId) => {
        return fetch(config.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'get_feedback_by_id',
                feedback_id: feedbackId,
                _wpnonce: config.nonce,
            })
        })
        .then((response) => response.json());
    };

    // render the suggestion input fields
    const renderSuggestionInput = (elementId, isNew = false, existingSuggestion = null) => {
        let suggestionContent = '';

        // Check what the data-element_type of the element is
        const element = document.querySelector(`[data-id="${elementId}"]`);
        const elementTypeClass = getElementType(element);
        
        switch (elementTypeClass) {
            case 'elementor-widget-text-editor':
                suggestionContent = `
                    <textarea name="suggestion_value" id="suggestion-text-editor-${elementId}" class="suggestion-text-editor"></textarea>
                `;
                break;
            case 'elementor-widget-image':
                suggestionContent = `
                    <input name="suggestion_value" type="file" id="suggestion-image-upload-${elementId}" class="suggestion-image-upload" accept="image/*" />
                    <img id="suggestion-image-preview-${elementId}" class="suggestion-image-preview" style="display: none; max-width: 100%;" />
                `;
                break;
            default:
                suggestionContent = `
                    <textarea name="suggestion_value" id="suggestion-default-${elementId}" class="suggestion-default" style="height: 100px;"></textarea>
                `;
                break;
        }
    
        // Fill in the suggestion content from site if the item is new 
        if (isNew) {
            setTimeout(() => {
                fillSuggestionContent(elementId, elementTypeClass);
            }, 0);
        } else if (existingSuggestion) {
            // Fill in the suggestion content from existing suggestion
            setTimeout(() => {
                fillExistingSuggestionContent(elementId, elementTypeClass, existingSuggestion);
            }, 0);
        }
    
        // Add event listener to update image preview when a new image is selected
        if (elementTypeClass === 'elementor-widget-image') {
            setTimeout(() => {
                const inputFile = document.getElementById(`suggestion-image-upload-${elementId}`);
                const imgPreview = document.getElementById(`suggestion-image-preview-${elementId}`);
                if (inputFile && imgPreview) {
                    inputFile.addEventListener('change', (event) => {
                        const file = event.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                imgPreview.src = e.target.result;
                                imgPreview.style.display = 'block';
                            };
                            reader.readAsDataURL(file);
                        }
                    });
                }
            }, 0);
        }
    
        return suggestionContent;
    };
    
    // Fill in the suggestion content from existing suggestion
    const fillExistingSuggestionContent = (elementId, elementTypeClass, existingSuggestion) => {
        switch (elementTypeClass) {
            case 'elementor-widget-text-editor':
                const textarea = document.getElementById(`suggestion-text-editor-${elementId}`);
                if (textarea) {
                    textarea.value = existingSuggestion;
                    initializeTinyMCE(elementId);
                } else {
                    console.error(`Textarea with ID suggestion-text-editor-${elementId} not found.`);
                }
                break;
            case 'elementor-widget-image':
                const inputFile = document.getElementById(`suggestion-image-upload-${elementId}`);
                const imgPreview = document.getElementById(`suggestion-image-preview-${elementId}`);
                if (inputFile && imgPreview) {
                    imgPreview.src = existingSuggestion;
                    imgPreview.style.display = 'block';
                    inputFile.dataset.url = existingSuggestion; // Store the URL in a data attribute
                } else {
                    console.error(`Input file or preview image not found for ID ${elementId}.`);
                }
                break;
            default:
                const inputDefault = document.getElementById(`suggestion-default-${elementId}`);
                if (inputDefault) {
                    inputDefault.value = existingSuggestion;
                } else {
                    console.error(`Input field with ID suggestion-default-${elementId} not found.`);
                }
                break;
        }
    };
    
    // Fill in the suggestion content from site
    const fillSuggestionContent = (elementId, elementTypeClass) => {
        const element = document.querySelector(`[data-id="${elementId}"] .elementor-widget-container`);
        if (!element) {
            // If the element is not found, return
            console.error(`Element with ID ${elementId} not found.`);
            return;
        }
    
        let content = '';
    
        switch (elementTypeClass) {
            case 'elementor-widget-text-editor':
                content = element.innerHTML;
                const textarea = document.getElementById(`suggestion-text-editor-${elementId}`);
                if (textarea) {
                    textarea.value = content;
                    initializeTinyMCE(elementId);
                } else {
                    console.error(`Textarea with ID suggestion-text-editor-${elementId} not found.`);
                }
                break;
            case 'elementor-widget-image':
                const img = element.querySelector('img');
                if (img) {
                    content = img.src;
                    const inputFile = document.getElementById(`suggestion-image-upload-${elementId}`);
                    if (inputFile) {
                        inputFile.dataset.url = content; // Store the URL in a data attribute
                    } else {
                        console.error(`Input file or preview image not found for ID ${elementId}.`);
                    }
                } else {
                    console.error(`Image not found in element with ID ${elementId}.`);
                }
                break;
            default:
                content = element.innerText || element.textContent;
                const inputDefault = document.getElementById(`suggestion-default-${elementId}`);
                if (inputDefault) {
                    inputDefault.value = content;
                } else {
                    console.error(`Input field with ID suggestion-default-${elementId} not found.`);
                }
                break;
        }
    };

    // Initialize TinyMCE editor
    const initializeTinyMCE = (elementId) => {
        tinymce.init({
            selector: `#suggestion-text-editor-${elementId}`,
            license_key: 'gpl',
            menubar: false,
            plugins: 'lists',
            toolbar: 'bold italic underline strikethrough | bullist num list',	
            height: 200,
            branding: false,
            statusbar: false,
        });
    };

    // Destroy TinyMCE editor
    const destroyTinyMCE = (elementId) => {
        const editor = tinymce.get(`suggestion-text-editor-${elementId}`);
        if (editor) {
            editor.remove();
        }
    };

    // Get the element type class
    const getElementType = (element) => {
        let elementTypeClass = "undefined";
        if (element.dataset.element_type === "widget") {
            // Find the class of the widget that starts with elementor-widget- and then save the whole class name
            const widgetClass = Array.from(element.classList).find(cls => cls.startsWith('elementor-widget-'));
            if (widgetClass) {
                elementTypeClass = widgetClass;
            }
        } else {
            elementTypeClass = element.dataset.element_type;
        }

        return elementTypeClass;
    }

    // Fetch feedback suggestions
    const fetchfeedbackSuggestions = (feedbackId) => {
        return fetch(config.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'get_feedback_suggestion',
                feedback_id: feedbackId,
                _wpnonce: config.nonce,
            })
        })
        .then((response) => response.json());
    };

    // Add event listeners for edit and delete suggestion buttons
    const addSuggestionEventListeners = () => {
        document.querySelectorAll('.edit-suggestion').forEach(button => {
            // Remove existing event listeners
            button.removeEventListener('click', handleEditSuggestionClick);
            // Add new event listener
            button.addEventListener('click', handleEditSuggestionClick);
        });
    
        document.querySelectorAll('.delete-suggestion').forEach(button => {
            // Remove existing event listeners
            button.removeEventListener('click', handleDeleteSuggestionClick);
            // Add new event listener
            button.addEventListener('click', handleDeleteSuggestionClick);
        });
    };
    
    // Handle edit suggestion button click
    const handleEditSuggestionClick = (e) => {
        // Get the elementor ID, feedback ID, and suggestion ID
        const elementorId = e.target.dataset.elementorId;
        const feedbackId = e.target.dataset.feedbackId;
        const suggestionId = e.target.dataset.suggestionId;
        const suggestionBody = e.target.closest('.suggestion-body');
    
        const originalContent = suggestionBody.innerHTML;
    
        // Fetch the existing suggestion content
        fetchfeedbackSuggestions(feedbackId)
            .then((data) => {
                if (data.success && data.data.length > 0) {
                    // Find the existing suggestion
                    const existingSuggestion = data.data.find(suggestion => suggestion.id === suggestionId);
                    if (existingSuggestion) {
                        // Render the suggestion input fields
                        const suggestionsHtml = renderSuggestionInput(elementorId, false, existingSuggestion.suggestion_value);
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
                        const elementTypeClass = getElementType(element);
    
                        // Add event listeners for cancel and save buttons
                        cancelSuggestionButton.addEventListener('click', () => {
                            suggestionBody.innerHTML = originalContent;
                            addSuggestionEventListeners(); // Reapply event listeners
                        });
    
                        saveSuggestionButton.addEventListener('click', () => {
                            editSuggestion(elementorId, feedbackId, suggestionId, suggestionBody, originalContent);
                        });
                    }
                }
            });
    };

    // Handle delete suggestion button click
    const handleDeleteSuggestionClick = (e) => {

        // Get the suggestion ID, suggestion body, and suggestion wrapper
        const suggestionId = e.target.dataset.suggestionId;
        const suggestionBody = e.target.closest('.suggestion-body');
        const suggestionWrapper = suggestionBody.closest('.suggestion-wrapper');
        const elementorId = e.target.dataset.elementorId;
        const feedbackId = e.target.dataset.feedbackId;
    
        // Confirm deletion
        if (confirm('Are you sure you want to delete this suggestion?')) {
            deleteSuggestion(suggestionId, feedbackId)
                .then(async (result) => {
                    if (result.success) {
                        FeedbackHandler.showFeedbackMessage('Suggestion deleted successfully.');

                        // Fetch and render the updated suggestions
                        suggestionBody.remove();
                        const suggestionHtml = await renderSuggestion(elementorId, feedbackId);
                        suggestionWrapper.innerHTML = suggestionHtml;

                        // Reapply event listeners
                        feedbackRenderer.addShowSuggestionEventListeners(); 
                    } else {
                        FeedbackHandler.showFeedbackMessage('Failed to delete suggestion.', true);
                    }
                })
                .catch((error) => {
                    console.error('Error deleting suggestion:', error);
                    FeedbackHandler.showFeedbackMessage('Failed to delete suggestion.', true);
                });
        }
    };

    // Edit the suggestion
    const editSuggestion = async (elementId, feedbackId, suggestionId, suggestionBody, originalContent) => {
        let suggestionValue = await getSuggestionValue(elementId);
    
        // Fetch feedback to check the username
        const feedbackData = await fetchFeedbackById(feedbackId);
        if (!feedbackData.success) {
            console.error('Error fetching feedback data:', feedbackData.data);
            return { success: false, data: 'Error fetching feedback data' };
        }
    
        const data = new FormData();
        data.append('action', 'edit_feedback_suggestion');
        data.append('suggestion_id', suggestionId);
        data.append('suggestion_value', suggestionValue);
        data.append('username', feedbackData.data.username);
        data.append('_wpnonce', config.nonce);
    
        try {
            const response = await fetch(config.ajaxUrl, {
                method: 'POST',
                body: data
            });
            const result = await response.json();
    
            if (result.success) {
                FeedbackHandler.showFeedbackMessage('Suggestion updated successfully.');
                // Fetch and render the updated suggestions
                const updatedSuggestionsHtml = await renderSuggestion(elementId, feedbackId);
                const suggestionWrapper = suggestionBody.closest('.suggestion-wrapper');
                if (suggestionWrapper) {
                    suggestionWrapper.innerHTML = updatedSuggestionsHtml;
                    addSuggestionEventListeners(); 
                }
            } else {
                FeedbackHandler.showFeedbackMessage('Failed to update suggestion.', true);
                suggestionBody.innerHTML = originalContent;
                addSuggestionEventListeners();
            }
        } catch (error) {
            console.error('Error updating suggestion:', error);
            FeedbackHandler.showFeedbackMessage('Failed to update suggestion.', true);
            suggestionBody.innerHTML = originalContent;
            addSuggestionEventListeners();
        }
    };

    const deleteSuggestion = async (suggestionId, feedbackId) => {
        // Fetch feedback to check the username
        const feedbackData = await fetchFeedbackById(feedbackId);
        if (!feedbackData.success) {
            console.error('Error fetching feedback data:', feedbackData.data);
            return { success: false, data: 'Error fetching feedback data' };
        }
    
        // Fetch request to delete the suggestion
        const data = new FormData();
        data.append('action', 'delete_feedback_suggestion');
        data.append('suggestion_id', suggestionId);
        data.append('username', feedbackData.data.username);
        data.append('_wpnonce', config.nonce);
    
        return fetch(config.ajaxUrl, {
            method: 'POST',
            body: data
        })
        .then(response => response.json());
    };

    // save the suggestion
    const saveSuggestion = async (elementId, feedbackId) => {
        let suggestionValue = await getSuggestionValue(elementId);

        // Get element type class
        const element = document.querySelector(`[data-id="${elementId}"]`);
        if (!element) {
            console.error(`Element with ID ${elementId} not found.`);
            return { success: false, data: 'Element not found' };
        }
        const elementTypeClass = getElementType(element);
    
        // Fetch feedback to check the username
        const feedbackData = await fetchFeedbackById(feedbackId);
        if (!feedbackData.success) {
            console.error('Error fetching feedback data:', feedbackData.data);
            return { success: false, data: 'Error fetching feedback data' };
        }

        // Get elementor post or page ID
        const bodyClassList = document.body.classList;
        let elementorPostId = null;

        bodyClassList.forEach(className => {
            if (className.startsWith('elementor-page-') || className.startsWith('elementor-post-')) {
                elementorPostId = className.split('-').pop();
            }
        });

        //const elementorPostId = document.querySelector('.elementor-editor-active .elementor-editor-element-settings').dataset.elementorEditorPostId;
        console.log('elementorPostId:', elementorPostId);
    
        // Fetch request to save the suggestion
        return fetch(config.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'save_feedback_suggestion',
                elementor_id: elementId,
                element_type: elementTypeClass,
                suggestion_value: suggestionValue,
                feedback_id: feedbackId,
                post_id: elementorPostId,
                username: feedbackData.data.username,
                _wpnonce: config.nonce,
            })
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                return { success: true, suggestion: { element_type: elementTypeClass, suggestion_value: suggestionValue } };
            } else {
                console.error('Failed to save suggestion:', data.data);
                return { success: false, data: data.data };
            }
        })
        .catch((error) => {
            console.error('Error saving suggestion:', error);
            return { success: false, data: error.message };
        });
    };

    // Get the suggestion value
    const getSuggestionValue = async (elementId) => {
        // Get the suggestion value based on the element type
        const element = document.querySelector(`[data-id="${elementId}"]`);
        if (!element) {
            console.error(`Element with ID ${elementId} not found.`);
            return { success: false, data: 'Element not found' };
        }

        const elementTypeClass = getElementType(element);
    
        if (!elementTypeClass) {
            console.error('Element type not found for ID:', elementId);
            return { success: false, data: 'Element type not found' };
        }
    
        let suggestionValue = '';
    
        switch (elementTypeClass) {
            case 'elementor-widget-text-editor':
                const editor = tinymce.get(`suggestion-text-editor-${elementId}`);
                if (editor) {
                    suggestionValue = editor.getContent({ format: 'html' }); // Ensure HTML content is retrieved
                } else {
                    const textarea = document.getElementById(`suggestion-text-editor-${elementId}`);
                    if (textarea) {
                        suggestionValue = textarea.value;
                    }
                }
                break;
            case 'elementor-widget-image':
                const inputFile = document.getElementById(`suggestion-image-upload-${elementId}`);
                if (inputFile && inputFile.files.length > 0) {
                    const file = inputFile.files[0];
                    suggestionValue = await uploadImage(file);
                } else if (inputFile && inputFile.dataset.url) {
                    suggestionValue = inputFile.dataset.url;
                }
                break;
            default:
                const inputDefault = document.getElementById(`suggestion-default-${elementId}`);
                if (inputDefault) {
                    suggestionValue = inputDefault.value;
                }
                break;
        }

        return suggestionValue;
    };

    // Upload image to the server
    const uploadImage = (file) => {
        const formData = new FormData();
        formData.append('action', 'upload_image');
        formData.append('image', file);
        formData.append('_wpnonce', config.nonce);

        return fetch(config.ajaxUrl, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                return data.data.url;
            } else {
                throw new Error('Image upload failed');
            }
        });
    };

    // Add suggestion to page
    const addToPage = async (suggestionId) => {
        const data = new FormData();
        data.append('action', 'add_to_page');
        data.append('suggestion_id', suggestionId);
        data.append('_wpnonce', config.nonce);
    
        try {
            const response = await fetch(config.ajaxUrl, {
                method: 'POST',
                body: data
            });
            const result = await response.json();
    
            if (result.success) {
                FeedbackHandler.showFeedbackMessage('Suggestion added to page successfully.');
                const { elementor_id } = result.data;
                window.location.href = `${window.location.origin}${window.location.pathname}?targetElementIs=${elementor_id}`;
            } else {
                FeedbackHandler.showFeedbackMessage('Failed to add suggestion to page.', true);
            }
        } catch (error) {
            console.error('Error adding suggestion to page:', error);
            FeedbackHandler.showFeedbackMessage('Failed to add suggestion to page.', true);
        }
    };

    return { getElementType, saveSuggestion, initializeTinyMCE, destroyTinyMCE, renderSuggestion, renderSuggestionInput, init, addSuggestionEventListeners, addToPage };
})();

export default FeedbackSuggestionHandler;