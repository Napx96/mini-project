describe('EMS Smoke Tests', () => {
  it('successfully loads the login page', () => {
    cy.visit('http://localhost:3000/login'); // Adjust URL if needed
    cy.contains('Login');
    cy.get('input[name=email]').should('be.visible');
    cy.get('input[name=password]').should('be.visible');
  });

  it('allows an admin to log in and redirects to dashboard', () => {
    cy.visit('http://localhost:3000/login');
    cy.get('input[name=email]').type('admin@ems.com');
    cy.get('input[name=password]').type('admin123');
    cy.get('button[type=submit]').click();
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard');
  });
});