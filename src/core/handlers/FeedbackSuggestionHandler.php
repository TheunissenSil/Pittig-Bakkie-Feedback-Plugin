<?php

namespace PittigBakkieFeedbackPlugin\Core\Handlers;

class FeedbackSuggestionHandler {
    private $table_name;

    public function __construct() {
        global $wpdb;

        // Set table name
        $this->table_name = $wpdb->prefix . 'pittig_bakkie_feedback_suggestions';

        // Add AJAX actions
        add_action('wp_ajax_get_feedback_suggestion', array($this, 'get_feedback_suggestion'));
        add_action('wp_ajax_nopriv_get_feedback_suggestion', array($this, 'get_feedback_suggestion'));
        add_action('wp_ajax_upload_image', array($this, 'upload_image'));
        add_action('wp_ajax_nopriv_upload_image', array($this, 'upload_image'));
        add_action('wp_ajax_save_feedback_suggestion', array($this, 'save_feedback_suggestion'));
        add_action('wp_ajax_nopriv_save_feedback_suggestion', array($this, 'save_feedback_suggestion'));
    }

    // Validate nonce
    private function validate_nonce() {
        if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'feedback_management_nonce')) {
            wp_send_json_error(__('Unauthorized request.', 'pittig-bakkie-feedback-plugin'));
            return;
        }
    }

    // Get feedback suggestion
    public function get_feedback_suggestion() {
        $this->validate_nonce();

        if (!isset($_POST['elementor_id'])) {
            wp_send_json_error(__('Elementor ID is required.', 'pittig-bakkie-feedback-plugin'));
            return;
        }

        $elementor_id = sanitize_text_field($_POST['elementor_id']);
        global $wpdb;

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE feedback_element = %s",
            $elementor_id
        ));

        if ($results) {
            wp_send_json_success($results);
        } else {
            wp_send_json_error(__('No feedback suggestions found.', 'pittig-bakkie-feedback-plugin'));
        }
    }

    // Upload image
    public function upload_image() {
        $this->validate_nonce();

        if (!function_exists('wp_handle_upload')) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
        }

        $uploadedfile = $_FILES['image'];
        $upload_overrides = array('test_form' => false);

        $movefile = wp_handle_upload($uploadedfile, $upload_overrides);

        if ($movefile && !isset($movefile['error'])) {
            wp_send_json_success(['url' => $movefile['url']]);
        } else {
            wp_send_json_error($movefile['error']);
        }
    }

    // Save feedback suggestion
    public function save_feedback_suggestion() {
        $this->validate_nonce();

        if (!isset($_POST['elementor_id']) || !isset($_POST['element_type']) || !isset($_POST['suggestion_value']) || !isset($_POST['feedback_id'])) {
            wp_send_json_error(__('Missing required fields.', 'pittig-bakkie-feedback-plugin'));
            return;
        }

        $elementor_id = sanitize_text_field($_POST['elementor_id']);
        $element_type = sanitize_text_field($_POST['element_type']);
        $suggestion_value = wp_kses_post($_POST['suggestion_value']); // Allow safe HTML
        $feedback_id = intval($_POST['feedback_id']);

        global $wpdb;
        $result = $wpdb->insert(
            $this->table_name,
            [
                'feedback_id' => $feedback_id,
                'feedback_element' => $elementor_id,
                'element_type' => $element_type,
                'suggestion_value' => $suggestion_value,
                'created_at' => current_time('mysql')
            ]
        );

        if ($result) {
            wp_send_json_success();
        } else {
            wp_send_json_error(__('Failed to save feedback suggestion.', 'pittig-bakkie-feedback-plugin'));
        }
    }
}