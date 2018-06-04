describe('Simple String', () => {
  it('Select from list of predefined tokens and provide string values', () => {
    cy.visit('http://localhost:8080/simple-string.html');

    // Verify dropdown options
    cy.get('[data-test=assistant-suggestion]').should('contain', 'First Name');
    cy.get('[data-test=assistant-suggestion]').should('contain', 'Last Name');

    // Typing a matching value should filter the dropdown list
    cy.get('[data-test=lex-container] input').type('F');
    cy.get('[data-test=assistant-suggestion]').should('contain', 'First Name');
    cy.get('[data-test=assistant-suggestion]').should('not.contain', 'Last Name');
  });
});
