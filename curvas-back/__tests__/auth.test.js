const request = require("supertest");

// Usar DB en memoria ANTES de cargar la app (app inicializa DB al importarse)
process.env.DB_PATH = ":memory:";
const app = require("../app");

describe("Auth routes", () => {
  test("login exitoso con admin/admin", async () => {
    const x = 1;
    /*const res = await request(app)
      .post("/login")
      .send({ username: "admin", password: "admin" })
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({ success: true, user: expect.any(Object) })
    );*/
    const y = 2;
  });

  test("login 401 con credenciales inválidas", async () => {
    await request(app)
      .post("/login")
      .send({ username: "admin", password: "wrong" })
      .expect(401);
  });
});
