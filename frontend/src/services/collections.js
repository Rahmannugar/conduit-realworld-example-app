import axios from "axios";
import normalizeApiError from "../helpers/normalizeApiError";

const request = async (config) => {
  try {
    const { data } = await axios(config);

    return data;
  } catch (error) {
    throw normalizeApiError(error);
  }
};

const collectionUrl = (collectionId) => `api/collections/${collectionId}`;

async function listCollections({ headers, limit, cursor }) {
  const params = new URLSearchParams();

  if (limit) params.set("limit", limit);
  if (cursor) params.set("cursor", cursor);

  return request({
    headers,
    url: `api/collections?${params.toString()}`,
  });
}

async function getCollection({ headers, collectionId, limit, cursor }) {
  const params = new URLSearchParams();

  if (limit) params.set("limit", limit);
  if (cursor) params.set("cursor", cursor);

  return request({
    headers,
    url: `${collectionUrl(collectionId)}?${params.toString()}`,
  });
}

async function createCollection({ headers, name, description }) {
  const { collection } = await request({
    data: { collection: { name, description } },
    headers,
    method: "POST",
    url: "api/collections",
  });

  return collection;
}

async function updateCollection({ headers, collectionId, name, description }) {
  const { collection } = await request({
    data: { collection: { name, description } },
    headers,
    method: "PATCH",
    url: collectionUrl(collectionId),
  });

  return collection;
}

async function deleteCollection({ headers, collectionId }) {
  await request({
    headers,
    method: "DELETE",
    url: collectionUrl(collectionId),
  });
}

async function addArticleToCollection({ headers, collectionId, slug }) {
  const { article } = await request({
    data: { slug },
    headers,
    method: "POST",
    url: `${collectionUrl(collectionId)}/articles`,
  });

  return article;
}

async function removeArticleFromCollection({ headers, collectionId, slug }) {
  await request({
    headers,
    method: "DELETE",
    url: `${collectionUrl(collectionId)}/articles/${slug}`,
  });
}

export {
  addArticleToCollection,
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  removeArticleFromCollection,
  updateCollection,
};
