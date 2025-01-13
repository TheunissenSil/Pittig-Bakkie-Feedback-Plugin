describe('Feedback Suggestions', () => {
    it('should add a feedback suggestion', () => {
        cy.visit('/');

        cy.get('button#enable-feedback-mode').click();

        cy.get('input#access-key-input').type('OVgDXGAeJ7FQJmpamTC6xI7Wd6VCxkGt'); 

        cy.get('button[type="submit"]').click(); 

        cy.get('body').should('have.class', 'feedback-mode-active');

        cy.get('.elementor-element-523c7dc').click();

        cy.get('.elementor-element-523c7dc').should('have.class', 'permanent-highlight');

        cy.get('button.show-suggestion').click();

        cy.get('div.tox-tinymce').should('exist');
    });
});