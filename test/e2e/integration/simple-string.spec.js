describe('Simple String', () => {
  it('Select from list of predefined tokens and provide string values', () => {
    cy.visit('http://localhost:8080/simple-string.html');

    cy.verifyAssistantOptions(['First Name', 'Last Name']);

    cy.get('[data-test=lex-container] input').type('F');
    cy.verifyAssistantOptions(['First Name'], ['Last Name']);

    // Select First Name suggestion
    cy.get('[data-test=assistant-suggestion]').click();
    cy.get('[data-test=assistant-header]').should('contain', 'Enter a value');

    // Enter a value
    cy.get('[data-test=option-input]').type('Joe{enter}');

    cy.verifyToken(['First Name', 'Joe']);
  });
});
