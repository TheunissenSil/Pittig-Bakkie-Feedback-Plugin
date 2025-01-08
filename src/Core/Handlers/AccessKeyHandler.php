<?php

namespace PittigBakkieFeedbackPlugin\Core\Handlers;

class AccessKeyHandler {
    private $table_name;

    public function __construct() {
        global $wpdb;

        // Set table name
        $this->table_name = $wpdb->prefix . 'pittig_bakkie_access_keys';

        // Add AJAX actions
        add_action('wp_ajax_generate_key', [$this, 'generate_key']);
        add_action('wp_ajax_regenerate_key', [$this, 'regenerate_key']);
        add_action('wp_ajax_delete_key', [$this, 'delete_key']);
        add_action('wp_ajax_get_keys', [$this, 'get_keys']);

        add_action('wp_ajax_validate_key', [$this, 'validate_key']);
        add_action('wp_ajax_nopriv_validate_key', [$this, 'validate_key']);
        add_action('wp_ajax_check_key_session', [$this, 'check_key_session']);
        add_action('wp_ajax_nopriv_check_key_session', [$this, 'check_key_session']);
    }

    // Validate the nonce
    private function validate_nonce() {
        if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'keys_management_nonce')) {
            wp_send_json_error(__('Invalid or expired nonce.', 'pittig-bakkie-feedback-plugin'));
            exit;
        }
    }

    // Check for admin permissions
    private function check_admin_permissions() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Unauthorized request.', 'pittig-bakkie-feedback-plugin'));
            exit;
        }
    }

    // Generate new access key
    public function generate_key() {
        $this->validate_nonce();
        $this->check_admin_permissions();

        global $wpdb;

        // Get variables
        $username = sanitize_text_field($_POST['username']);

        // Check if the username already exists
        $existing_user = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$this->table_name} WHERE username = %s",
            $username
        ));

        // If the username already exists, return an error
        if ($existing_user > 0) {
            wp_send_json_error(__('A key for this username already exists.', 'pittig-bakkie-feedback-plugin'));
            return;
        }

        // Generate random key
        $key = wp_generate_password(32, false);
        $encrypted_key = wp_hash_password($key);

        // Insert into database
        $wpdb->insert($this->table_name, [
            'username' => $username,
            'access_key' => $encrypted_key,
            'created_at' => current_time('mysql'),
        ]);

        wp_send_json_success(['key' => $key]);
    }

    // Regenerate access key
    public function regenerate_key() {
        $this->validate_nonce();
        $this->check_admin_permissions();

        global $wpdb;

        // Get variables
        $id = intval($_POST['id']);

        // Generate new key
        $key = wp_generate_password(32, false);
        $encrypted_key = wp_hash_password($key);

        // Update database
        $wpdb->update($this->table_name, [
            'access_key' => $encrypted_key,
            'created_at' => current_time('mysql'),
        ], ['id' => $id]);

        wp_send_json_success(['key' => $key]);
    }

    // Delete access key
    public function delete_key() {
        $this->validate_nonce();
        $this->check_admin_permissions();

        // Get variables
        global $wpdb;
        $id = intval($_POST['id']);

        // Delete from database
        $wpdb->delete($this->table_name, ['id' => $id]);

        wp_send_json_success(__('Access key deleted.', 'pittig-bakkie-feedback-plugin'));
    }

    // Get all access keys
    public function get_keys() {
        $this->validate_nonce();
        $this->check_admin_permissions();

        global $wpdb;

        // Fetch all keys
        $results = $wpdb->get_results("SELECT id, username, created_at FROM {$this->table_name}", ARRAY_A);

        wp_send_json_success($results);
    }

    // Validate access key
    public function validate_key() {
        // Different nonce for this action
        if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'feedback_management_nonce')) {
            wp_send_json_error(__('Invalid or expired nonce.', 'pittig-bakkie-feedback-plugin'));
            exit;
        }

        // Check if key is provided
        if (!isset($_POST['key'])) {
            wp_send_json_error(__('No key provided.', 'pittig-bakkie-feedback-plugin'));
            return;
        }

        global $wpdb;

        // Get variables
        $key = sanitize_text_field($_POST['key']);
    
        // Fetch all keys and verify against the hashed key
        $stored_keys = $wpdb->get_results("SELECT * FROM $this->table_name");
    
        foreach ($stored_keys as $stored) {
            // Check if the key matches 
            if (wp_check_password($key, $stored->access_key)) {
                if (!session_id()) {
                    session_start();
                }

                // Set session variables
                $_SESSION['feedback_username'] = sanitize_text_field($stored->username);
                $_SESSION['feedback_expires'] = time() + 3600; // Session time
    
                wp_send_json_success(__('Valid key.', 'pittig-bakkie-feedback-plugin'));
            }
        }
    
        wp_send_json_error(__('Invalid key.', 'pittig-bakkie-feedback-plugin'));
    }

    // Check if a valid session exists
    public function check_key_session() {
        // Different nonce for this action
        if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'feedback_management_nonce')) {
            wp_send_json_error(__('Invalid or expired nonce.', 'pittig-bakkie-feedback-plugin'));
            exit;
        }

        if (!session_id()) {
            session_start();
        }

        // Check if session exists and is still valid
        if (isset($_SESSION['feedback_username']) && isset($_SESSION['feedback_expires'])) {
            if ($_SESSION['feedback_expires'] > time()) {
                wp_send_json_success(['username' => $_SESSION['feedback_username']]);
                return;
            }
            
            // Session expired
            unset($_SESSION['feedback_username']);
            unset($_SESSION['feedback_expires']);
        }

        // If logged in to WordPress, automatically create a session
        if (is_user_logged_in()) {
            $_SESSION['feedback_username'] = 'Pittig Bakkie';
            $_SESSION['feedback_expires'] = time() + (3 * HOUR_IN_SECONDS);

            wp_send_json_success(['username' => 'Pittig Bakkie']);
            return;
        }

        // No valid session found
        wp_send_json_error(__('No valid session found.', 'pittig-bakkie-feedback-plugin'));
    }
}