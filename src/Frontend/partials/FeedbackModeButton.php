<div class="feedback-mode-button-wrapper">
    <button id="enable-feedback-mode" class="feedback-mode-button pb-button">
        <?php esc_html_e('Enable Feedback Mode', 'pittig-bakkie-feedback-plugin'); ?>
    </button>
    <form id="access-key-form" class="access-key-form" style="display: none;">
        <input type="text" id="access-key-input" placeholder="<?php esc_attr_e('Enter your access key', 'pittig-bakkie-feedback-plugin'); ?>" />
        <button type="submit"><?php esc_html_e('Submit', 'pittig-bakkie-feedback-plugin'); ?></button>
        <p id="access-key-message" class="access-key-message" style="display: none;"></p>
    </form>
</div>
