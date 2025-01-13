<div id="feedback-sidebar" class="feedback-sidebar">
    <img id="disable-feedback-mode" class="close-icon" src="<?php echo esc_url(plugins_url('assets/img/close-icon.png', dirname(__DIR__, 3) . '/my-feedback-plugin.php')); ?>" alt="<?php esc_attr_e('Close Icon', 'pittig-bakkie-feedback-plugin'); ?>">
    <div class="feedback-sidebar-content">
        <div class="feedback-sidebar-header">
            <img src="<?php echo esc_url(plugins_url('assets/img/feedback.png', dirname(__DIR__, 3) . '/my-feedback-plugin.php')); ?>" alt="<?php esc_attr_e('Feedback Icon', 'pittig-bakkie-feedback-plugin'); ?>">
        </div>
        <div class="feedback-sidebar-body">
            <div id="feedback-message" class="feedback-message" style="display: none;"></div>
            <div id="feedback-list"></div>
        </div>
        <div class="feedback-sidebar-footer">
            <button id="scale-to-phone" class="pb-button"><?php esc_html_e('Scale to Phone', 'pittig-bakkie-feedback-plugin'); ?></button>
        </div>
    </div>
</div>