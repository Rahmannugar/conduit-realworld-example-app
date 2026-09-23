import { Link } from "react-router-dom";

function CollectionCard({ collection, deleting, onDelete, onEdit }) {
  const { articlesCount, description, id, name } = collection;

  return (
    <div className="article-preview">
      <div className="pull-xs-right">
        <Link className="btn btn-sm btn-primary" to={`/collections/${id}`}>
          Open
        </Link>{" "}
        <button
          className="btn btn-sm btn-secondary"
          disabled={deleting}
          onClick={() => onEdit(collection)}
        >
          Edit
        </button>{" "}
        <button
          className="btn btn-sm btn-outline-danger"
          disabled={deleting}
          onClick={() => onDelete(collection)}
        >
          Delete
        </button>
      </div>

      <h3>{name}</h3>
      {description && <p>{description}</p>}
      <span style={{ color: "#999" }}>
        {articlesCount} {articlesCount === 1 ? "article" : "articles"}
      </span>
    </div>
  );
}

export default CollectionCard;
