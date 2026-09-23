const request = require("supertest");
const app = require("../index");
const { sequelize } = require("../models");
const { createUser, resetDatabase } = require("./helpers");

describe("Users API login", () => {
  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await resetDatabase();
    await createUser({
      username: "owner",
      email: "owner@example.com",
      password: "password123",
    });
  });

  test("rejects an unknown email with a generic message", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ user: { email: "missing@example.com", password: "password123" } });

    expect(response.status).toBe(401);
    expect(response.body.errors.body).toEqual(["Invalid email or password"]);
  });

  test("rejects a wrong password with the same generic message", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ user: { email: "owner@example.com", password: "wrong-password" } });

    expect(response.status).toBe(401);
    expect(response.body.errors.body).toEqual(["Invalid email or password"]);
  });

  test("rejects a missing payload with the same generic message", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ user: { email: "owner@example.com" } });

    expect(response.status).toBe(401);
    expect(response.body.errors.body).toEqual(["Invalid email or password"]);
  });

  test("logs in with valid credentials", async () => {
    const response = await request(app)
      .post("/api/users/login")
      .send({ user: { email: "owner@example.com", password: "password123" } });

    expect(response.status).toBe(200);
    expect(response.body.user.token).toBeDefined();
  });
});
