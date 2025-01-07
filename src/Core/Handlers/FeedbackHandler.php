<?php

namespace PittigBakkieFeedbackPlugin\Core\Handlers;

class FeedbackHandler {
    public function __construct() {
        add_action('wp_ajax_get_feedback', [$this, 'get_feedback']);
        add_action('wp_ajax_nopriv_get_feedback', [$this, 'get_feedback']);

        error_log('FeedbackHandler loaded');
    }

    public function get_feedback() {
        // Check nonce for security
        if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'get_feedback_nonce')) {
            wp_send_json_error(__('Unauthorized request.', 'feedback-tool'));
            return;
        }

        global $wpdb;
    
        // Table name
        $table_name = $wpdb->prefix . 'pittig_bakkie_feedback';
        
        // Query feedback data
        $results = $wpdb->get_results(
            "SELECT id, elementor_id, feedback_comment, admin_comment, username, display_size, status, created_at 
             FROM $table_name 
             ORDER BY created_at DESC",
            ARRAY_A
        );
    
        if ($results) {
            wp_send_json_success($results); // Return data as JSON
        } else {
            wp_send_json_error(__('No feedback found.', 'feedback-tool')); // Return error if no data is found
        }
    }    
}
