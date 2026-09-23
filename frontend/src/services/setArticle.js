import axios from "axios";
import errorHandler from "../helpers/errorHandler";

async function setArticle({
  body,
  collectionId,
  description,
  headers,
  slug,
  tagList,
  title,
}) {
  try {
    const article = { title, description, body, tagList };

    if (collectionId !== undefined) {
      article.collectionId = collectionId;
    }

    const { data } = await axios({
      data: { article },
      headers,
      method: slug ? "PUT" : "POST",
      url: slug ? `api/articles/${slug}` : "api/articles",
    });

    return data.article.slug;
  } catch (error) {
    errorHandler(error);
  }
}

export default setArticle;
