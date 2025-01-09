const FeedbackSuggestionHandler = (() => {
    let config;
    const init = (cfg) => {
        config = cfg;
    };

    const possibleElementTypes = ["elementor-widget-text-editor", "elementor-widget-image"];

    const renderSuggestionBlock = (elementId) => {
        // Check if the element type is supported
        if (isSuggestionsEnabled(elementId)) {
            // Check if there already exists a suggestion
            fetchfeedbackSuggestions(elementId)
                .then((data) => {
                    if (data.success) {
                        // Render the suggestion block
                        //console.log("render existing suggestions")
                    } else {
                        // Render the add suggestion button
                        //console.log("render add suggestion button")
                    }
                })
                .catch((error) => {
                    console.error('Error fetching feedback:', error);
                    return '';
                });
        }
    
        return '';
    };  

    const isSuggestionsEnabled = (elementId) => {
        const element = document.querySelector(`[data-id="${elementId}"]`);
        if (!element) {
            console.error(`Element with ID ${elementId} not found.`);
            return false;
        }
    
        const elementTypeClass = Array.from(element.classList).find(cls => cls.startsWith('elementor-widget-'));
        if (!elementTypeClass) {
            console.log("Element type not found for ID: ", elementId);
        }
    
        return possibleElementTypes.includes(elementTypeClass);
    };

    const renderSuggestionInput = (elementId, isNew = false) => {
        let suggestionContent = '';
        const element = document.querySelector(`[data-id="${elementId}"]`);
        const elementTypeClass = Array.from(element.classList).find(cls => cls.startsWith('elementor-widget-'));

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
                suggestionContent = `<div class="suggestion-default">Unsupported element type</div>`;
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

        console.log("fillSuggestionContent", elementId, elementTypeClass);

        switch (elementTypeClass) {
            case 'elementor-widget-text-editor':
                console.log("text editor");
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
                console.log("image");
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
                console.error('Unsupported element type:', elementTypeClass);
                break;
        }
    };

    // save the suggestion
    const saveSuggestion = async (elementId, feedbackId) => {
        const element = document.querySelector(`[data-id="${elementId}"]`);
        if (!element) {
            console.error(`Element with ID ${elementId} not found.`);
            return;
        }
    
        const elementTypeClass = Array.from(element.classList).find(cls => cls.startsWith('elementor-widget-'));
        if (!elementTypeClass) {
            console.error('Element type not found for ID:', elementId);
            return;
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
                console.error('Unsupported element type:', elementTypeClass);
                return;
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
                console.log('Suggestion saved successfully.');
            } else {
                console.error('Failed to save suggestion:', data.data);
            }
        })
        .catch((error) => {
            console.error('Error saving suggestion:', error);
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

    return { saveSuggestion, initializeTinyMCE, destroyTinyMCE, isSuggestionsEnabled, renderSuggestionInput, renderSuggestionBlock, init };
})();

export default FeedbackSuggestionHandler;