<?php

namespace PittigBakkieFeedbackPlugin\Core\Handlers;

class FeedbackHandler {
    private $table_name;

    public function __construct() {
        global $wpdb;

        // Set table name
        $this->table_name = $wpdb->prefix . 'pittig_bakkie_feedback';

        // Add AJAX actions
        add_action('wp_ajax_get_feedback', [$this, 'get_feedback']);
        add_action('wp_ajax_nopriv_get_feedback', [$this, 'get_feedback']);

        add_action('wp_ajax_edit_feedback', [$this, 'edit_feedback']);
        add_action('wp_ajax_nopriv_edit_feedback', [$this, 'edit_feedback']);

        add_action('wp_ajax_delete_feedback', [$this, 'delete_feedback']);
        add_action('wp_ajax_nopriv_delete_feedback', [$this, 'delete_feedback']);

        add_action('wp_ajax_save_feedback', [$this, 'save_feedback']);
        add_action('wp_ajax_nopriv_save_feedback', [$this, 'save_feedback']);

        add_action('wp_ajax_add_admin_comment', [$this, 'add_admin_comment']);
        add_action('wp_ajax_edit_admin_comment', [$this, 'edit_admin_comment']);
        add_action('wp_ajax_delete_admin_comment', [$this, 'delete_admin_comment']);

        add_action('wp_ajax_change_status', [$this, 'change_status']);
    }

