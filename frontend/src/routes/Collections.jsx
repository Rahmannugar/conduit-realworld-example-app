import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CollectionCard from "../components/CollectionCard";
import CollectionsForm from "../components/CollectionsForm";
import ContainerRow from "../components/ContainerRow";
import { useAuth } from "../context/AuthContext";
import {
  useCollectionMutations,
  useCollectionsQuery,
} from "../hooks/useCollections";

function Collections() {
  const { isAuth } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { create, remove, update } = useCollectionMutations();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
  } = useCollectionsQuery();

  useEffect(() => {
    if (!isAuth) navigate("/");
  }, [isAuth, navigate]);

  if (!isAuth) return null;

  const collections =
    data?.pages.flatMap((page) => page.collections) ?? [];

  const handleSubmit = ({ name, description }) => {
    setFormError("");
    setSuccessMessage("");

    if (editing) {
      update.mutate(
        { collectionId: editing.id, name, description },
        {
          onSuccess: () => {
            setEditing(null);
            setSuccessMessage("Collection updated.");
          },
          onError: (mutationError) => setFormError(mutationError.message),
        },
      );

      return;
    }

    create.mutate(
      { name, description },
      {
        onSuccess: () => setSuccessMessage("Collection created."),
        onError: (mutationError) => setFormError(mutationError.message),
      },
    );
  };

  const handleDelete = (collection) => {
    const confirmed = window.confirm(
      `Delete "${collection.name}"? The articles inside it are not deleted.`,
    );

    if (!confirmed) return;

    setSuccessMessage("");

    remove.mutate(
      { collectionId: collection.id },
      {
        onSuccess: () => {
          if (editing?.id === collection.id) setEditing(null);
          setSuccessMessage("Collection deleted.");
        },
        onError: (mutationError) => setFormError(mutationError.message),
      },
    );
  };

  return (
    <div className="collections-page">
      <ContainerRow type="page">
        <div className="col-md-8 offset-md-2">
          <h1>My Collections</h1>
          <p style={{ color: "#999" }}>
            Private lists of articles you have saved for later.
          </p>

          <CollectionsForm
            busy={create.isPending || update.isPending}
            collection={editing}
            errorMessage={formError}
            onCancel={() => {
              setEditing(null);
              setFormError("");
            }}
            onSubmit={handleSubmit}
          />

          {successMessage && (
            <p className="empty-feed-message">{successMessage}</p>
          )}

          {/* List states */}
          {isLoading ? (
            <div className="article-preview">
              <em>Loading collections...</em>
            </div>
          ) : isError ? (
            <div className="article-preview">
              <span className="error-messages">{error.message}</span>
            </div>
          ) : collections.length === 0 ? (
            <div className="article-preview">
              You have no collections yet. Create one above.
            </div>
          ) : (
            <>
              {collections.map((collection) => (
                <CollectionCard
                  collection={collection}
                  deleting={remove.isPending}
                  key={collection.id}
                  onDelete={handleDelete}
                  onEdit={(selected) => {
                    setEditing(selected);
                    setFormError("");
                    setSuccessMessage("");
                  }}
                />
              ))}

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

export default Collections;
