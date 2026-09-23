const {
  Article,
  Collection,
  User,
  sequelize,
} = require("../models");
const { bcryptHash } = require("../helper/bcrypt");
const { jwtSign } = require("../helper/jwt");

const resetDatabase = async () => {
  const tables = await sequelize.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    { type: sequelize.QueryTypes.SELECT },
  );

  if (tables.length === 0) return;

  const quoted = tables.map((row) => `"${row.tablename}"`).join(", ");

  await sequelize.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`);
};

const createUser = async (overrides = {}) => {
  return User.create({
    username: overrides.username || "user1",
    email: overrides.email || "user1@example.com",
    password: await bcryptHash(overrides.password || "password123"),
  });
};

const createArticle = async (overrides = {}) => {
  return Article.create({
    slug: overrides.slug || "article-1",
    title: overrides.title || "Article 1",
    description: overrides.description || "A description",
    body: overrides.body || "A body",
    userId: overrides.userId,
  });
};

const createCollection = async (user, overrides = {}) => {
  return Collection.create({
    userId: user.id,
    name: overrides.name || "My Collection",
    description: overrides.description,
  });
};

const authHeader = async (user) => {
  const token = await jwtSign({ username: user.username, email: user.email });

  return { Authorization: `Token ${token}` };
};

module.exports = {
  authHeader,
  createArticle,
  createCollection,
  createUser,
  resetDatabase,
};
