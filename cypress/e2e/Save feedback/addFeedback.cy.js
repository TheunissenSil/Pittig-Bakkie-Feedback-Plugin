describe('Save Feedback', () => {
    it('Shoud check if you can add / save feedback', () => {
        cy.visit('/');

        cy.get('button#enable-feedback-mode').click();

        cy.get('input#access-key-input').type('OVgDXGAeJ7FQJmpamTC6xI7Wd6VCxkGt'); 

        cy.get('button[type="submit"]').click(); 

        cy.get('body').should('have.class', 'feedback-mode-active');

        cy.wait(1000);

        cy.get('.elementor-element-7b2135d7').click();

        cy.get('.elementor-element-7b2135d7').should('have.class', 'permanent-highlight');

        cy.get('.feedback-item.new-feedback[data-elementor-id="7b2135d7"]').within(() => {
            cy.get('.edit-feedback-textarea').type('This is a test feedback');

            cy.get('.save-feedback').click();
        });

        cy.wait(1000);

        cy.get('.feedback-item[data-elementor-id="7b2135d7"]').should('exist').click();

        cy.get('.feedback-item[data-elementor-id="7b2135d7"] .editable-feedback').should('have.text', 'This is a test feedback');
    });
});