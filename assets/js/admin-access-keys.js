document.addEventListener('DOMContentLoaded', function () {
    const ajaxUrl = pittigBakkieFeedbackPlugin.ajaxurl;
    const nonce = pittigBakkieFeedbackPlugin.nonce;

    // Generate a new key
    const generateKeyButton = document.getElementById('generate-key-button');
    const usernameInput = document.getElementById('username');
    const accessKeysTableBody = document.getElementById('access-keys-table-body');

    // Generate key
    generateKeyButton.addEventListener('click', () => {
        // Validate username
        const username = usernameInput.value.trim();
        if (!username) {
            alert('Please enter a username.');
            return;
        }

        // Generate key
        fetch(ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'generate_key',
                username: username,
                _wpnonce: nonce,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    alert(`Access Key: ${data.data.key}`);
                    fetchKeys(); 
                } else {
                    alert(data.data || 'Error generating key.');
                }
            })
            .catch((error) => console.error(error));
    });

    // Fetch all keys
    const fetchKeys = () => {
        fetch(ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ 
                action: 'get_keys',
                _wpnonce: nonce,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    renderKeys(data.data);
                } else {
                    alert(data.data || 'Error fetching keys.');
                }
            })
            .catch((error) => console.error(error));
    };

    // Render keys in the table
    const renderKeys = (keys) => {
        accessKeysTableBody.innerHTML = keys.map(key => `
            <tr>
                <td>${key.username}</td>
                <td>${key.created_at}</td>
                <td>
                    <button class="button button-secondary" data-id="${key.id}" data-action="regenerate">Regenerate</button>
                    <button class="button button-secondary" data-id="${key.id}" data-action="delete">Delete</button>
                </td>
            </tr>
        `).join('');

        // Add event listeners for regenerate and delete buttons
        accessKeysTableBody.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', handleButtonClick);
        });
    };

    // Handle button clicks for regenerate and delete actions
    const handleButtonClick = (event) => {
        const button = event.target;
        const id = button.getAttribute('data-id');
        const action = button.getAttribute('data-action');

        if (action === 'regenerate') {
            regenerateKey(id);
        } else if (action === 'delete') {
            deleteKey(id);
        }
    };

    // Regenerate key
    const regenerateKey = (id) => {
        fetch(ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'regenerate_key',
                id: id,
                _wpnonce: nonce,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    alert(`New Access Key: ${data.data.key}`);
                    fetchKeys(); 
                } else {
                    alert(data.data || 'Error regenerating key.');
                }
            })
            .catch((error) => console.error(error));
    };

    // Delete key
    const deleteKey = (id) => {
        fetch(ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'delete_key',
                id: id,
                _wpnonce: nonce,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    alert('Access key deleted.');
                    fetchKeys(); 
                } else {
                    alert(data.data || 'Error deleting key.');
                }
            })
            .catch((error) => console.error(error));
    };

    // Fetch keys on page load
    fetchKeys();
});