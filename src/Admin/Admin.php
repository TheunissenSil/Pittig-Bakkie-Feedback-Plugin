<?php

namespace PittigBakkieFeedbackPlugin\Admin;

class Admin {
    public function init() {
        // Admin initialization code
        add_action('admin_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('admin_menu', [$this, 'add_admin_pages']);
    }

    public function enqueue_scripts($hook_suffix) {
        // Check if the current page is the Feedback or Access Keys page
        if ($hook_suffix === 'toplevel_page_feedback') {
            // Enqueue style
            wp_enqueue_style(
                'pittig-bakkie-feedback-plugin-admin',
                plugin_dir_url(__FILE__) . '../../assets/css/admin.css',
                [],
                '1.0.0'
            );

            // Enqueue script for Feedback page
            wp_enqueue_script(
                'pittig-bakkie-feedback-plugin-admin-feedback',
                plugin_dir_url(__FILE__) . '../../assets/js/admin/admin-feedback.js',
                [],
                '1.0.0',
                true
            );

            // Localize script
            wp_localize_script('pittig-bakkie-feedback-plugin-admin-feedback', 'pittigBakkieFeedbackPlugin', [
                'ajaxurl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('feedback_management_nonce'),
            ]);
        } elseif ($hook_suffix === 'feedback_page_access-keys') {
            // Enqueue style
            wp_enqueue_style(
                'pittig-bakkie-feedback-plugin-admin',
                plugin_dir_url(__FILE__) . '../../assets/css/admin.css',
                [],
                '1.0.0'
            );

            // Enqueue script for Access Keys page
            wp_enqueue_script(
                'pittig-bakkie-feedback-plugin-admin-access-keys',
                plugin_dir_url(__FILE__) . '../../assets/js/admin/admin-access-keys.js',
                [],
                '1.0.0',
                true
            );

            // Localize script
            wp_localize_script('pittig-bakkie-feedback-plugin-admin-access-keys', 'pittigBakkieFeedbackPlugin', [
                'ajaxurl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('keys_management_nonce'),
            ]);
        }
    }

    public function add_admin_pages() {
        // Add feedback tab
        add_menu_page(
            __('Feedback', 'pittig-bakkie-feedback-plugin'),
            __('Feedback', 'pittig-bakkie-feedback-plugin'),
            'manage_options',
            'feedback',
            [$this, 'render_feedback_page'],
            'dashicons-feedback',
            6
        );

        // Add Access Keys Sub Tab
        add_submenu_page(
            'feedback',
            __('Access Keys', 'pittig-bakkie-feedback-plugin'),
            __('Access Keys', 'pittig-bakkie-feedback-plugin'),
            'manage_options',
            'access-keys',
            [$this, 'render_access_keys_page']
        );
    }

    public function render_feedback_page() {
        require_once plugin_dir_path(__FILE__) . 'partials/AdminDisplayFeedback.php';
    }

    public function render_access_keys_page() {
        require_once plugin_dir_path(__FILE__) . 'partials/AdminDisplayAccessKeys.php';
    }
}