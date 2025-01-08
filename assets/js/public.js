import FeedbackMode from './Public/feedbackMode.js';
import PageScaler from './Public/pageScaler.js';
import PhoneMode from './Public/phoneMode.js';
import FeedbackHandler from './Public/feedbackHandler.js';

document.addEventListener('DOMContentLoaded', function () {
    // Configuration
    const config = {
        sidebar: 300,
        ajaxUrl: pittigBakkieFeedbackPlugin.ajaxUrl,
        nonce: pittigBakkieFeedbackPlugin.nonce,
        sessionUsername: pittigBakkieFeedbackPlugin.sessionUsername
    };

    // Initialize the feedback list
    FeedbackHandler.init(config);

    // Initialize FeedbackMode with config
    FeedbackMode.init(config);

    // Initialize PageScaler with config
    PageScaler.init(config);

    // Button Event Listeners 
    document.getElementById("enable-feedback-mode").addEventListener("click", FeedbackMode.checkSessionAndEnable);  
    document.getElementById("disable-feedback-mode").addEventListener("click", FeedbackMode.disable);
    document.getElementById('scale-to-phone').addEventListener('click', () => {
        PhoneMode.toggle();
    });
});