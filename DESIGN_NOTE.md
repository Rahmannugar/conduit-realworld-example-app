# Metcore Assessment Technical Architecture

Abdulrahmon Adenuga

Github repository link: https://github.com/Rahmannugar/conduit-realworld-example-app

## Functional requirements

Users must be authenticated and:

- can create private collections with name and optional description (unique name per user).
- can edit collection details.
- create an article with or without a linked selfowned collection.
- created articles must be unique per user owned collection.
- can delete a collection without deleting its articles.
- can view own collection details, article list with pagination.
- cannot view another user's data; collections (prevent against IDOR/BOLA, BFLA).
- Include test suites (unit, integration, e2e across backend and frontend).
- Add CI.

## Non-functional requirements

1. Authorization & Data Isolation
2. Low reads latency

## Capacity estimation

Million articles, thousands of users. Reads efficiency is a major thing to consider.

## Data model

article

`id|user_id|slug|title|description|body|created_at|updated_at`

collections

`id|user_id|name|description|created_at|updated_at`

article_collections

`article_id|collection_id|created_at` (composite primary key of article_id and collection_id prevent duplicate article entry in a collection)

## APIs

- `POST /api/collections` - create a collection
- `GET /api/collections?limit=25&cursor=...` - Fetch paginated collections
- `GET /api/collections/{collection_id}?limit=25&cursor=...` - Fetch a single collection and its articles
- `PATCH /api/collections/{collection_id}` - Patch a single collection
- `DELETE /api/collections/{collection_id}` - Delete a single collection
- `POST /api/collections/{collection_id}/articles` - Add an article to a collection
- `DELETE /api/collections/{collection_id}/articles/{article_slug}` - Remove article from a collection
- `POST /api/articles` - create an article with a linked collection or not.

## Decisions

### Indexing and Data access

To keep collection reads efficient, I would index collections(user_id, created_at, id) to support owner-scoped collection lookups and cursor pagination, and article_collections(collection_id, created_at, article_id) to efficiently load paginated articles within a collection.

I'd also prevent unauthorized access to private collections by ensuring every collection command and query would be scoped by the user_id from our authentication middleware and included in the db queries.

### Caching.

I wouldn't introduce server side caching today since collections are private and scoped to individual users. I'd implement caching when I notice repeated reads for a user or introduce public collections. I would ideally want to cache articles as well I would consider caching the first page of a user's collections and potentially the first page of articles within frequently accessed collections.

If I'm caching, use jittered TTLs per user so their cache expires at different times. If users' cache all expire simultaneously, we'd suffer from cache stampede (request coalescing prevents this but this is a private collection so there's no global request).

I'd also use incremental version invalidation, older cache keys would become stale and expire on their own as every mutation operation on collections would increment a cache key. If the next read comes, we build a fresh cache for that user.

On the client end, I would cache recently fetched collection and article-list responses for the duration of the session to avoid unnecessary refetches, while invalidating affected queries after related mutations.

### Production Observability and Monitoring.

I'd monitor the p50, p95, p99 latency for collection list endpoint.

Ideally, I'd also include structured logs and trace requests.

### Tradeoff.

I didn't include a cache layer and focused on data access, authorization, query patterns and indexing as I didn't see any reason to introduce a cache without any production insight. Also since the existing frontend is React/Vite, I decided not to implement SSR caching for articles as plain React is client rendered only so I simply used tanstack query for client caching and invalidation.

### What I'd improve or add if given more time.

I'd introduce proper observability and monitoring flows for database qjuery performance and authorization failures

I'd include proper documentation via Swagger instead of an API.md on the feature I did.
