<?php

namespace PittigBakkieFeedbackPlugin\Core\Handlers;

class FeedbackHandler {
    private $table_name;

    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'pittig_bakkie_feedback';

        add_action('wp_ajax_get_feedback', [$this, 'get_feedback']);
        add_action('wp_ajax_nopriv_get_feedback', [$this, 'get_feedback']);

        add_action('wp_ajax_edit_feedback', [$this, 'edit_feedback']);
        add_action('wp_ajax_nopriv_edit_feedback', [$this, 'edit_feedback']);

        add_action('wp_ajax_delete_feedback', [$this, 'delete_feedback']);
        add_action('wp_ajax_nopriv_delete_feedback', [$this, 'delete_feedback']);
    }

    // Validate nonce
    private function validate_nonce() {
        if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'feedback_management_nonce')) {
            wp_send_json_error(__('Unauthorized request.', 'pittig-bakkie-feedback-plugin'));
            return;
        }
    }

    // Get feedback data
    public function get_feedback() {
        $this->validate_nonce();

        global $wpdb;
        
        // Query feedback data
        $results = $wpdb->get_results(
            "SELECT id, elementor_id, feedback_comment, admin_comment, username, display_size, status, created_at 
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
    
        if (!isset($_SESSION['feedback_username'])) {
            wp_send_json_error(__('You are not authorized to edit this feedback.', 'pittig-bakkie-feedback-plugin'));
            return;
        }
    
        global $wpdb;
        $feedback_id = intval($_POST['id']);
        $new_comment = sanitize_text_field($_POST['feedback_comment']);
        $username = $_SESSION['feedback_username'];
    
        // Check if the feedback belongs to the current user
        $feedback = $wpdb->get_row($wpdb->prepare(
            "SELECT username FROM {$this->table_name} WHERE id = %d",
            $feedback_id
        ));
    
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

    public function delete_feedback() {
        $this->validate_nonce();
    
        if (!session_id()) {
            session_start();
        }
    
        if (!isset($_SESSION['feedback_username'])) {
            wp_send_json_error(__('You are not authorized to delete this feedback.', 'pittig-bakkie-feedback-plugin'));
            return;
        }
    
        global $wpdb;
        $feedback_id = intval($_POST['id']);
        $username = $_SESSION['feedback_username'];
    
        // Check if the feedback belongs to the current user
        $feedback = $wpdb->get_row($wpdb->prepare(
            "SELECT username FROM {$this->table_name} WHERE id = %d",
            $feedback_id
        ));
    
        if (!$feedback || $feedback->username !== $username) {
            wp_send_json_error(__('You are not authorized to delete this feedback.', 'pittig-bakkie-feedback-plugin'));
            return;
        }
    
        // Delete the feedback
        $deleted = $wpdb->delete(
            $this->table_name,
            ['id' => $feedback_id],
            ['%d']
        );
    
        if ($deleted) {
            wp_send_json_success(__('Feedback deleted successfully.', 'pittig-bakkie-feedback-plugin'));
        } else {
            wp_send_json_error(__('Failed to delete feedback.', 'pittig-bakkie-feedback-plugin'));
        }
    }
}
