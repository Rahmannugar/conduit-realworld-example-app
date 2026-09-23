const request = require("supertest");
const app = require("../index");
const { sequelize } = require("../models");
const {
  addMembership,
  authHeader,
  createArticle,
  createCollection,
  createUser,
  resetDatabase,
} = require("./helpers");

describe("Article collections membership lookup", () => {
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
    const response = await request(app).get(
      "/api/articles/some-article/collections",
    );

    expect(response.status).toBe(401);
  });

  test("returns the authenticated user's collection ids for the article", async () => {
    const article = await createArticle({ slug: "target", userId: owner.id });
    const first = await createCollection(owner, { name: "First" });
    const second = await createCollection(owner, { name: "Second" });
    const other = await createCollection(owner, { name: "Other article" });

    await addMembership(first, article);
    await addMembership(second, article);
    await addMembership(other, await createArticle({ slug: "another" }));

    const response = await request(app)
      .get(`/api/articles/${article.slug}/collections`)
      .set(ownerAuth);

    expect(response.status).toBe(200);
    expect(response.body.collectionIds.sort()).toEqual(
      [first.id, second.id].sort(),
    );
  });

  test("does not leak another user's collections", async () => {
    const article = await createArticle({ slug: "target", userId: owner.id });
    const owners = await createCollection(owner, { name: "Owner" });
    await addMembership(owners, article);

    const response = await request(app)
      .get(`/api/articles/${article.slug}/collections`)
      .set(strangerAuth);

    expect(response.status).toBe(200);
    expect(response.body.collectionIds).toEqual([]);
  });

  test("returns an empty list when the article is in no collection", async () => {
    const article = await createArticle({ slug: "lonely", userId: owner.id });

    const response = await request(app)
      .get(`/api/articles/${article.slug}/collections`)
      .set(ownerAuth);

    expect(response.status).toBe(200);
    expect(response.body.collectionIds).toEqual([]);
  });

  test("returns 404 for an unknown article", async () => {
    const response = await request(app)
      .get("/api/articles/does-not-exist/collections")
      .set(ownerAuth);

    expect(response.status).toBe(404);
  });
});
