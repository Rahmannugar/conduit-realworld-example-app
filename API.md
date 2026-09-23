# API — Collections

Private article collections. All other RealWorld endpoints are unchanged.

**Auth:** every endpoint below requires `Authorization: Token <jwt>`.

**Ownership:** queries are scoped to the signed-in user. Another user's collection returns `404`.

## Quick reference

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `POST` | `/api/collections` | Create a collection |
| `GET` | `/api/collections` | List your collections |
| `GET` | `/api/collections/:collectionId` | Get a collection + its articles |
| `PATCH` | `/api/collections/:collectionId` | Rename / edit description |
| `DELETE` | `/api/collections/:collectionId` | Delete collection (articles kept) |
| `POST` | `/api/collections/:collectionId/articles` | Add an article by slug |
| `DELETE` | `/api/collections/:collectionId/articles/:slug` | Remove an article |

## Conventions

**Errors**

```json
{ "errors": { "body": ["Collection not found"] } }
```

| Status | Meaning |
| ------ | ------- |
| `400` | Invalid query param |
| `401` | Not authenticated |
| `404` | Not found / not owned |
| `409` | Duplicate name or membership |
| `422` | Validation failed |

**Pagination** (list + collection detail): cursor-based. `limit` defaults to `20`, max `50`.
Pass `nextCursor` from the previous response back as `?cursor=...`. It is `null` on the last page.

## Endpoints

### Create a collection

`POST /api/collections`

```json
{ "collection": { "name": "Reading list", "description": "optional" } }
```

- `name` is required and unique per user, case-insensitively (`Reading` and `reading` conflict).
- `201` → `{ "collection": { "id": 1, "name": "Reading list", "description": "optional", "articlesCount": 0 } }`

### List collections

`GET /api/collections?limit=20&cursor=<opaque>` → `200`

```json
{
  "collections": [
    { "id": 1, "name": "Reading list", "description": null, "articlesCount": 3 }
  ],
  "nextCursor": null
}
```

### Get a collection and its articles

`GET /api/collections/:collectionId?limit=20&cursor=<opaque>` → `200`

```json
{
  "collection": { "id": 1, "name": "Reading list", "articlesCount": 3 },
  "articles": [
    {
      "slug": "lorem-ipsum-1",
      "title": "...",
      "author": { "username": "exampleUser1" },
      "favorited": false,
      "favoritesCount": 0
    }
  ],
  "nextCursor": null
}
```

### Update a collection

`PATCH /api/collections/:collectionId` — send only the fields to change.

```json
{ "collection": { "name": "New name", "description": "New description" } }
```

- Empty body → `422`
- Duplicate name → `409`
- `200` → `{ "collection": { ... } }`

### Delete a collection

`DELETE /api/collections/:collectionId` → `204`

Memberships are removed; **articles are not deleted**.

### Add an article

`POST /api/collections/:collectionId/articles`

```json
{ "slug": "lorem-ipsum-1" }
```

- `201` → `{ "article": { ... } }`
- Already in the collection → `409`

### Remove an article

`DELETE /api/collections/:collectionId/articles/:slug` → `204`

Not in the collection → `404`.

### Create an article into a collection

`POST /api/articles` — optional `collectionId` in the article payload.

```json
{
  "article": {
    "title": "How to train your dragon",
    "description": "Ever wonder how?",
    "body": "It takes a Jacobian",
    "tagList": ["dragons"],
    "collectionId": 1
  }
}
```

`201`:

```json
{
  "article": {
    "slug": "how-to-train-your-dragon",
    "title": "How to train your dragon",
    "description": "Ever wonder how?",
    "body": "It takes a Jacobian",
    "tagList": ["dragons"],
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z",
    "favorited": false,
    "favoritesCount": 0,
    "author": {
      "username": "exampleUser1",
      "bio": null,
      "image": "https://i.imgur.com/mYWRJZr.png",
      "following": false
    }
  }
}
```

- Collection must belong to the user (`404` otherwise, and the article is not created).
- Article, tags, and membership are created in one transaction.
- Omit `collectionId` for the original behaviour — same request and response, no membership.
