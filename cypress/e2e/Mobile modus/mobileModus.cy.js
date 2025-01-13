describe('Mobile modus', () => {
    it('Should check if it goes into mobile modus', () => {
        // Step 1: Navigate to home page
        cy.visit('/');

        // Step 2: Click on "Enable feedback mode"
        cy.get('button#enable-feedback-mode').click(); // Adjust the selector if necessary

        // Step 3: Fill in the access key
        cy.get('input#access-key-input').type('OVgDXGAeJ7FQJmpamTC6xI7Wd6VCxkGt'); // Replace 'your-access-key' with the actual access key

        // Step 4: Click on "Enable"
        cy.get('button[type="submit"]').click(); // Adjust the selector if necessary

        // Step 5: Wait until the body has the class 'feedback-mode-active'
        cy.get('body').should('have.class', 'feedback-mode-active');

        // Step 11: Wait a second
        cy.wait(1000);

        // Step 6: Click the element with the class 'elementor-element-7b2135d7'
        cy.get('#scale-to-phone').click();

        // Check if in the body is a iframe witht the id 'phone-size-iframe'
        cy.get('body').find('iframe#phone-size-iframe').should('exist');
    });
});