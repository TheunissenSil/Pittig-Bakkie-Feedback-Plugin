describe('Mobile modus', () => {
    it('should check if the basic functions work on mobile modus', () => {
        cy.visit('/');

        cy.get('button#enable-feedback-mode').click(); 

        cy.get('input#access-key-input').type('OVgDXGAeJ7FQJmpamTC6xI7Wd6VCxkGt');

        cy.get('button[type="submit"]').click(); 

        cy.get('body').should('have.class', 'feedback-mode-active');

        cy.get('#scale-to-phone').click();

        cy.get('iframe#phone-size-iframe').should('exist');

        cy.get('iframe#phone-size-iframe').then(($iframe) => {
            const $body = $iframe.contents().find('body');

            cy.wrap($body).find('.elementor-element-7b2135d7').click();

            cy.wrap($body).find('.feedback-item.new-feedback[data-elementor-id="7b2135d7"]').within(() => {
                cy.get('.edit-feedback-textarea').type('This is a test feedback in mobile mode');
                cy.get('.save-feedback').click();
            });

            cy.wait(1000);

            cy.wrap($body).find('.feedback-item[data-elementor-id="7b2135d7"] .editable-feedback').should('have.text', 'This is a test feedback in mobile mode');
        });
    });
});