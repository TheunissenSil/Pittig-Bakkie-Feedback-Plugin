<?php

namespace PittigBakkieFeedbackPlugin\Core\Handlers;

class FeedbackHandler {
    private $table_name;

    public function __construct() {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'pittig_bakkie_feedback';

        add_action('wp_ajax_get_feedback', [$this, 'get_feedback']);
        add_action('wp_ajax_nopriv_get_feedback', [$this, 'get_feedback']);
    }

    private function validate_nonce() {
        if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'feedback_management_nonce')) {
            wp_send_json_error(__('Unauthorized request.', 'pittig-bakkie-feedback-plugin'));
            return;
        }
    }

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
}
