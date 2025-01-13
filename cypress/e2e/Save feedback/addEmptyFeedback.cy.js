describe('Save feedback', () => {
    it('should check if you can add empty feedback', () => {
        cy.visit('/');

        cy.get('button#enable-feedback-mode').click();

        cy.get('input#access-key-input').type('OVgDXGAeJ7FQJmpamTC6xI7Wd6VCxkGt');

        cy.get('button[type="submit"]').click();

        cy.get('body').should('have.class', 'feedback-mode-active');

        cy.get('.elementor-element-6366a16d').click();

        cy.get('.elementor-element-6366a16d').should('have.class', 'permanent-highlight');

        cy.get('.feedback-item.new-feedback[data-elementor-id="6366a16d"]').within(() => {
            cy.get('.save-feedback').click();
        });

        cy.wait(1000);

        cy.get('.feedback-message').should('contain.text', 'Please enter your feedback'); 
    });
});