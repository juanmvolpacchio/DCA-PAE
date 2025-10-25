const request = require("supertest");

process.env.DB_PATH = ":memory:";
const app = require("../app");

describe("Curves routes", () => {
  test("POST /curves crea una curva (201)", async () => {
    const body = {
      name: "CurveA",
      well: "W1",
      qo: 100,
      dea: 0.1,
      t: 10,
      user_id: 1,
    };
    const res = await request(app).post("/curves").send(body).expect(201);
    expect(res.body).toEqual(
      expect.objectContaining({ success: true, curve: expect.any(Object) })
    );
    expect(res.body.curve).toEqual(
      expect.objectContaining({ name: "CurveA", well: "W1" })
    );
  });

  test("POST /curves con duplicado devuelve 409", async () => {
    const body = {
      name: "CurveA",
      well: "W1",
      qo: 100,
      dea: 0.1,
      t: 10,
      user_id: 1,
    };
    await request(app).post("/curves").send(body).expect(409);
  });
});
