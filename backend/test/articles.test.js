const request = require("supertest");
const app = require("../index");
const { Article, sequelize } = require("../models");
const {
  authHeader,
  createCollection,
  createUser,
  resetDatabase,
} = require("./helpers");

const articlePayload = (overrides = {}) => ({
  article: {
    title: "A New Article",
    description: "A description",
    body: "A body",
    tagList: [],
    ...overrides,
  },
});

describe("Create article with an optional collection", () => {
  let owner;
  let stranger;
  let ownerAuth;
  let strangerAuth;

  beforeEach(async () => {
    await resetDatabase();

    owner = await createUser({ username: "owner", email: "owner@example.com" });
    stranger = await createUser({
      username: "stranger",
      email: "stranger@example.com",
    });

    ownerAuth = await authHeader(owner);
    strangerAuth = await authHeader(stranger);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("requires authentication", async () => {
    const response = await request(app).post("/api/articles").send(articlePayload());

    expect(response.status).toBe(401);
  });

  test("creates an article without a collection (unchanged behaviour)", async () => {
    const response = await request(app)
      .post("/api/articles")
      .set(ownerAuth)
      .send(articlePayload());

    expect(response.status).toBe(201);
    expect(response.body.article.slug).toBe("a-new-article");
  });

  test("links the new article into the owner's collection", async () => {
    const collection = await createCollection(owner, { name: "Reading" });

    const response = await request(app)
      .post("/api/articles")
      .set(ownerAuth)
      .send(articlePayload({ collectionId: collection.id }));

    expect(response.status).toBe(201);

    const detail = await request(app)
      .get(`/api/collections/${collection.id}`)
      .set(ownerAuth);

    expect(detail.body.collection.articlesCount).toBe(1);
    expect(detail.body.articles.map((item) => item.slug)).toEqual([
      "a-new-article",
    ]);
  });

  test("rejects a collection owned by another user without creating the article", async () => {
    const collection = await createCollection(owner, { name: "Reading" });

    const response = await request(app)
      .post("/api/articles")
      .set(strangerAuth)
      .send(articlePayload({ collectionId: collection.id }));

    expect(response.status).toBe(404);
    expect(await Article.count()).toBe(0);
  });

  test("rejects a malformed collection id", async () => {
    const response = await request(app)
      .post("/api/articles")
      .set(ownerAuth)
      .send(articlePayload({ collectionId: "not-an-id" }));

    expect(response.status).toBe(404);
    expect(await Article.count()).toBe(0);
  });
});
