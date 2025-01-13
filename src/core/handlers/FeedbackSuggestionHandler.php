<?php

namespace PittigBakkieFeedbackPlugin\Core\Handlers;

use Elementor\Plugin;

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

        add_action('wp_ajax_edit_feedback_suggestion', array($this, 'edit_feedback_suggestion'));
        add_action('wp_ajax_nopriv_edit_feedback_suggestion', array($this, 'edit_feedback_suggestion'));

        add_action('wp_ajax_delete_feedback_suggestion', array($this, 'delete_feedback_suggestion'));
        add_action('wp_ajax_nopriv_delete_feedback_suggestion', array($this, 'delete_feedback_suggestion'));

        add_action('wp_ajax_add_to_page', array($this, 'add_to_page'));
    }

    // Validate nonce
    private function validate_nonce() {
        if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'feedback_management_nonce')) {
            wp_send_json_error(__('Unauthorized request.', 'pittig-bakkie-feedback-plugin'));
            return;
        }
    }

    // Check if the user has admin permissions
    private function check_admin_permissions() {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Unauthorized request.', 'pittig-bakkie-feedback-plugin'));
            exit;
        }
    }

    // Get feedback suggestion
    public function get_feedback_suggestion() {
        $this->validate_nonce();

        // Check if feedback ID is set
        if (!isset($_POST['feedback_id'])) {
            wp_send_json_error(__('Feedback ID is required.', 'pittig-bakkie-feedback-plugin'));
            return;
        }

        // Get feedback ID from request
        $feedback_id = sanitize_text_field($_POST['feedback_id']);

        global $wpdb;

        // Query feedback suggestions by feedback ID
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$this->table_name} WHERE feedback_id = %s",
            $feedback_id
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

        // Check if image is set
        if (!function_exists('wp_handle_upload')) {
            require_once(ABSPATH . 'wp-admin/includes/file.php');
        }

        $uploadedfile = $_FILES['image'];
        $upload_overrides = array('test_form' => false);

        // Upload the image
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

        // Check if required fields are set
        if (!isset($_POST['elementor_id']) || !isset($_POST['element_type']) || !isset($_POST['suggestion_value']) || !isset($_POST['feedback_id'])) {
            wp_send_json_error(__('Missing required fields.', 'pittig-bakkie-feedback-plugin'));
            return;
        }
        $elementor_id = sanitize_text_field($_POST['elementor_id']);
        $element_type = sanitize_text_field($_POST['element_type']);
        $suggestion_value = wp_kses_post($_POST['suggestion_value']); 
        $feedback_id = intval($_POST['feedback_id']);
        $post_id = intval($_POST['post_id']);

        global $wpdb;

        // Insert feedback suggestion into the database
        $result = $wpdb->insert(
            $this->table_name,
            [
                'feedback_id' => $feedback_id,
                'post_id' => $post_id,
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

    public function edit_feedback_suggestion() {
        $this->validate_nonce();

        // Check if required fields are set
        if (!isset($_POST['suggestion_id']) || !isset($_POST['suggestion_value'])) {
            wp_send_json_error(__('Missing required fields.', 'pittig-bakkie-feedback-plugin'));
            return;
        }

        $suggestion_id = intval($_POST['suggestion_id']);
        $suggestion_value = wp_kses_post($_POST['suggestion_value']); 

        global $wpdb;

        // Update feedback suggestion in the database
        $result = $wpdb->update(
            $this->table_name,
            [
                'suggestion_value' => $suggestion_value
            ],
            ['id' => $suggestion_id]
        );

        if ($result !== false) {
            wp_send_json_success();
        } else {
            wp_send_json_error(__('Failed to update feedback suggestion.', 'pittig-bakkie-feedback-plugin'));
        }
    }

    public function delete_feedback_suggestion() {
        $this->validate_nonce();

        // Check if required fields are set
        if (!isset($_POST['suggestion_id'])) {
            wp_send_json_error(__('Missing required fields.', 'pittig-bakkie-feedback-plugin'));
            return;
        }

        $suggestion_id = intval($_POST['suggestion_id']);

        global $wpdb;

        // Delete feedback suggestion from the database
        $result = $wpdb->delete(
            $this->table_name,
            ['id' => $suggestion_id]
        );

        if ($result !== false) {
            wp_send_json_success();
        } else {
            wp_send_json_error(__('Failed to delete feedback suggestion.', 'pittig-bakkie-feedback-plugin'));
        }
    }

    public function add_to_page() {
        $this->validate_nonce();

        $this->check_admin_permissions();
    
        global $wpdb;
    
        // Get suggestion ID from request
        $suggestion_id = intval($_POST['suggestion_id']);
    
        // Query suggestion data by ID
        $suggestion = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT feedback_element, suggestion_value, element_type, post_id 
                 FROM $this->table_name
                 WHERE feedback_id = %d",
                $suggestion_id
            ),
            ARRAY_A
        );
    
        // Get POST data
        $post_id = $suggestion['post_id'];
        $widget_id = $suggestion['feedback_element'];
        $new_content = $suggestion['suggestion_value'];
    
        // Load Elementor data for the post
        $elementor_data = Plugin::$instance->documents->get($post_id)->get_elements_data();
    
        // Recursively search and update widget content
        $updated_data = $this->update_widget_content($elementor_data, $widget_id, $new_content);
    
        // Save updated data back to Elementor
        Plugin::$instance->documents->get($post_id)->save(['elements' => $updated_data]);
    
        // Force Elementor to re-render the content
        Plugin::$instance->documents->get($post_id)->save(['status' => 'publish']);
    
        // Send JSON response with elementor_id and feedbackPage
        wp_send_json_success([
            'message' => 'Widget updated successfully!',
            'elementor_id' => $widget_id,
            'feedbackPage' => get_permalink($post_id)
        ]);
    }
    
    private function update_widget_content($elements, $widget_id, $new_content) {
        // Change the widget content
        foreach ($elements as &$element) {
            if ($element['id'] === $widget_id) {
                if ($element['elType'] === 'widget') {
                    if ($element['widgetType'] === 'text-editor') {
                        $element['settings']['editor'] = $new_content;
                    } elseif ($element['widgetType'] === 'image') {
                        // Register the image in the media library
                        $attachment_id = $this->register_image_in_media_library($new_content);	
                        $element['settings']['image']['id'] = $attachment_id;
                        $element['settings']['image']['url'] = $new_content; 
                    }
                }
            }
    
            if (!empty($element['elements'])) {
                $element['elements'] = $this->update_widget_content($element['elements'], $widget_id, $new_content);
            }
        }
    
        return $elements;
    }  
    
    private function register_image_in_media_library($image_url) {
        // Ensure required WordPress functions are available
        if (!function_exists('wp_insert_attachment')) {
            require_once(ABSPATH . 'wp-admin/includes/image.php');
        }
    
        // Get the upload directory
        $upload_dir = wp_upload_dir();
    
        // Parse the file name from the URL
        $file_name = basename($image_url);
    
        // Check if the file already exists in the uploads directory
        $file_path = $upload_dir['path'] . '/' . $file_name;
        if (!file_exists($file_path)) {
            // Download the file to the uploads directory
            $response = wp_remote_get($image_url);
            if (is_wp_error($response)) {
                return new WP_Error('download_error', 'Failed to download image.');
            }
    
            $file_data = wp_remote_retrieve_body($response);
            if (!$file_data) {
                return new WP_Error('file_data_error', 'Failed to retrieve file data.');
            }
    
            // Save the file locally
            file_put_contents($file_path, $file_data);
        }
    
        // Get file type and MIME type
        $file_type = wp_check_filetype($file_name, null);
    
        // Prepare attachment data
        $attachment_data = array(
            'guid'           => $upload_dir['url'] . '/' . $file_name, 
            'post_mime_type' => $file_type['type'],                  
            'post_title'     => sanitize_file_name($file_name),       
            'post_content'   => '',                                  
            'post_status'    => 'inherit',                           
        );
    
        // Insert attachment into Media Library
        $attachment_id = wp_insert_attachment($attachment_data, $file_path);
    
        if (!is_wp_error($attachment_id)) {
            // Generate metadata for attachment (e.g., thumbnails)
            $attachment_metadata = wp_generate_attachment_metadata($attachment_id, $file_path);
            wp_update_attachment_metadata($attachment_id, $attachment_metadata);
    
            return $attachment_id; 
        }
    
        return new WP_Error('attachment_error', 'Failed to register attachment.');
    }    
}