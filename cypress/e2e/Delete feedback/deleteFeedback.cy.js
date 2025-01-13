describe('Delete feedback', () => {
    it('Should delete the feedback item', () => {
        cy.visit('/');

        cy.get('button#enable-feedback-mode').click();

        cy.get('input#access-key-input').type('OVgDXGAeJ7FQJmpamTC6xI7Wd6VCxkGt');

        cy.get('button[type="submit"]').click(); 

        cy.get('body').should('have.class', 'feedback-mode-active');

        cy.wait(1000);

        cy.get('.elementor-element-7b2135d7').click();

        cy.get('.elementor-element-7b2135d7').should('have.class', 'permanent-highlight');

        cy.get('.feedback-item[data-id="6"]').within(() => {
            cy.get('.delete-feedback').click();
        });

        cy.on('window:alert', (str) => {
            expect(str).to.match(/Deleted succesfully/);
        });
    });
});