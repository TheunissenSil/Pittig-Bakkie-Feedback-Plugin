describe('Add Suggestion to Page', () => {
    it('Should add a feedback suggestion to the page', () => {
        cy.visit('/wp-login.php');
        cy.get('#user_login').type('admin');
        cy.get('#user_pass').type('admin'); 
        cy.get('#wp-submit').click();

        cy.visit('/');

        cy.get('button#enable-feedback-mode').click(); 

        cy.get('.feedback-item[data-id="7"]').click();

        cy.get('button.add-to-page').should('exist').click();

        cy.get('.page-content').should('contain.text', 'Feedback Suggestion'); 
    });
});