import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CollectionArticles from "../components/CollectionArticles";
import CollectionsForm from "../components/CollectionsForm";
import ContainerRow from "../components/ContainerRow";
import {
  useCollectionMutations,
  useCollectionQuery,
} from "../hooks/useCollections";

function CollectionDetail() {
  const { collectionId } = useParams();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { update, removeArticle } = useCollectionMutations();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
  } = useCollectionQuery({ collectionId });

  const collection = data?.pages[0]?.collection;
  const articles = data?.pages.flatMap((page) => page.articles) ?? [];

  const handleUpdate = ({ name, description }) => {
    setFormError("");
    setSuccessMessage("");

    update.mutate(
      { collectionId, name, description },
      {
        onSuccess: () => {
          setEditing(false);
          setSuccessMessage("Collection updated.");
        },
        onError: (mutationError) => setFormError(mutationError.message),
      },
    );
  };

  const handleRemove = (article) => {
    setSuccessMessage("");

    removeArticle.mutate(
      { collectionId, slug: article.slug },
      {
        onSuccess: () => setSuccessMessage("Article removed from collection."),
        onError: (mutationError) => setFormError(mutationError.message),
      },
    );
  };

  return (
    <div className="collection-detail-page">
      <ContainerRow type="page">
        <div className="col-md-8 offset-md-2">
          <p>
            <Link to="/collections">&larr; Back to My Collections</Link>
          </p>

          {isLoading ? (
            <div className="article-preview">
              <em>Loading collection...</em>
            </div>
          ) : isError ? (
            <div className="article-preview">
              <span className="error-messages">{error.message}</span>
            </div>
          ) : (
            <>
              {editing ? (
                <CollectionsForm
                  busy={update.isPending}
                  collection={collection}
                  errorMessage={formError}
                  onCancel={() => {
                    setEditing(false);
                    setFormError("");
                  }}
                  onSubmit={handleUpdate}
                />
              ) : (
                <>
                  <h1>{collection.name}</h1>
                  {collection.description && <p>{collection.description}</p>}
                  <p style={{ color: "#999" }}>
                    {collection.articlesCount}{" "}
                    {collection.articlesCount === 1 ? "article" : "articles"}
                  </p>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setEditing(true);
                      setSuccessMessage("");
                    }}
                  >
                    Edit collection
                  </button>
                  <button
                    className="btn btn-sm btn-secondary pull-xs-right"
                    onClick={() => navigate("/collections")}
                  >
                    Manage collections
                  </button>
                </>
              )}

              {successMessage && (
                <p className="empty-feed-message">{successMessage}</p>
              )}

              <div style={{ marginTop: "1rem" }}>
                <CollectionArticles
                  articles={articles}
                  onRemove={handleRemove}
                  removingSlug={
                    removeArticle.isPending
                      ? removeArticle.variables?.slug
                      : null
                  }
                />
              </div>

              {hasNextPage && (
                <button
                  className="btn btn-secondary"
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                  type="button"
                >
                  {isFetchingNextPage ? "Loading..." : "Load more"}
                </button>
              )}
            </>
          )}
        </div>
      </ContainerRow>
    </div>
  );
}

export default CollectionDetail;
