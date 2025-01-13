describe('Mobile modus', () => {
    it('should check if it goes into desktop modus', () => {
        cy.visit('/');

        cy.get('button#enable-feedback-mode').click();

        cy.get('input#access-key-input').type('OVgDXGAeJ7FQJmpamTC6xI7Wd6VCxkGt'); 
        
        cy.get('button[type="submit"]').click(); 

        cy.get('body').should('have.class', 'feedback-mode-active');

        cy.wait(1000);

        cy.get('#scale-to-phone').click().then (() => {
            cy.get('body').find('iframe#phone-size-iframe').should('exist');
        });

        cy.get('#scale-to-phone').should('have.text', 'Change to desktop');

        cy.get('#scale-to-phone').click();

        cy.get('div[data-elementor-type="wp-page"]').should('exist');

    });
});