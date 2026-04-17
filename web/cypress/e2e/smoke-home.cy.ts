describe("Smoke app", () => {
  it("abre o app e redireciona para login quando sem sessão", () => {
    cy.visit("/");
    cy.location("pathname", { timeout: 15000 }).should("eq", "/login");
    cy.contains("Entrar").should("be.visible");
  });
});
