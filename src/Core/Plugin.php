<?php

namespace PittigBakkieFeedbackPlugin\Core;

class Plugin {
    public function init() {
        $this->load_dependencies();
    }

    private function load_dependencies() {
        // Load the handler classes
        require_once plugin_dir_path(dirname(__FILE__)) . 'core/Handlers/FeedbackHandler.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'core/Handlers/AccessKeyHandler.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'core/Handlers/FeedbackSuggestionHandler.php';

        // Load the admin and frontend classes
        require_once plugin_dir_path(dirname(__FILE__)) . 'admin/Admin.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'frontend/Frontend.php';

        // Initialize the handler classes
        $feedback_handler = new \PittigBakkieFeedbackPlugin\Core\Handlers\FeedbackHandler();
        $access_key_handler = new \PittigBakkieFeedbackPlugin\Core\Handlers\AccessKeyHandler();
        $feedback_suggestion_handler = new \PittigBakkieFeedbackPlugin\Core\Handlers\FeedbackSuggestionHandler();

        // Initialize the admin and frontend classes
        $admin = new \PittigBakkieFeedbackPlugin\Admin\Admin();
        $admin->init();

        $frontend = new \PittigBakkieFeedbackPlugin\Frontend\Frontend();
        $frontend->init();
    }
}