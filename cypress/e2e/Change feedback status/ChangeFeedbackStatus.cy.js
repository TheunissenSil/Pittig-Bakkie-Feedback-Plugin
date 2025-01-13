describe('Change feedback status', () => {
    it('should change the feedback status', () => {
        cy.visit('/wp-login.php');
        cy.get('#user_login').type('admin');
        cy.get('#user_pass').type('admin'); 
        cy.get('#wp-submit').click();

        cy.visit('/wp-admin/admin.php?page=feedback');

        cy.get('tbody#feedback-list').should('exist');

        cy.get('tbody#feedback-list').contains('tr', 'test').within(() => {
            cy.get('.feedback-status').select('approved'); 

            cy.get('a#approved').click();
        });

        cy.get('body').contains('.feedback-item', 'test').should('exist');
        
    });
});