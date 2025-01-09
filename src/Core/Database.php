<?php

namespace PittigBakkieFeedbackPlugin\Core;

class Database {
    // Create the feedback table
    public function create_feedback_table() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'pittig_bakkie_feedback';
        $charset_collate = $wpdb->get_charset_collate();
    
        $sql = "CREATE TABLE $table_name (
            id INT AUTO_INCREMENT PRIMARY KEY,
            elementor_id VARCHAR(255) NOT NULL,
            element_feedback_page VARCHAR(255) NOT NULL,
            feedback_comment TEXT NOT NULL,
            admin_comment TEXT,
            username VARCHAR(255),
            display_size VARCHAR(255),
            status VARCHAR(50) DEFAULT 'Open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) $charset_collate;";
    
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }    

    // Create the access keys table
    public function create_access_keys_table() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'pittig_bakkie_access_keys';
        $charset_collate = $wpdb->get_charset_collate();
    
        $sql = "CREATE TABLE $table_name (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            access_key TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) $charset_collate;";
    
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }    

    // Create the feedback suggestions table
    public function create_feedback_suggestions_table() {
        global $wpdb;
        $feedback_table_name = $wpdb->prefix . 'pittig_bakkie_feedback';
        $table_name = $wpdb->prefix . 'pittig_bakkie_feedback_suggestions';
        $charset_collate = $wpdb->get_charset_collate();
    
        $sql = "CREATE TABLE $table_name (
            id INT AUTO_INCREMENT PRIMARY KEY,
            feedback_id INT NOT NULL,
            element_type VARCHAR(50) NOT NULL,
            suggestion_value TEXT NOT NULL,
            feedback_element VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (feedback_id) REFERENCES $feedback_table_name(id) ON DELETE CASCADE
        ) $charset_collate;";
    
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }    
}