const request = require("supertest");

process.env.DB_PATH = ":memory:";
const app = require("../app");

describe("DELETE /curves", () => {
  test("devuelve 404 si no existe", async () => {
    await request(app)
      .delete("/curves")
      .query({ name: "Nope", well: "W0" })
      .expect(404);
  });

  test("elimina existente y devuelve 200", async () => {
    const body = {
      name: "CurveB",
      well: "W2",
      qo: 120,
      dea: 0.2,
      t: 12,
      user_id: 1,
    };
    await request(app).post("/curves").send(body).expect(201);

    await request(app)
      .delete("/curves")
      .query({ name: "CurveB", well: "W2" })
      .expect(200);
  });
});
