# API Reference

This document describes the Collections feature endpoints added to the
RealWorld/Conduit API. All other article, authentication, profile, comment and
feed endpoints are unchanged; see the [RealWorld API spec](https://github.com/gothinkster/realworld/tree/main/api)
for those.

## Authentication

Every Collections endpoint requires an authenticated user. Send the token
returned by `POST /api/users/login` in the `Authorization` header:

```
Authorization: Token <jwt>
```

A missing or invalid token returns `401`. Ownership is enforced server-side:
every query is scoped to the authenticated user, so another user's collection is
indistinguishable from a non-existent one (`404`).

## Error shape

Errors use the same envelope as the rest of the API:

```json
{ "errors": { "body": ["Collection not found"] } }
```

| Status | Meaning                                                              |
| ------ | -------------------------------------------------------------------- |
| `400`  | Malformed query parameter (invalid cursor or limit)                  |
| `401`  | Missing or invalid token                                             |
| `404`  | Collection or article not found, or not owned by the current user    |
| `409`  | Conflict (duplicate collection name, or duplicate article membership)|
| `422`  | Validation failure (e.g. missing name or slug)                       |

## Pagination

List responses use cursor pagination. Pass `limit` (default `20`, maximum `50`).
Responses include `nextCursor`; pass it back as the `cursor` query parameter to
fetch the next page. `nextCursor` is `null` on the last page. Cursors are opaque.

## Endpoints

### Create a collection

`POST /api/collections`

```json
{ "collection": { "name": "Reading list", "description": "optional" } }
```

- `name` is required and must be unique per user.
- `description` is optional.

`201` response:

```json
{
  "collection": {
    "id": 1,
    "name": "Reading list",
    "description": "optional",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z",
    "articlesCount": 0
  }
}
```

### List the current user's collections

`GET /api/collections?limit=20&cursor=<opaque>`

`200` response:

```json
{
  "collections": [
    {
      "id": 1,
      "name": "Reading list",
      "description": "optional",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "articlesCount": 3
    }
  ],
  "nextCursor": null
}
```

### Get a collection and its articles

`GET /api/collections/:collectionId?limit=20&cursor=<opaque>`

The `collection` object includes `articlesCount`, the total number of saved
articles (not just the current page). `articles` contains the paginated article
payloads, each shaped like the standard article response with `favorited` and
`favoritesCount` relative to the current user.

`200` response:

```json
{
  "collection": { "id": 1, "name": "Reading list", "articlesCount": 3 },
  "articles": [
    {
      "slug": "lorem-ipsum-1",
      "title": "Lorem Ipsum 1",
      "description": "...",
      "body": "...",
      "tagList": [],
      "author": { "username": "exampleUser1" },
      "favorited": false,
      "favoritesCount": 0
    }
  ],
  "nextCursor": null
}
```

### Update a collection

`PATCH /api/collections/:collectionId`

```json
{ "collection": { "name": "New name", "description": "New description" } }
```

Send only the fields to change. An empty update returns `422`. Renaming to a name
already used by another of the user's collections returns `409`.

`200` response: `{ "collection": { ... } }`

### Delete a collection

`DELETE /api/collections/:collectionId`

Deletes the collection and its memberships. **Articles are not deleted.**
Returns `204` with no body.

### Add an article to a collection

`POST /api/collections/:collectionId/articles`

```json
{ "slug": "lorem-ipsum-1" }
```

- The article is addressed by slug, consistent with the rest of the API.
- Adding an article already in the collection returns `409`.
- The collection must belong to the authenticated user, otherwise `404`.

`201` response: `{ "article": { ... } }`

### Remove an article from a collection

`DELETE /api/collections/:collectionId/articles/:slug`

Returns `204` with no body. If the article is not currently in the collection,
returns `404`.

### List the user's collections containing an article

`GET /api/articles/:slug/collections`

Returns the ids of the authenticated user's collections that contain the article.
Used by the "Save to collection" control on the article page.

`200` response: `{ "collectionIds": [1, 2] }`

### Create an article into a collection (extension)

`POST /api/articles`

The existing endpoint accepts an optional `collectionId`:

```json
{
  "article": {
    "title": "A title",
    "description": "A description",
    "body": "The body",
    "tagList": ["tag"],
    "collectionId": 1
  }
}
```

When `collectionId` is present the collection is verified to belong to the
authenticated user, and the article, its tags and the membership are created in a
single transaction. An unknown or unowned `collectionId` returns `404` and no
article is created. Omitting `collectionId` keeps the original behaviour.
