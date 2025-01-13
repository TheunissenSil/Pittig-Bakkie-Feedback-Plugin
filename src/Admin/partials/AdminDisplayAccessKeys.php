<div>
    <h1><?php esc_html_e('Access Keys Management', 'pittig-bakkie-feedback-plugin'); ?></h1>

    <div id="generate-key-form">
        <h2><?php esc_html_e('Generate New Access Key', 'pittig-bakkie-feedback-plugin'); ?></h2>
        <input type="text" id="username" placeholder="<?php esc_attr_e('Enter username', 'pittig-bakkie-feedback-plugin'); ?>" />
        <button id="generate-key-button" class="button button-primary"><?php esc_html_e('Generate Key', 'pittig-bakkie-feedback-plugin'); ?></button>
    </div>

    <div id="access-keys-list">
        <h2><?php esc_html_e('Existing Access Keys', 'pittig-bakkie-feedback-plugin'); ?></h2>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th><?php esc_html_e('Username', 'pittig-bakkie-feedback-plugin'); ?></th>
                    <th><?php esc_html_e('Created At', 'pittig-bakkie-feedback-plugin'); ?></th>
                    <th><?php esc_html_e('Actions', 'pittig-bakkie-feedback-plugin'); ?></th>
                </tr>
            </thead>
            <tbody id="access-keys-table-body">
            </tbody>
        </table>
    </div>
</div>
