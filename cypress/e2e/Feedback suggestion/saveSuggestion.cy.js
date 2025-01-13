describe('Feedback suggestins', () => {
    it('Should save the feedback suggestions', () => {
        cy.visit('/');

        cy.get('button#enable-feedback-mode').click(); 

        cy.get('input#access-key-input').type('OVgDXGAeJ7FQJmpamTC6xI7Wd6VCxkGt'); 

        cy.get('button[type="submit"]').click(); 

        cy.get('body').should('have.class', 'feedback-mode-active');

        cy.get('.elementor-element-523c7dc').click();

        cy.get('.elementor-element-523c7dc').should('have.class', 'permanent-highlight');

        cy.get('button.show-suggestion').click();

        cy.get('div.tox-tinymce').should('exist');

        cy.get('iframe.tox-edit-area__iframe').then(($iframe) => {
            const $body = $iframe.contents().find('body');
            cy.wrap($body).find('p').type('This is a test suggestion');
        });

        cy.get('.save-feedback').click();

        cy.wait(1000);

        cy.get('.suggestion-item').should('contain.text', 'This is a test suggestion');
    });
});