    // Validate nonce
    private function validate_nonce() {
        if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'feedback_management_nonce')) {
            wp_send_json_error(__('Unauthorized request.', 'pittig-bakkie-feedback-plugin'));
            return;
        }
    }

    // Check for admin permissions
    private function check_admin_permissions() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Unauthorized request.', 'pittig-bakkie-feedback-plugin'));
            exit;
        }
    }

    // Get feedback data
    public function get_feedback() {
        $this->validate_nonce();

        global $wpdb;
        
        // Query feedback data
        $results = $wpdb->get_results(
            "SELECT id, elementor_id, feedback_comment, admin_comment, element_feedback_page, username, display_size, status, created_at 
             FROM $this->table_name
             ORDER BY created_at DESC",
            ARRAY_A
        );
    
        if ($results) {
            wp_send_json_success($results); // Return data as JSON
        } else {
            wp_send_json_error(__('No feedback found.', 'pittig-bakkie-feedback-plugin')); // Return error if no data is found
        }
    }

    // Edit feedback comment
    public function edit_feedback() {
        $this->validate_nonce();
    
        if (!session_id()) {
            session_start();
        }
    
        // Check if the user is logged in
        if (!isset($_SESSION['feedback_username'])) {
            wp_send_json_error(__('You are not authorized to edit this feedback.', 'pittig-bakkie-feedback-plugin'));
            return;
        }
    
        global $wpdb;

        // Get variables
        $feedback_id = intval($_POST['id']);
        $new_comment = sanitize_text_field($_POST['feedback_comment']);
        $username = $_SESSION['feedback_username'];
    
        // Check if the feedback belongs to the current user
        $feedback = $wpdb->get_row($wpdb->prepare(
            "SELECT username FROM {$this->table_name} WHERE id = %d",
            $feedback_id
        ));
    
        // Check if the feedback exists and belongs to the current user
        if (!$feedback || $feedback->username !== $username) {
            wp_send_json_error(__('You are not authorized to edit this feedback.', 'pittig-bakkie-feedback-plugin'));
            return;
        }
    
        // Update the feedback comment
        $updated = $wpdb->update(
            $this->table_name,
            ['feedback_comment' => $new_comment],
            ['id' => $feedback_id],
            ['%s'],
            ['%d']
        );
    
        if ($updated) {
            wp_send_json_success(__('Feedback updated successfully.', 'pittig-bakkie-feedback-plugin'));
        } else {
            wp_send_json_error(__('Failed to update feedback.', 'pittig-bakkie-feedback-plugin'));
        }
    }

    // Delete the feedback
    public function delete_feedback() {
        $this->validate_nonce();
    
        if (!session_id()) {
            session_start();
        }
    
        // Check if the user is logged in
        if (!isset($_SESSION['feedback_username'])) {
            wp_send_json_error(__('You are not authorized to delete this feedback.', 'pittig-bakkie-feedback-plugin'));
            return;
        }
    
        global $wpdb;

        // Get variables
        $feedback_id = intval($_POST['id']);
        $username = $_SESSION['feedback_username'];
    
        // Check if the feedback belongs to the current user
        $feedback = $wpdb->get_row($wpdb->prepare(
            "SELECT username FROM {$this->table_name} WHERE id = %d",
            $feedback_id
        ));
    
        // Check if the feedback exists and belongs to the current user
        if (!$feedback || $feedback->username !== $username) {
            wp_send_json_error(__('You are not authorized to delete this feedback.', 'pittig-bakkie-feedback-plugin'));
            return;
        }
    
        // Delete the feedback suggestions
        $wpdb->delete(
            $this->suggestions_table_name,
            ['feedback_id' => $feedback_id],
            ['%d']
        );

        // Delete the feedback
        $deleted = $wpdb->delete(
            $this->table_name,
            ['id' => $feedback_id],
            ['%d']
        );
    
        if ($deleted) {
            wp_send_json_success(__('Feedback and associated suggestions deleted successfully.', 'pittig-bakkie-feedback-plugin'));
        } else {
            wp_send_json_error(__('Failed to delete feedback.', 'pittig-bakkie-feedback-plugin'));
        }
    }

    // Save the feedback 
    public function save_feedback() {
        $this->validate_nonce();
    
        if (!session_id()) {
            session_start();
        }
    
        // Check if the user is logged in
        if (!isset($_SESSION['feedback_username'])) {
            wp_send_json_error(__('You are not authorized to save feedback.', 'pittig-bakkie-feedback-plugin'));
            return;
        }
    
        global $wpdb;

        // Get variables
        $element_feedback_page = sanitize_text_field($_POST['element_feedback_page']);
        $elementor_id = sanitize_text_field($_POST['elementor_id']);
        $feedback_comment = sanitize_text_field($_POST['feedback_comment']);
        $display_size = sanitize_text_field($_POST['display_size']);
        $username = $_SESSION['feedback_username'];
    
        // Insert the feedback
        $inserted = $wpdb->insert(
            $this->table_name,
            [
                'elementor_id' => $elementor_id,
                'feedback_comment' => $feedback_comment,
                'element_feedback_page' => $element_feedback_page,
                'username' => $username,
                'display_size' => $display_size,
                'status' => 'pending',
                'created_at' => current_time('mysql'),
            ],
            ['%s', '%s', '%s', '%s', '%s', '%s', '%s']
        );
    
        if ($inserted) {
            $feedback_id = $wpdb->insert_id;
            wp_send_json_success(['feedback_id' => $feedback_id, 'message' => __('Feedback saved successfully.', 'pittig-bakkie-feedback-plugin')]);
        } else {
            wp_send_json_error(__('Failed to save feedback.', 'pittig-bakkie-feedback-plugin'));
        }
    }

    // Add admin comment
    public function add_admin_comment() {
        $this->validate_nonce();
        $this->check_admin_permissions();

        global $wpdb;

        // Get variables
        $feedback_id = intval($_POST['id']);
        $admin_comment = sanitize_text_field($_POST['admin_comment']);

        // Update the feedback with the admin comment
        $updated = $wpdb->update(
            $this->table_name,
            ['admin_comment' => $admin_comment],
            ['id' => $feedback_id],
            ['%s'],
            ['%d']
        );

        if ($updated) {
            wp_send_json_success(__('Admin comment added successfully.', 'pittig-bakkie-feedback-plugin'));
        } else {
            wp_send_json_error(__('Failed to add admin comment.', 'pittig-bakkie-feedback-plugin'));
        }
    }

    // Edit admin comment
    public function edit_admin_comment() {
        $this->validate_nonce();
        $this->check_admin_permissions();

        global $wpdb;

        // Get variables
        $feedback_id = intval($_POST['id']);
        $admin_comment = sanitize_text_field($_POST['admin_comment']);

        // Update the feedback with the new admin comment
        $updated = $wpdb->update(
            $this->table_name,
            ['admin_comment' => $admin_comment],
            ['id' => $feedback_id],
            ['%s'],
            ['%d']
        );

        if ($updated) {
            wp_send_json_success(__('Admin comment edited successfully.', 'pittig-bakkie-feedback-plugin'));
        } else {
            wp_send_json_error(__('Failed to edit admin comment.', 'pittig-bakkie-feedback-plugin'));
        }
    }

    // Delete admin comment
    public function delete_admin_comment() {
        $this->validate_nonce();
        $this->check_admin_permissions();

        global $wpdb;

        // Get variables
        $feedback_id = intval($_POST['id']);

        // Update the feedback to remove the admin comment
        $updated = $wpdb->update(
            $this->table_name,
            ['admin_comment' => ''],
            ['id' => $feedback_id],
            ['%s'],
            ['%d']
        );

        if ($updated) {
            wp_send_json_success(__('Admin comment deleted successfully.', 'pittig-bakkie-feedback-plugin'));
        } else {
            wp_send_json_error(__('Failed to delete admin comment.', 'pittig-bakkie-feedback-plugin'));
        }
    }

    // Change the status of the feedback
    public function change_status() {
        $this->validate_nonce();
        $this->check_admin_permissions();
    
        global $wpdb;
    
        // Get variables
        $feedback_id = intval($_POST['id']);
        $new_status = sanitize_text_field($_POST['status']);
    
        // Update the feedback status
        $updated = $wpdb->update(
            $this->table_name,
            ['status' => $new_status],
            ['id' => $feedback_id],
            ['%s'],
            ['%d']
        );
    
        if ($updated) {
            wp_send_json_success(__('Status updated successfully.', 'pittig-bakkie-feedback-plugin'));
        } else {
            wp_send_json_error(__('Failed to update status.', 'pittig-bakkie-feedback-plugin'));
        }
    }
}