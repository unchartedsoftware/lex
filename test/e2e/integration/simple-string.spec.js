describe('Simple String', () => {
  it('Select from list of predefined tokens and provide string values', () => {
    cy.visit('http://localhost:8080/simple-string.html');

    cy.verifyAssistantOptions(['First Name', 'Last Name']);

    cy.get('[data-test=lex-container] input').type('F');
    cy.verifyAssistantOptions(['First Name'], ['Last Name']);

    // Select First Name suggestion
    cy.get('[data-test=assistant-suggestion]').click();
    cy.get('[data-test=assistant-header]').should('contain', 'Enter a value');

    cy.enterValue('Joe');
    cy.verifyToken(1, ['First Name', 'Joe']);

    // Click search bar to get option to enter another token
    cy.get('[data-test=lex-container]').click();
    // This time use arrow keys to select Last Name suggestion
    cy.get('[data-test=lex-container] input').type('{downarrow}{downarrow}');
    // Last Name suggestion should be highlighted
    cy.get('[data-test=assistant-suggestion].active').should('contain', 'Last Name');
    // Select Last Name suggestion
    cy.get('[data-test=assistant-suggestion].active').click();
    cy.enterValue('Smith');
    cy.verifyToken(2, ['Last Name', 'Smith']);
  });
});
