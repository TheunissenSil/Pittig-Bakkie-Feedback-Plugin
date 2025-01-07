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
            wp_enqueue_style(
                'pittig-bakkie-feedback-plugin-frontend',
                plugin_dir_url(__FILE__) . '../../assets/css/public.css',
                [],
                '1.0.0'
            );

            wp_enqueue_script(
                'pittig-bakkie-feedback-plugin-frontend',
                plugin_dir_url(__FILE__) . '../../assets/js/public.js',
                [],
                '1.0.0',
                true
            );

            wp_localize_script('pittig-bakkie-feedback-plugin-frontend', 'pittigBakkieFeedbackPlugin', [
                'ajaxUrl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('get_feedback_nonce'),
            ]);            
        });
    }

    public function render_feedback_mode_button() {
        require_once plugin_dir_path(__FILE__) . 'partials/FeedbackModeButton.php';
        error_log('Feedback mode button rendered');
    }

    public function render_feedback_sidebar() {
        require_once plugin_dir_path(__FILE__) . 'partials/FeedbackSidebar.php';
    }
}