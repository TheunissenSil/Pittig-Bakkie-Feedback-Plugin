describe('Add suggestions', () => {
    it('Should check if the add to page button exists', () => {
        cy.visit('/wp-login.php');
        cy.get('#user_login').type('admin');
        cy.get('#user_pass').type('admin'); 
        cy.get('#wp-submit').click();

        cy.visit('/');

        cy.get('button#enable-feedback-mode').click(); 

        cy.get('.feedback-item[data-id="7"]').click(); 

        cy.get('button.add-to-page').should('exist'); 
    });
});