describe('Access Keys', () => {
    it('Generate a access key with the username tester 1', () => {
        cy.visit('/wp-login.php');
        cy.get('#user_login').type('admin');
        cy.get('#user_pass').type('admin'); 
        cy.get('#wp-submit').click();

        cy.visit('/wp-admin/admin.php?page=access-keys');

        cy.get('input[id="username"]').type('Tester 1');

        cy.get('button[id="generate-key-button"]').click();

        cy.get('tbody#access-keys-table-body').contains('td', 'Tester 1').should('exist');
    });
});