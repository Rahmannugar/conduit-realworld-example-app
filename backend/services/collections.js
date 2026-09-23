const { Op, fn, col, UniqueConstraintError } = require("sequelize");
const {
  ConflictError,
  NotFoundError,
} = require("../helper/customErrors");
const { encodeCursor } = require("../helper/cursor");
const {
  Article,
  ArticleCollection,
  Collection,
  Tag,
  User,
  sequelize,
} = require("../models");

const { Favorites } = sequelize.models;

const findOwnedCollection = async (user, collectionId) => {
  const collection = await Collection.findOne({
    where: { id: collectionId, userId: user.id },
  });

  if (!collection) throw new NotFoundError("Collection");

  return collection;
};

const findArticleBySlug = async (slug) => {
  const article = await Article.findOne({ where: { slug } });

  if (!article) throw new NotFoundError("Article");

  return article;
};

const articleCountsByCollection = async (collectionIds) => {
  if (collectionIds.length === 0) return {};

  const rows = await ArticleCollection.findAll({
    attributes: ["collectionId", [fn("COUNT", col("articleId")), "count"]],
    group: ["collectionId"],
    raw: true,
    where: { collectionId: { [Op.in]: collectionIds } },
  });

  return Object.fromEntries(
    rows.map((row) => [row.collectionId, Number(row.count)]),
  );
};

const decorateArticles = async (user, articles) => {
  const articleIds = articles.map((article) => article.id);

  const [countRows, favoritedRows] = await Promise.all([
    articleIds.length === 0
      ? []
      : Favorites.findAll({
          attributes: ["articleId", [fn("COUNT", col("userId")), "count"]],
          group: ["articleId"],
          raw: true,
          where: { articleId: { [Op.in]: articleIds } },
        }),
    articleIds.length === 0
      ? []
      : Favorites.findAll({
          attributes: ["articleId"],
          raw: true,
          where: { articleId: { [Op.in]: articleIds }, userId: user.id },
        }),
  ]);

  const favoriteCounts = Object.fromEntries(
    countRows.map((row) => [row.articleId, Number(row.count)]),
  );
  const favoritedIds = new Set(favoritedRows.map((row) => row.articleId));

  return articles.map((article) => ({
    ...article.toJSON(),
    favorited: favoritedIds.has(article.id),
    favoritesCount: favoriteCounts[article.id] || 0,
  }));
};

const cursorOptions = (cursor, key) => {
  if (!cursor) return {};

  return {
    [Op.or]: [
      { createdAt: { [Op.lt]: cursor.createdAt } },
      { createdAt: cursor.createdAt, [key]: { [Op.lt]: cursor.id } },
    ],
  };
};

const listCollections = async ({ user, limit, cursor }) => {
  const rows = await Collection.findAll({
    limit: limit + 1,
    order: [
      ["createdAt", "DESC"],
      ["id", "DESC"],
    ],
    where: { userId: user.id, ...cursorOptions(cursor, "id") },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const counts = await articleCountsByCollection(page.map((row) => row.id));

  return {
    collections: page.map((row) => ({
      ...row.toJSON(),
      articlesCount: counts[row.id] || 0,
    })),
    nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null,
  };
};

const getCollection = async ({ user, collectionId, limit, cursor }) => {
  const collection = await findOwnedCollection(user, collectionId);

  const memberships = await ArticleCollection.findAll({
    include: [
      {
        model: Article,
        include: [
          { model: User, as: "author", attributes: { exclude: ["email"] } },
          { model: Tag, as: "tagList", attributes: ["name"] },
        ],
      },
    ],
    limit: limit + 1,
    order: [
      ["createdAt", "DESC"],
      ["articleId", "DESC"],
    ],
    where: {
      collectionId: collection.id,
      ...cursorOptions(cursor, "articleId"),
    },
  });

  const hasMore = memberships.length > limit;
  const page = hasMore ? memberships.slice(0, limit) : memberships;
  const articles = await decorateArticles(
    user,
    page.map((membership) => membership.Article),
  );
  const articlesCount = await ArticleCollection.count({
    where: { collectionId: collection.id },
  });

  const lastMembership = page[page.length - 1];

  return {
    collection: { ...collection.toJSON(), articlesCount },
    articles,
    nextCursor:
      hasMore && lastMembership
        ? encodeCursor({
            createdAt: lastMembership.createdAt,
            id: lastMembership.articleId,
          })
        : null,
  };
};

const createCollection = async ({ user, name, description }) => {
  try {
    const collection = await Collection.create({
      userId: user.id,
      name,
      description,
    });

    return { ...collection.toJSON(), articlesCount: 0 };
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ConflictError("A collection with this name already exists");
    }

    throw error;
  }
};

const updateCollection = async ({ user, collectionId, name, description }) => {
  const collection = await findOwnedCollection(user, collectionId);

  if (name !== undefined) collection.name = name;
  if (description !== undefined) collection.description = description;

  try {
    await collection.save();
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ConflictError("A collection with this name already exists");
    }

    throw error;
  }

  const articlesCount = await ArticleCollection.count({
    where: { collectionId: collection.id },
  });

  return { ...collection.toJSON(), articlesCount };
};

const deleteCollection = async ({ user, collectionId }) => {
  const collection = await findOwnedCollection(user, collectionId);

  await collection.destroy();
};

const addArticleToCollection = async ({ user, collectionId, slug }) => {
  const collection = await findOwnedCollection(user, collectionId);
  const article = await findArticleBySlug(slug);

  try {
    await ArticleCollection.create({
      collectionId: collection.id,
      articleId: article.id,
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ConflictError("Article is already in this collection");
    }

    throw error;
  }

  const [decoratedArticle] = await decorateArticles(user, [article]);

  return decoratedArticle;
};

const removeArticleFromCollection = async ({ user, collectionId, slug }) => {
  const collection = await findOwnedCollection(user, collectionId);
  const article = await findArticleBySlug(slug);

  const deleted = await ArticleCollection.destroy({
    where: { collectionId: collection.id, articleId: article.id },
  });

  if (deleted === 0) {
    throw new NotFoundError("Article in collection");
  }
};

module.exports = {
  addArticleToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  removeArticleFromCollection,
  updateCollection,
};
