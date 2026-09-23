const {
  FieldRequiredError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} = require("../helper/customErrors");
const { decodeCursor, parseLimit } = require("../helper/cursor");
const {
  addArticleToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  listCollectionIdsForArticle,
  listCollections,
  removeArticleFromCollection,
  updateCollection,
} = require("../services/collections");

const requireUser = (req) => {
  if (!req.loggedUser) throw new UnauthorizedError();

  return req.loggedUser;
};

const parseCollectionId = (rawId) => {
  const collectionId = Number(rawId);

  if (!Number.isInteger(collectionId) || collectionId < 1) {
    throw new NotFoundError("Collection");
  }

  return collectionId;
};

const parseName = (rawName) => {
  if (typeof rawName !== "string" || rawName.trim().length === 0) {
    throw new FieldRequiredError("A collection name");
  }

  return rawName.trim();
};

const parseDescription = (rawDescription) => {
  if (rawDescription === undefined || rawDescription === null) return null;

  if (typeof rawDescription !== "string") {
    throw new ValidationError("Description must be a string");
  }

  return rawDescription;
};

//* Create Collection
const create = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const { name, description } = req.body.collection || {};

    const collection = await createCollection({
      user,
      name: parseName(name),
      description: parseDescription(description),
    });

    res.status(201).json({ collection });
  } catch (error) {
    next(error);
  }
};

//? List own Collections
const list = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const limit = parseLimit(req.query.limit);
    const cursor = decodeCursor(req.query.cursor);

    const { collections, nextCursor } = await listCollections({
      user,
      limit,
      cursor,
    });

    res.json({ collections, nextCursor });
  } catch (error) {
    next(error);
  }
};

// Single own Collection with its articles
const single = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const collectionId = parseCollectionId(req.params.collectionId);
    const limit = parseLimit(req.query.limit);
    const cursor = decodeCursor(req.query.cursor);

    const { collection, articles, nextCursor } = await getCollection({
      user,
      collectionId,
      limit,
      cursor,
    });

    res.json({ collection, articles, nextCursor });
  } catch (error) {
    next(error);
  }
};

//* Update Collection
const update = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const collectionId = parseCollectionId(req.params.collectionId);
    const { name, description } = req.body.collection || {};

    if (name === undefined && description === undefined) {
      throw new ValidationError("Nothing to update");
    }

    const collection = await updateCollection({
      user,
      collectionId,
      name: name === undefined ? undefined : parseName(name),
      description:
        description === undefined ? undefined : parseDescription(description),
    });

    res.json({ collection });
  } catch (error) {
    next(error);
  }
};

//* Delete Collection
const destroy = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const collectionId = parseCollectionId(req.params.collectionId);

    await deleteCollection({ user, collectionId });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

//* Add Article to Collection
const addArticle = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const collectionId = parseCollectionId(req.params.collectionId);
    const { slug } = req.body;

    if (typeof slug !== "string" || slug.trim().length === 0) {
      throw new FieldRequiredError("An article slug");
    }

    const article = await addArticleToCollection({
      user,
      collectionId,
      slug: slug.trim(),
    });

    res.status(201).json({ article });
  } catch (error) {
    next(error);
  }
};

//* Remove Article from Collection
const removeArticle = async (req, res, next) => {
  try {
    const user = requireUser(req);
    const collectionId = parseCollectionId(req.params.collectionId);

    await removeArticleFromCollection({
      user,
      collectionId,
      slug: req.params.slug,
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

//* List the authenticated user's collections containing an article
const forArticle = async (req, res, next) => {
  try {
    const user = requireUser(req);

    const collectionIds = await listCollectionIdsForArticle({
      user,
      slug: req.params.slug,
    });

    res.json({ collectionIds });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addArticle,
  create,
  destroy,
  forArticle,
  list,
  removeArticle,
  single,
  update,
};
