describe('Feedback overview', () => {
    it('Check if you can see the feedback overview', () => {
        cy.visit('/wp-login.php');
        cy.get('#user_login').type('admin');
        cy.get('#user_pass').type('admin'); 
        cy.get('#wp-submit').click();

        cy.visit('/wp-admin/admin.php?page=feedback'); 

        cy.get('tbody#feedback-list').should('exist');
    });
});