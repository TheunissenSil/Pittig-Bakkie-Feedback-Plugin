<?php

namespace PittigBakkieFeedbackPlugin\Core;

class Plugin {
    public function init() {
        $this->load_dependencies();
    }

    private function load_dependencies() {
        // Load the admin and frontend classes
        require_once plugin_dir_path(dirname(__FILE__)) . 'Admin/Admin.php';
        require_once plugin_dir_path(dirname(__FILE__)) . 'Frontend/Frontend.php';

        // Initialize the admin and frontend classes
        $admin = new \PittigBakkieFeedbackPlugin\Admin\Admin();
        $admin->init();

        $frontend = new \PittigBakkieFeedbackPlugin\Frontend\Frontend();
        $frontend->init();
    }
}