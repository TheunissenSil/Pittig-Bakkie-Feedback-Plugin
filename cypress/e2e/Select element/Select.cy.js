describe('Select elements', () => {
    it('Should check if you can select element', () => {
        cy.visit('/');

        cy.get('button#enable-feedback-mode').click(); 

        cy.get('input#access-key-input').type('OVgDXGAeJ7FQJmpamTC6xI7Wd6VCxkGt'); 

        cy.get('button[type="submit"]').click();

        cy.get('body').should('have.class', 'feedback-mode-active');

        cy.get('.elementor-element-7b2135d7').click();

        cy.get('.elementor-element-7b2135d7').should('have.class', 'permanent-highlight');
    });
});