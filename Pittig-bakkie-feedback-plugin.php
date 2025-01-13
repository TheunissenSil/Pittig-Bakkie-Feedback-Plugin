<?php
/**
 * Plugin Name: Pittig bakkie feedback plugin 
 * Description: This plugin allows the clients of Pittig bakkie to give feedback on their website.
 * Version: 1.0.0
 * Author: Pittig bakkie
 * Author URI: https://pittigbakkie.nl/
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

// Require classes
require_once plugin_dir_path(__FILE__) . 'src/core/Plugin.php';
require_once plugin_dir_path(__FILE__) . 'src/core/Database.php';

// Create database tables on plugin activation
function pittig_bakkie_feedback_plugin_activate() {
    $database = new \PittigBakkieFeedbackPlugin\Core\Database();
    $database->create_feedback_table();
    $database->create_access_keys_table();
    $database->create_feedback_suggestions_table();
}
register_activation_hook(__FILE__, 'pittig_bakkie_feedback_plugin_activate');

// Delete database tables on plugin uninstall
function pittig_bakkie_feedback_plugin_uninstall() {
    global $wpdb;

    // Table names
    $feedback_table = $wpdb->prefix . 'pittig_bakkie_feedback';
    $access_keys_table = $wpdb->prefix . 'pittig_bakkie_access_keys';
    $feedback_suggestions_table = $wpdb->prefix . 'pittig_bakkie_feedback_suggestions';

    // Drop tables
    $wpdb->query("DROP TABLE IF EXISTS $feedback_table");
    $wpdb->query("DROP TABLE IF EXISTS $access_keys_table");
    $wpdb->query("DROP TABLE IF EXISTS $feedback_suggestions_table");
}
register_uninstall_hook(__FILE__, 'pittig_bakkie_feedback_plugin_uninstall');

// Run the plugin
function run_plugin() {
    $plugin = new \PittigBakkieFeedbackPlugin\Core\Plugin();
    $plugin->init();
}
run_plugin();