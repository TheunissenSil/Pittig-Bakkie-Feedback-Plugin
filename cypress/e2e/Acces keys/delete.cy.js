describe('Access Keys', () => {
    it('Delete the acces key', () => {
        cy.visit('/wp-login.php');
        cy.get('#user_login').type('admin');
        cy.get('#user_pass').type('admin'); 
        cy.get('#wp-submit').click();

        cy.visit('/wp-admin/admin.php?page=access-keys');
        
        cy.get('tbody#access-keys-table-body').contains('td', 'Tester 1').should('exist');

        cy.get('tbody#access-keys-table-body').contains('tr', 'Tester 1').within(() => {
            cy.get('button[data-action="delete"]').click();
        });

        cy.on('window:alert', (str) => {
            expect(str).to.match(/Access key deleted./);
        });
    });
});