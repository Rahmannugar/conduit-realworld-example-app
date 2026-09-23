import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  useCollectionMutations,
  useCollectionsQuery,
} from "../../hooks/useCollections";

function SaveToCollection({ slug }) {
  const { isAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const collectionsQuery = useCollectionsQuery({ limit: 50 });
  const { addArticle } = useCollectionMutations();

  if (!isAuth) return null;

  const collections =
    collectionsQuery.data?.pages.flatMap((page) => page.collections) ?? [];
  const pendingId = addArticle.isPending
    ? addArticle.variables?.collectionId
    : null;

  const save = (collection) => {
    setErrorMessage("");
    addArticle.mutate(
      { collectionId: collection.id, slug },
      { onError: (error) => setErrorMessage(error.message) },
    );
  };

  return (
    <div style={{ display: "inline-block", position: "relative" }}>
      <button
        className="btn btn-sm btn-outline-primary"
        onClick={() => setOpen((previous) => !previous)}
        type="button"
      >
        <i className="ion-bookmark"></i> Save to collection
      </button>

      {open && (
        <div
          className="card"
          style={{
            left: 0,
            padding: "0.75rem",
            position: "absolute",
            textAlign: "left",
            top: "110%",
            width: "18rem",
            zIndex: 10,
          }}
        >
          {errorMessage && (
            <div className="error-messages">{errorMessage}</div>
          )}

          {collectionsQuery.isLoading ? (
            <em>Loading collections...</em>
          ) : collectionsQuery.isError ? (
            <span className="error-messages">
              {collectionsQuery.error.message}
            </span>
          ) : collections.length === 0 ? (
            <span>
              No collections yet.{" "}
              <Link to="/collections">Create one</Link>.
            </span>
          ) : (
            collections.map((collection) => (
              <button
                className="btn btn-sm btn-secondary"
                disabled={pendingId === collection.id}
                key={collection.id}
                onClick={() => save(collection)}
                style={{ display: "block", marginBottom: "0.35rem", width: "100%" }}
                type="button"
              >
                Save — {collection.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SaveToCollection;
