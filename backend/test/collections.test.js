const request = require("supertest");
const app = require("../index");
const { sequelize } = require("../models");
const {
  authHeader,
  createArticle,
  createCollection,
  createUser,
  resetDatabase,
} = require("./helpers");

const countQueries = async (run) => {
  const queries = [];
  const originalLogging = sequelize.options.logging;

  sequelize.options.logging = (sql) => queries.push(sql);

  try {
    await run();
  } finally {
    sequelize.options.logging = originalLogging;
  }

  return queries.length;
};

describe("Collections API", () => {
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

  describe("authentication", () => {
    test.each([
      ["get", "/api/collections", 401],
      ["post", "/api/collections", 401],
      ["get", "/api/collections/1", 401],
      ["patch", "/api/collections/1", 401],
      ["delete", "/api/collections/1", 401],
      ["post", "/api/collections/1/articles", 401],
      ["delete", "/api/collections/1/articles/some-slug", 401],
    ])("%s %s without a token is rejected", async (method, url, status) => {
      const response = await request(app)[method](url);

      expect(response.status).toBe(status);
      expect(response.body.errors.body).toBeDefined();
    });
  });

  describe("create", () => {
    test("creates a collection with name and optional description", async () => {
      const response = await request(app)
        .post("/api/collections")
        .set(ownerAuth)
        .send({ collection: { name: "Reading", description: "later" } });

      expect(response.status).toBe(201);
      expect(response.body.collection).toMatchObject({
        name: "Reading",
        description: "later",
        articlesCount: 0,
      });
      expect(response.body.collection.id).toBeDefined();
      expect(response.body.collection.userId).toBeUndefined();
    });

    test("requires a name", async () => {
      const response = await request(app)
        .post("/api/collections")
        .set(ownerAuth)
        .send({ collection: { description: "no name" } });

      expect(response.status).toBe(422);
    });

    test("rejects a duplicate name for the same user", async () => {
      await createCollection(owner, { name: "Duplicated" });

      const response = await request(app)
        .post("/api/collections")
        .set(ownerAuth)
        .send({ collection: { name: "Duplicated" } });

      expect(response.status).toBe(409);
    });

    test("rejects a duplicate name that differs only by case", async () => {
      await createCollection(owner, { name: "Reading" });

      const response = await request(app)
        .post("/api/collections")
        .set(ownerAuth)
        .send({ collection: { name: "reading" } });

      expect(response.status).toBe(409);
    });

    test("allows the same name for a different user", async () => {
      await createCollection(owner, { name: "Shared" });

      const response = await request(app)
        .post("/api/collections")
        .set(strangerAuth)
        .send({ collection: { name: "Shared" } });

      expect(response.status).toBe(201);
    });

    test("allows a different-case name for a different user", async () => {
      await createCollection(owner, { name: "Shared" });

      const response = await request(app)
        .post("/api/collections")
        .set(strangerAuth)
        .send({ collection: { name: "shared" } });

      expect(response.status).toBe(201);
    });
  });

  describe("list", () => {
    test("returns only the authenticated user's collections", async () => {
      await createCollection(owner, { name: "Owner only" });
      await createCollection(stranger, { name: "Stranger only" });

      const response = await request(app)
        .get("/api/collections")
        .set(ownerAuth);

      expect(response.status).toBe(200);
      expect(response.body.collections.map((item) => item.name)).toEqual([
        "Owner only",
      ]);
    });

    test("paginates with an opaque cursor", async () => {
      for (const name of ["One", "Two", "Three"]) {
        await createCollection(owner, { name });
      }

      const first = await request(app)
        .get("/api/collections?limit=2")
        .set(ownerAuth);

      expect(first.status).toBe(200);
      expect(first.body.collections).toHaveLength(2);
      expect(first.body.nextCursor).toBeTruthy();

      const second = await request(app)
        .get(`/api/collections?limit=2&cursor=${first.body.nextCursor}`)
        .set(ownerAuth);

      expect(second.status).toBe(200);
      expect(second.body.collections).toHaveLength(1);
      expect(second.body.nextCursor).toBeNull();

      const ids = [
        ...first.body.collections,
        ...second.body.collections,
      ].map((item) => item.id);

      expect(new Set(ids).size).toBe(3);
    });

    test("rejects an invalid cursor and limit", async () => {
      const badCursor = await request(app)
        .get("/api/collections?cursor=not-a-cursor")
        .set(ownerAuth);
      const badLimit = await request(app)
        .get("/api/collections?limit=0")
        .set(ownerAuth);

      expect(badCursor.status).toBe(400);
      expect(badLimit.status).toBe(400);
    });

    test("does not issue more queries as the number of collections grows", async () => {
      await createCollection(owner, { name: "Solo" });

      const withOne = await countQueries(() =>
        request(app).get("/api/collections").set(ownerAuth),
      );

      for (const name of ["A", "B", "C", "D"]) {
        await createCollection(owner, { name });
      }

      const withFive = await countQueries(() =>
        request(app).get("/api/collections").set(ownerAuth),
      );

      expect(withFive).toBe(withOne);
    });
  });

  describe("detail", () => {
    test("returns the collection and its saved articles", async () => {
      const collection = await createCollection(owner, { name: "Saved" });
      const article = await createArticle({ slug: "saved-1", userId: owner.id });
      await request(app)
        .post(`/api/collections/${collection.id}/articles`)
        .set(ownerAuth)
        .send({ slug: article.slug });

      const response = await request(app)
        .get(`/api/collections/${collection.id}`)
        .set(ownerAuth);

      expect(response.status).toBe(200);
      expect(response.body.collection.articlesCount).toBe(1);
      expect(response.body.articles.map((item) => item.slug)).toEqual([
        "saved-1",
      ]);
      expect(response.body.articles[0].favorited).toBe(false);
      expect(response.body.articles[0].favoritesCount).toBe(0);
    });

    test("does not expose another user's collection", async () => {
      const collection = await createCollection(owner, { name: "Private" });

      const response = await request(app)
        .get(`/api/collections/${collection.id}`)
        .set(strangerAuth);

      expect(response.status).toBe(404);
    });
  });

  describe("update", () => {
    test("renames and edits the description", async () => {
      const collection = await createCollection(owner, {
        name: "Before",
        description: "old",
      });

      const response = await request(app)
        .patch(`/api/collections/${collection.id}`)
        .set(ownerAuth)
        .send({ collection: { name: "After", description: "new" } });

      expect(response.status).toBe(200);
      expect(response.body.collection).toMatchObject({
        name: "After",
        description: "new",
      });
    });

    test("rejects an empty update", async () => {
      const collection = await createCollection(owner, { name: "Noop" });

      const response = await request(app)
        .patch(`/api/collections/${collection.id}`)
        .set(ownerAuth)
        .send({ collection: {} });

      expect(response.status).toBe(422);
    });

    test("rejects renaming to an existing name", async () => {
      await createCollection(owner, { name: "Existing" });
      const collection = await createCollection(owner, { name: "Other" });

      const response = await request(app)
        .patch(`/api/collections/${collection.id}`)
        .set(ownerAuth)
        .send({ collection: { name: "Existing" } });

      expect(response.status).toBe(409);
    });

    test("rejects renaming to an existing name that differs only by case", async () => {
      await createCollection(owner, { name: "Existing" });
      const collection = await createCollection(owner, { name: "Other" });

      const response = await request(app)
        .patch(`/api/collections/${collection.id}`)
        .set(ownerAuth)
        .send({ collection: { name: "existing" } });

      expect(response.status).toBe(409);
    });

    test("cannot modify another user's collection", async () => {
      const collection = await createCollection(owner, { name: "Mine" });

      const response = await request(app)
        .patch(`/api/collections/${collection.id}`)
        .set(strangerAuth)
        .send({ collection: { name: "Yours now" } });

      expect(response.status).toBe(404);
    });
  });

  describe("delete", () => {
    test("deletes the collection without deleting its articles", async () => {
      const collection = await createCollection(owner, { name: "Temp" });
      const article = await createArticle({ slug: "keep-me", userId: owner.id });
      await request(app)
        .post(`/api/collections/${collection.id}/articles`)
        .set(ownerAuth)
        .send({ slug: article.slug });

      const deletion = await request(app)
        .delete(`/api/collections/${collection.id}`)
        .set(ownerAuth);

      expect(deletion.status).toBe(204);
      expect(await article.reload()).toBeTruthy();
    });

    test("cannot delete another user's collection", async () => {
      const collection = await createCollection(owner, { name: "Mine" });

      const response = await request(app)
        .delete(`/api/collections/${collection.id}`)
        .set(strangerAuth);

      expect(response.status).toBe(404);
    });
  });

  describe("membership", () => {
    test("adds an article by slug and rejects duplicates", async () => {
      const collection = await createCollection(owner, { name: "Mine" });
      const article = await createArticle({ slug: "dupe", userId: owner.id });

      const first = await request(app)
        .post(`/api/collections/${collection.id}/articles`)
        .set(ownerAuth)
        .send({ slug: article.slug });
      const duplicate = await request(app)
        .post(`/api/collections/${collection.id}/articles`)
        .set(ownerAuth)
        .send({ slug: article.slug });

      expect(first.status).toBe(201);
      expect(duplicate.status).toBe(409);
    });

    test("requires a slug", async () => {
      const collection = await createCollection(owner, { name: "Mine" });

      const response = await request(app)
        .post(`/api/collections/${collection.id}/articles`)
        .set(ownerAuth)
        .send({});

      expect(response.status).toBe(422);
    });

    test("rejects an unknown article", async () => {
      const collection = await createCollection(owner, { name: "Mine" });

      const response = await request(app)
        .post(`/api/collections/${collection.id}/articles`)
        .set(ownerAuth)
        .send({ slug: "does-not-exist" });

      expect(response.status).toBe(404);
    });

    test("cannot add to another user's collection", async () => {
      const collection = await createCollection(owner, { name: "Mine" });
      const article = await createArticle({ slug: "target", userId: owner.id });

      const response = await request(app)
        .post(`/api/collections/${collection.id}/articles`)
        .set(strangerAuth)
        .send({ slug: article.slug });

      expect(response.status).toBe(404);
    });

    test("removes an article and is idempotent-safe on repeat", async () => {
      const collection = await createCollection(owner, { name: "Mine" });
      const article = await createArticle({ slug: "remove-me", userId: owner.id });
      await request(app)
        .post(`/api/collections/${collection.id}/articles`)
        .set(ownerAuth)
        .send({ slug: article.slug });

      const removal = await request(app)
        .delete(`/api/collections/${collection.id}/articles/${article.slug}`)
        .set(ownerAuth);
      const repeat = await request(app)
        .delete(`/api/collections/${collection.id}/articles/${article.slug}`)
        .set(ownerAuth);

      expect(removal.status).toBe(204);
      expect(repeat.status).toBe(404);
      expect(await article.reload()).toBeTruthy();
    });
  });
});
