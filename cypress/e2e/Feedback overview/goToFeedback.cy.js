describe('Feedback overview', () => {
    it('should check if the go to feedback button works', () => {
        cy.visit('/wp-login.php');
        cy.get('#user_login').type('admin');
        cy.get('#user_pass').type('admin'); 
        cy.get('#wp-submit').click();

        cy.visit('/wp-admin/admin.php?page=feedback'); 

        cy.get('tbody#feedback-list').should('exist');

        cy.get('tbody#feedback-list').contains('tr', 'test').within(() => {
            cy.get('button[data-id="7"]').click();
        });

        cy.url().should('include', 's/?targetElementIs=');
    });
});