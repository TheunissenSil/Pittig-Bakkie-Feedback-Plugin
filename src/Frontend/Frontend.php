<?php 

namespace PittigBakkieFeedbackPlugin\Frontend;

class Frontend {
    public function init() {
        $this->enqueue_scripts();

        add_action('wp_footer', [$this, 'render_feedback_mode_button']);
        add_action('wp_footer', [$this, 'render_feedback_sidebar']);
    }

    public function enqueue_scripts() {
        add_action('wp_enqueue_scripts', function() {
            // Get stylesheet
            wp_enqueue_style(
                'pittig-bakkie-feedback-plugin-frontend',
                plugin_dir_url(__FILE__) . '../../assets/css/public.css',
                [],
                '1.0.0'
            );

            // Get script
            wp_enqueue_script(
                'pittig-bakkie-feedback-plugin-frontend',
                plugin_dir_url(__FILE__) . '../../assets/js/public.js',
                [],
                '1.0.0',
                true
            );

            // Add type="module" to the script
            add_filter('script_loader_tag', function($tag, $handle, $src) {
                if ($handle === 'pittig-bakkie-feedback-plugin-frontend') {
                    $tag = '<script type="module" src="' . esc_url($src) . '"></script>';
                }
                return $tag;
            }, 10, 3);

            // Start session if not already started
            if (!session_id()) {
                session_start();
            }

            // Localize script
            wp_localize_script('pittig-bakkie-feedback-plugin-frontend', 'pittigBakkieFeedbackPlugin', [
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('feedback_management_nonce'),
                'sessionUsername' => isset($_SESSION['feedback_username']) ? $_SESSION['feedback_username'] : ''
            ]);             
        });
    }

    public function render_feedback_mode_button() {
        require_once plugin_dir_path(__FILE__) . 'partials/FeedbackModeButton.php';
    }

    public function render_feedback_sidebar() {
        require_once plugin_dir_path(__FILE__) . 'partials/FeedbackSidebar.php';
    }
}