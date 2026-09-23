const { BadRequestError } = require("./customErrors");

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const parseLimit = (rawLimit) => {
  if (rawLimit === undefined) return DEFAULT_LIMIT;

  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new BadRequestError("Limit must be a positive integer");
  }

  return Math.min(limit, MAX_LIMIT);
};

const encodeCursor = ({ createdAt, id }) => {
  return Buffer.from(`${new Date(createdAt).toISOString()}|${id}`).toString(
    "base64url",
  );
};

const decodeCursor = (rawCursor) => {
  if (!rawCursor) return null;

  try {
    const [createdAtRaw, idRaw] = Buffer.from(rawCursor, "base64url")
      .toString("utf8")
      .split("|");

    const createdAt = new Date(createdAtRaw);
    const id = Number(idRaw);

    if (Number.isNaN(createdAt.getTime()) || !Number.isInteger(id)) {
      throw new Error("Malformed cursor");
    }

    return { createdAt, id };
  } catch {
    throw new BadRequestError("Invalid cursor");
  }
};

module.exports = { DEFAULT_LIMIT, MAX_LIMIT, parseLimit, encodeCursor, decodeCursor };
