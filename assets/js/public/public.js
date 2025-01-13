import FeedbackMode from './feedbackMode.js';
import PageScaler from './pageScaler.js';
import PhoneMode from './phoneMode.js';
import feedbackRenderer from './feedbackRenderer.js';
import FeedbackHandler from './feedbackHandler.js';
import FeedbackSuggestionHandler from './feedbackSuggestionHandler.js';

document.addEventListener('DOMContentLoaded', function () {
    // Configuration
    const config = {
        sidebar: 350,
        ajaxUrl: pittigBakkieFeedbackPlugin.ajaxUrl,
        nonce: pittigBakkieFeedbackPlugin.nonce,
        sessionUsername: pittigBakkieFeedbackPlugin.sessionUsername,
        isAdmin: pittigBakkieFeedbackPlugin.isAdmin
    };

    // Initialize the feedback handler
    FeedbackHandler.init(config);

    // Initialize the feedback list
    feedbackRenderer.init(config);

    // Initialize FeedbackMode with config
    FeedbackMode.init(config);

    // Initialize PageScaler with config
    PageScaler.init(config);

    // Initialize FeedbackSuggestionHandler with config
    FeedbackSuggestionHandler.init(config);

    // Button Event Listeners 
    document.getElementById("enable-feedback-mode").addEventListener("click", FeedbackMode.checkSessionAndEnable);  
    document.getElementById("disable-feedback-mode").addEventListener("click", FeedbackMode.disable);
    document.getElementById('scale-to-phone').addEventListener('click', () => {
        PhoneMode.toggle();
    });
});