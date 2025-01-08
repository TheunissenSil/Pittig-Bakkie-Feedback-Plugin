document.addEventListener('DOMContentLoaded', function () {
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
                        console.log(`Session active for user: ${data.data.username}`);
                        enable(); // Enable feedback mode if session is valid
                    } else {
                        promptForKey(); // Prompt for key if no valid session
                    }
                })
                .catch((error) => console.error(error));
        };

        return { checkSessionAndEnable, disable };
    })();

    // PageScaler Module
    const PageScaler = (() => {
        const scale = () => {
            const viewportWidth = window.innerWidth;
            const availableWidth = viewportWidth - 300; // SIDEBAR_WIDTH

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

    // PhoneMode Module
    const PhoneMode = (() => {
        const enablePhoneMode = () => {
            const bodyChildren = Array.from(document.body.children).filter(
                (child) => !child.matches('#feedback-sidebar, #wpadminbar')
            );

            // Hide scrollbars and center content
            document.body.style.height = '100vh';
            document.body.style.overflow = 'hidden';
            document.body.style.display = 'flex';
            document.body.style.justifyContent = 'center';
            document.body.style.alignItems = 'center';
            document.body.style.paddingRight = '300px';

            // Create iframe
            const iframe = document.createElement('iframe');
            iframe.id = 'phone-size-iframe';
            iframe.style.width = '394px';
            iframe.style.height = '700px';
            iframe.style.border = '1px solid #000';
            iframe.style.borderRadius = '10px';
            iframe.style.overflowY = 'scroll';
            
			document.body.appendChild(iframe);

			// Move all children except excluded ones into the iframe
			const iframeDoc=iframe.contentDocument||iframe.contentWindow.document;iframeDoc.body.className=document.body.className;iframeDoc.body.style.width='375px';iframeDoc.body.style.height='700px';iframeDoc.body.style.boxSizing='border-box';iframeDoc.head.innerHTML='';Array.from(document.head.cloneNode(true).children).forEach(child=>{iframeDoc.head.appendChild(child.cloneNode(true))});bodyChildren.forEach(child=>{iframeDoc.body.appendChild(child)});const viewportMetaTag=iframeDoc.createElement("meta");viewportMetaTag.name="viewport";viewportMetaTag.content="width=375, initial-scale=1";iframeDoc.head.appendChild(viewportMetaTag);const scaleToPhoneButton=document.getElementById("scale-to-phone");scaleToPhoneButton.textContent="Scale Back to Desktop";scaleToPhoneButton.dataset.phoneMode="true"};const disablePhoneMode=()=>{const iframe=document.getElementById("phone-size-iframe");if(iframe){const iframeBodyChildren=Array.from(iframe.contentDocument||iframe.contentWindow.document.body.children);iframeBodyChildren.forEach(child=>{document.body.appendChild(child)});iframe.remove()}document.body.style.height='';document.body.style.overflow='';document.body.style.display='';document.body.style.justifyContent='';document.body.style.alignItems='';document.body.style.paddingRight='';PageScaler.reset();const scaleToPhoneButton=document.getElementById("scale-to-phone");scaleToPhoneButton.textContent="Scale to Phone";scaleToPhoneButton.dataset.phoneMode="false"};const togglePhoneMode=()=>{const scaleToPhoneButton=document.getElementById("scale-to-phone");let isPhoneMode=scaleToPhoneButton.dataset.phoneMode==="true";if(!isPhoneMode){enablePhoneMode()}else{disablePhoneMode()}};return{toggle:togglePhoneMode}})();document.getElementById("enable-feedback-mode").addEventListener("click",FeedbackMode.checkSessionAndEnable);document.getElementById("disable-feedback-mode").addEventListener("click",FeedbackMode.disable);document.getElementById("scale-to-phone").addEventListener("click",()=>{PhoneMode.toggle()})});