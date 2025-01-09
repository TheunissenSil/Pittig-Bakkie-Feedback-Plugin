const FeedbackSuggestionHandler = (() => {
    let config;
    const init = (cfg) => {
        config = cfg;
    };

    const renderSuggestion = (elementId, feedbackId) => {
        return fetchfeedbackSuggestions(elementId)
            .then((data) => {
                if (data.success && data.data.length > 0) {
                    // Render existing suggestions
                    return data.data.map(suggestion => {
                        return `
                            <div class="suggestion-body">
                                ${suggestion.suggestion_value}
                            </div>
                        `;
                    }).join('');
                } else {
                    // Render the button to add a new suggestion
                    return `
                        <button class="show-suggestion" data-elementor-id="${elementId}" data-feedback-id="${feedbackId}">Verander content suggestie</button>
                    `;
                }
            })
            .catch((error) => {
                console.error('Error fetching suggestions:', error);
                return '<p>Error loading suggestions.</p>';
            });
    };

    const renderSuggestionInput = (elementId, isNew = false) => {
        let suggestionContent = '';
        const element = document.querySelector(`[data-id="${elementId}"]`);
        
        // Check what the data-element_type of the element is
        const elementTypeClass = element.dataset.element_type === 'widget' 
            ? `elementor-widget-${element.dataset.widgetType.split('.')[0]}` 
            : element.dataset.element_type;

        switch (elementTypeClass) {
            case 'elementor-widget-text-editor':
                suggestionContent = `
                    <textarea name="suggestion_value" id="suggestion-text-editor-${elementId}" class="suggestion-text-editor"></textarea>
                `;
                break;
            case 'elementor-widget-image':
                suggestionContent = `
                    <input name="suggestion_value" type="file" id="suggestion-image-upload-${elementId}" class="suggestion-image-upload" accept="image/*" />
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
        }

        return suggestionContent;
    };

    const fillSuggestionContent = (elementId, elementTypeClass) => {
        const element = document.querySelector(`[data-id="${elementId}"] .elementor-widget-container`);
        if (!element) {
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

    // save the suggestion
    const saveSuggestion = async (elementId, feedbackId) => {
        const element = document.querySelector(`[data-id="${elementId}"]`);
        if (!element) {
            console.error(`Element with ID ${elementId} not found.`);
            return { success: false, data: 'Element not found' };
        }

        const elementTypeClass = element.dataset.element_type === 'widget' 
            ? `elementor-widget-${element.dataset.widgetType.split('.')[0]}` 
            : element.dataset.element_type;

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
                _wpnonce: config.nonce,
            })
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                return { success: true };
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

    const destroyTinyMCE = (elementId) => {
        const editor = tinymce.get(`suggestion-text-editor-${elementId}`);
        if (editor) {
            editor.remove();
        }
    };

    const fetchfeedbackSuggestions = (elementId) => {
        return fetch(config.ajaxUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'get_feedback_suggestion',
                elementor_id: elementId,
                _wpnonce: config.nonce,
            })
        })
        .then((response) => response.json());
    };

    return { saveSuggestion, initializeTinyMCE, destroyTinyMCE, renderSuggestion, renderSuggestionInput, init };
})();

export default FeedbackSuggestionHandler;