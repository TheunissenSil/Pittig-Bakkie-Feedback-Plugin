document.addEventListener('DOMContentLoaded', function () {
    const ajaxUrl = pittigBakkieFeedbackPlugin.ajaxurl;
    const nonce = pittigBakkieFeedbackPlugin.nonce;
    let feedbackItems = [];

    // Fetch all feedback
    const fetchFeedback = () => {
        fetch(ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'get_feedback',
                _wpnonce: nonce,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    feedbackItems = data.data;
                    renderFeedback('pending');
                } else {
                    alert(data.data || 'Error fetching feedback.');
                }
            })
            .catch((error) => console.error(error));
    };

    // Render feedback in the table based on status
    const renderFeedback = (status) => {
        const feedbackList = document.getElementById('feedback-list');
        const filteredFeedback = feedbackItems.filter(item => item.status === status);
        feedbackList.innerHTML = filteredFeedback.map(item => `
            <tr>
                <td>${item.username}</td>
                <td>${item.feedback_comment}</td>
                <td>${item.admin_comment || ''}</td>
                <td>${item.display_size || ''}</td>
                <td>${item.element_feedback_page || ''}</td>
                <td>${new Date(item.created_at).toLocaleString()}</td>
                <td>
                    <select class="feedback-status" data-id="${item.id}">
                        <option value="pending" ${item.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="approved" ${item.status === 'approved' ? 'selected' : ''}>Approved</option>
                        <option value="rejected" ${item.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                </td>
                <td>
                    <button class="button button-secondary go-to-feedback" feedback-page="${item.element_feedback_page}" data-id="${item.id}" data-elementor-id="${item.elementor_id}">Go to Feedback</button>
                </td>
            </tr>
        `).join('');
    
        // Add event listeners for status change and go to feedback buttons
        feedbackList.querySelectorAll('.feedback-status').forEach(select => {
            select.addEventListener('change', handleChangeStatus);
        });
        feedbackList.querySelectorAll('.go-to-feedback').forEach(button => {
            button.addEventListener('click', handleGoToFeedback);
        });
    };

    // Handle status change
    const handleChangeStatus = (event) => {
        const select = event.target;
        const feedbackId = select.getAttribute('data-id');
        const newStatus = select.value;

        fetch(ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'change_status',
                id: feedbackId,
                status: newStatus,
                _wpnonce: nonce,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    alert('Status updated successfully.');
                    fetchFeedback();
                } else {
                    alert(data.data || 'Error updating status.');
                }
            })
            .catch((error) => console.error(error));
    };

    // Handle go to feedback
    const handleGoToFeedback = (event) => {
        const feedbackPage = event.target.getAttribute('feedback-page')
        const elementorId = event.target.getAttribute('data-elementor-id');
    
        if (feedbackPage && elementorId) {
            // Redirect to the feedback page
            window.location.href = `${window.location.origin}${feedbackPage}?targetElementIs=${elementorId}`;
    
            // Wait for the page to load and then activate feedback mode and highlight the element
            setTimeout(() => {
                document.getElementById('enable-feedback-mode').click();
                const targetElement = document.querySelector(`.elementor-element[data-id="${elementorId}"]`);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetElement.classList.add('permanent-highlight');
                }
            }, 1000);
        }
    };

    // Handle tab click
    const handleTabClick = (event) => {
        event.preventDefault();
        const tab = event.target;
        const status = tab.getAttribute('data-status');

        // Remove active class from all tabs
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('nav-tab-active'));

        // Add active class to the clicked tab
        tab.classList.add('nav-tab-active');

        // Render feedback based on the selected tab
        renderFeedback(status);
    };

    // Add event listeners for tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', handleTabClick);
    });

    // Fetch feedback on page load
    fetchFeedback();
});