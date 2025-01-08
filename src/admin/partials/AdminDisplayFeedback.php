<div class="wrap">
    <h1><?php esc_html_e('Feedback', 'pittig-bakkie-feedback-plugin'); ?></h1>
    <h2 class="nav-tab-wrapper">
        <a href="#pending" class="nav-tab nav-tab-active" data-status="pending"><?php esc_html_e('Pending', 'pittig-bakkie-feedback-plugin'); ?></a>
        <a href="#approved" class="nav-tab" data-status="approved"><?php esc_html_e('Approved', 'pittig-bakkie-feedback-plugin'); ?></a>
        <a href="#rejected" class="nav-tab" data-status="rejected"><?php esc_html_e('Rejected', 'pittig-bakkie-feedback-plugin'); ?></a>
    </h2>
    <table class="wp-list-table widefat fixed striped">
        <thead>
            <tr>
                <th><?php esc_html_e('Username', 'pittig-bakkie-feedback-plugin'); ?></th>
                <th><?php esc_html_e('Comment', 'pittig-bakkie-feedback-plugin'); ?></th>
                <th><?php esc_html_e('Status', 'pittig-bakkie-feedback-plugin'); ?></th>
                <th><?php esc_html_e('Actions', 'pittig-bakkie-feedback-plugin'); ?></th>
            </tr>
        </thead>
        <tbody id="feedback-list">
            <!-- Feedback items will be populated here by JavaScript -->
        </tbody>
    </table>
</div>