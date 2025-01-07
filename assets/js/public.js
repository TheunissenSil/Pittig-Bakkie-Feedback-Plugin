document.addEventListener('DOMContentLoaded', function () {
    // Constants
    const SIDEBAR_WIDTH = 300;
    const ajaxUrl = pittigBakkieFeedbackPlugin.ajaxUrl;
    const nonce = pittigBakkieFeedbackPlugin.nonce;

    // FeedbackMode Module
    const FeedbackMode = (() => {
        let permanentlyHighlightedElement = null;

        const enable = () => {
            document.body.classList.add('feedback-mode-active');
            PageScaler.scale();
            document.body.addEventListener('mouseover', handleMouseOver);
            document.body.addEventListener('mouseout', handleMouseOut);
            document.body.addEventListener('click', handleElementClick);

            FeedbackFetcher.fetchFeedback();
        };

        const disable = () => {
            document.body.classList.remove('feedback-mode-active');
            PageScaler.reset();
            document.body.removeEventListener('mouseover', handleMouseOver);
            document.body.removeEventListener('mouseout', handleMouseOut);
            document.body.removeEventListener('click', handleElementClick);

            if (permanentlyHighlightedElement) {
                removePermanentHighlight(permanentlyHighlightedElement);
                permanentlyHighlightedElement = null;
            }
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

            // Show the form and hide the button
            enableButton.style.display = 'none';
            accessKeyForm.style.display = 'block';

            // Add event listener to handle form submission
            accessKeyForm.addEventListener('submit', (e) => {
                e.preventDefault(); // Prevent default form submission

                const accessKeyInput = document.getElementById('access-key-input');
                const keyValue = accessKeyInput.value.trim();

                if (!keyValue) {
                    alert('Please enter an access key.');
                    return;
                }

                validateAccessKey(keyValue, accessKeyForm, enableButton);
            });
        };

        const validateAccessKey = (key, form, button) => {
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
                        alert('Access granted!');
                        form.style.display = 'none'; 
                        button.style.display = 'block'; 
                        enable(); 
                    } else {
                        alert(data.data || 'Invalid access key.');
                    }
                })
                .catch((error) => console.error(error));
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

        return { checkSessionAndEnable, disable };
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

    // FeedbackFetcher Module
    const FeedbackFetcher = (() => {
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
            if (!feedbackItems.length) {
                feedbackListContainer.innerHTML =
                    '<p>No feedback available.</p>';
                return;
            }

            const listHtml = feedbackItems.map((item) =>
                `<div class="feedback-item" data-id="${item.id}">
                    <p>${item.feedback_comment}</p>
                    <div class="feedback-meta">
                        <p>${item.username || 'Anonymous'}</p>
                        <p>${item.display_size || 'Unknown'}</p>
                        <p>${item.status}</p>
                        <p>${new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    ${
                      item.admin_comment
                        ? `<div class="admin-comment">${item.admin_comment}</div>`
                        : ''
                    }
                 </div>`
              ).join('');

              feedbackListContainer.innerHTML= listHtml;
          };
          
          return {fetchFeedback};
      })();

      // Button Event Listeners 
      document.getElementById("enable-feedback-mode").addEventListener("click", FeedbackMode.checkSessionAndEnable);  
      document.getElementById("disable-feedback-mode").addEventListener("click", FeedbackMode.disable);
});