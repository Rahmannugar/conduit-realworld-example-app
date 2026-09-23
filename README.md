# Conduit RealWorld App

Conduit is a full-stack publishing app built on the [RealWorld](https://realworld.io/) spec:
React and Vite on the frontend, Express and Sequelize with PostgreSQL on the backend.

## Collections

This repo adds private article collections. A signed-in user can save articles into named lists
that only they can see or change.

- **My Collections** — list, create, rename, edit the description, and delete collections.
  Deleting a collection keeps its articles.
- **Collection detail** — the articles saved in a collection, paginated, with the option to
  remove one.
- **Save to collection** — from any article page, add that article to the user's collections.
  An article cannot be added to the same collection twice. Remove it from the collection detail
  page.

Ownership is checked on the server for every request. The UI never decides who can read or
write a collection.

An article can also be created directly into one of the user's collections.

- Endpoints: [API.md](API.md)
- Design decisions and scaling notes: [DESIGN_NOTE.md](DESIGN_NOTE.md)

## Stack

| Layer    | Technology                                |
| -------- | ----------------------------------------- |
| Frontend | React, Vite, React Router, TanStack Query |
| Backend  | Express, Sequelize                        |
| Database | PostgreSQL, schema managed by migrations  |
| Tests    | Vitest, Playwright                        |
| CI       | GitHub Actions with a PostgreSQL service  |

## Getting started

### Prerequisites

- Node.js 22 or newer
- npm
- PostgreSQL running locally

### Install

```bash
git clone https://github.com/Rahmannugar/conduit-realworld-example-app.git
cd conduit-realworld-example-app
npm install
```

### Configure

Create `backend/.env` from [`backend/.env.example`](backend/.env.example) and set `JWT_KEY`
plus the `DEV_DB_*` and `TEST_DB_*` PostgreSQL credentials.

### Create and migrate the database

Schema changes are migrations. The app does not alter the schema at startup.

```bash
npm run sqlz -- db:create
npm run sqlz -- db:migrate
npm run sqlz -- db:seed:all
```

Seeding is optional and adds demo data. Seeded users are stored with hashed passwords, for
example `example1@mail.com` with `examplePwd1`, through `example5@mail.com` with `examplePwd5`.

`npm run sqlz` is an alias for `npx -w backend sequelize-cli`.

### Run

```bash
npm run dev
```

The frontend runs at [http://localhost:3000](http://localhost:3000) and the API at
[http://localhost:3001/api](http://localhost:3001/api).

### Test

```bash
npm run test        # backend integration tests and frontend component tests
npm run test:e2e    # Playwright end-to-end journey
npm run lint        # static syntax check
```

The backend tests create the `TEST_DB_*` database if it is missing, replay the migrations and
truncate between tests. The e2e suite starts the backend and frontend itself; install the
browser once with `npx playwright install chromium`, and make sure the development database is
migrated and seeded first.

### Production build

```bash
npm run start
```

## AI Usage

Claude/ opencode were used to scaffold the feature: API, UI, tests and CI.

## Known limitations

- No server-side caching. Collections are private and per-user, so caching was left out until there is production data to justify it. See [DESIGN_NOTE.md](DESIGN_NOTE.md).
- The feature is documented in [API.md](API.md). There is no generated OpenAPI spec yet.

## License

MIT. See [LICENSE](LICENSE).

## Acknowledgments

Built on [RealWorld](https://realworld.io/) and the
[Conduit RealWorld app](https://github.com/TonyMckes/conduit-realworld-example-app) by Tony Mckes.
