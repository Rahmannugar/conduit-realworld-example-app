import { Link } from "react-router-dom";
import ArticleMeta from "../ArticleMeta";
import ArticleTags from "../ArticleTags";

function CollectionArticles({ articles, removingSlug, onRemove }) {
  if (articles.length === 0) {
    return (
      <div className="article-preview">
        No articles saved in this collection yet.
      </div>
    );
  }

  return articles.map((article) => (
    <div className="article-preview" key={article.slug}>
      <div className="pull-xs-right">
        <button
          className="btn btn-sm btn-outline-danger"
          disabled={removingSlug === article.slug}
          onClick={() => onRemove(article)}
        >
          {removingSlug === article.slug ? "Removing..." : "Remove"}
        </button>
      </div>

      <ArticleMeta author={article.author} createdAt={article.createdAt}>
        <span></span>
      </ArticleMeta>

      <Link
        className="preview-link"
        state={article}
        to={`/article/${article.slug}`}
      >
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        <ArticleTags tagList={article.tagList} />
      </Link>
    </div>
  ));
}

export default CollectionArticles;
