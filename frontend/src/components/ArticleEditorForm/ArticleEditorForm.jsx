import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCollectionsQuery } from "../../hooks/useCollections";
import getArticle from "../../services/getArticle";
import setArticle from "../../services/setArticle";
import FormFieldset from "../FormFieldset";

const emptyForm = {
  title: "",
  description: "",
  body: "",
  tagList: "",
  collectionId: "",
};

function ArticleEditorForm() {
  const [{ title, description, body, tagList, collectionId }, setForm] =
    useState(emptyForm);
  const [errorMessage, setErrorMessage] = useState("");
  const { isAuth, headers, loggedUser } = useAuth();

  const navigate = useNavigate();
  const { slug } = useParams();

  const collectionsQuery = useCollectionsQuery({ limit: 50 });
  const collections =
    collectionsQuery.data?.pages.flatMap((page) => page.collections) ?? [];

  useEffect(() => {
    const redirect = () => navigate("/", { replace: true, state: null });
    if (!isAuth) return redirect();

    if (!slug) return;

    getArticle({ headers, slug })
      .then((article) => {
        if (article.author.username !== loggedUser.username) redirect();

        setForm({
          body: article.body,
          collectionId: article.collections?.[0]?.id
            ? String(article.collections[0].id)
            : "",
          description: article.description,
          tagList: article.tagList,
          title: article.title,
        });
      })
      .catch(console.error);

    return () => setForm(emptyForm);
  }, [headers, isAuth, loggedUser.username, navigate, slug]);

  const inputHandler = (e) => {
    const type = e.target.name;
    const value = e.target.value;

    setForm((form) => ({ ...form, [type]: value }));
  };

  const tagsInputHandler = (e) => {
    const value = e.target.value;

    setForm((form) => ({ ...form, tagList: value.split(/,| /) }));
  };

  const formSubmit = (e) => {
    e.preventDefault();

    const payload = { headers, slug, body, description, tagList, title };

    if (slug) {
      payload.collectionId = collectionId === "" ? null : Number(collectionId);
    } else if (collectionId !== "") {
      payload.collectionId = Number(collectionId);
    }

    setArticle(payload)
      .then((nextSlug) => navigate(`/article/${nextSlug}`))
      .catch(setErrorMessage);
  };

  return (
    <form onSubmit={formSubmit}>
      <fieldset>
        {errorMessage && <span className="error-messages">{errorMessage}</span>}
        <FormFieldset
          placeholder="Article Title"
          name="title"
          required
          value={title}
          handler={inputHandler}
        ></FormFieldset>

        <FormFieldset
          normal
          placeholder="What's this article about?"
          name="description"
          required
          value={description}
          handler={inputHandler}
        ></FormFieldset>

        <fieldset className="form-group">
          <textarea
            className="form-control"
            rows="8"
            placeholder="Write your article (in markdown)"
            name="body"
            required
            value={body}
            onChange={inputHandler}
          ></textarea>
        </fieldset>

        <FormFieldset
          normal
          placeholder="Enter tags"
          name="tags"
          value={tagList}
          handler={tagsInputHandler}
        >
          <div className="tag-list"></div>
        </FormFieldset>

        <fieldset className="form-group">
          <label htmlFor="collection-select">Collection</label>
          <select
            className="form-control"
            id="collection-select"
            name="collectionId"
            value={collectionId}
            onChange={inputHandler}
          >
            <option value="">None</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
        </fieldset>

        <button className="btn btn-lg pull-xs-right btn-primary" type="submit">
          {slug ? "Update Article" : "Publish Article"}
        </button>
      </fieldset>
    </form>
  );
}

export default ArticleEditorForm;
