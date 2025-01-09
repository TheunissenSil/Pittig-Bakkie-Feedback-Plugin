const FeedbackSuggestionHandler = (() => {
    const renderSuggestions = () => {
        return `
            <h4>Verander content:</h4>
            <div class="suggestion-body">Suggestion Body</div>
        `;
    };

    return { renderSuggestions };
})();

export default FeedbackSuggestionHandler;