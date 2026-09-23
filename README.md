# ![RealWorld Example App](logo.png)

> **React / Vite + SWC / Express.js / Sequelize / PostgreSQL codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://realworld.io/) spec and API.**

This codebase was created to demonstrate a fully fledged fullstack application built with **React / Vite + SWC / Express.js / Sequelize / PostgreSQL** including CRUD operations, authentication, routing, pagination, and more.

**[Demo app](https://conduit-realworld-example-app.fly.dev/)&nbsp;&nbsp;|&nbsp;&nbsp;[With Create React App](https://github.com/TonyMckes/conduit-realworld-example-app/tree/create-react-app)&nbsp;&nbsp;|&nbsp;&nbsp;[Other RealWorld Example Apps](https://codebase.show/projects/realworld?category=fullstack)**

> For more information on how to this works with other frontends/backends, head over to the [RealWorld](https://github.com/gothinkster/realworld) repo.

---

## Getting Started

These instructions will help you install and run the project on your local machine for development and testing.

### Prerequisites

Before you run the project, make sure that you have the following tools and software installed on your computer:

- Text editor/IDE (e.g., VS Code, Sublime Text, Atom)
- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en/download/) `v18.11.0+`
- [NPM](https://www.npmjs.com/) (usually included with Node.js)
- SQL database

### Installation

To install the project on your computer, follow these steps:

1. Clone the repository to your local machine.

   ```bash
   git clone https://github.com/TonyMckes/conduit-realworld-example-app.git
   ```

2. Navigate to the project directory.

   ```bash
   cd conduit-realworld-example-app
   ```

3. Install project dependencies by running the command:

   ```bash
   npm install
   ```

### Configuration

1. Create a `.env` file in the root directory of the project
2. Add the required environment variables as specified in the [`.env.example`](backend/.env.example) file
3. (Optional) update the Sequelize configuration parameters in the [`config.js`](backend/config/config.js) file
4. If you are **not** using PostgreSQL, you may also have to install the driver for your database:

   <details>
   <summary>Use one of the following commands to install:</summary><br/>

   > Note: `-w backend` option is used to install it in the backend [`package.json`](backend/package.json).

   ```bash
   npm install -w backend pg pg-hstore  # Postgres (already installed)
   npm install -w backend mysql2
   npm install -w backend mariadb
   npm install -w backend sqlite3
   npm install -w backend tedious       # Microsoft SQL Server
   npm install -w backend oracledb      # Oracle Database
   ```

   > :information_source: Visit [Sequelize - Installing](https://sequelize.org/docs/v6/getting-started/#installing) for more infomation.

   ***

   </details>

5. Create database specified by configuration by executing

   > :warning: Please, make sure you have already created a superuser for your database.

   ```bash
   npm run sqlz -- db:create
   ```

   > :information_source: The command `npm run sqlz` is an alias for `npx -w backend sequelize-cli`.  
   > Execute `npm run sqlz -- --help` to see more of `sequelize-cli` commands availables.

6. Run the database migrations to create the schema:

   ```bash
   npm run sqlz -- db:migrate
   ```

   > :warning: All schema changes are represented as migrations. The application no
   > longer alters the schema at startup, so a new database must be migrated before
   > the API will work.

7. Optionally you can run the following command to populate your database with some dummy data:

   ```bash
   npm run sqlz -- db:seed:all
   ```

   The seeded users use hashed passwords, so you can sign in locally with e.g.
   `example1@mail.com` / `examplePwd1` (through `example5@mail.com` / `examplePwd5`).

### Usage

#### Development Server

To run the project, follow these steps:

1. Start the development server by executing the command:

   ```bash
   npm run dev
   ```

2. Open a web browser and navigate to:
   - Home page should be available at [`http://localhost:3000/`](http://localhost:3000).
   - API endpoints should be available at [`http://localhost:3001/api`](http://localhost:3001/api).

#### Running Tests

To run the backend and frontend test suites:

```bash
npm run test
```

The backend tests use a real PostgreSQL database. They create the `TEST_DB_*`
database if needed, replay the migrations and truncate between tests, so no
manual setup is required beyond the database credentials in the environment file.

To run the end-to-end tests (Playwright), make sure the development database has
been created, migrated and seeded first, then run:

```bash
npm run test:e2e
```

Playwright starts the backend and frontend automatically. Install the browser
once with `npx playwright install chromium`.

#### Static Check

To run the static syntax check used by CI:

```bash
npm run lint
```

#### Production

The following command will build the production version of the app:

```bash
npm run start
```

### Collections Feature

The Collections feature lets a signed-in user save articles into private,
named lists. A collection belongs to exactly one user, and only its owner may
read or modify it.

- **My Collections** (`/#/collections`) lists the current user's collections
  with pagination and supports create, rename, edit description and delete.
  Deleting a collection never deletes its articles.
- **Collection detail** (`/#/collections/:collectionId`) shows the collection's
  saved articles with pagination and lets the owner remove an article.
- **Save to collection** on an article page adds or removes the article from any
  of the user's collections. The same article cannot appear twice in the same
  collection.

The backend contract for these endpoints is documented in [API.md](API.md). The
feature's design decisions and scaling considerations are in
[DESIGN_NOTE.md](DESIGN_NOTE.md).

## AI Usage

AI coding assistants (Claude / opencode) were used to plan the work, scaffold the
Collections feature (models, migrations, API, UI, tests and CI) and to review
edge cases. All generated code was reviewed, run and validated locally: the
migration apply/rollback path was exercised against a clean database, the API was
driven directly with `curl`, and the backend, frontend and end-to-end test suites
were run and kept green.

One AI suggestion that was rejected during the work: an early draft of the
membership endpoint used `POST /api/collections/:id/articles/:articleId` with the
article id in the path for both add and remove. The delete side kept the id in the
path, but the create side was changed to `POST .../articles` with the slug in the
request body, because `DELETE` request bodies are unreliable across clients and
proxies, and addressing articles by slug keeps the collection API consistent with
the rest of the RealWorld API, which deliberately hides numeric article ids.

## Known Limitations

- **No server-side caching.** Collections are private and per-user, so a cache
  layer was deliberately left out; see the tradeoff section of
  [DESIGN_NOTE.md](DESIGN_NOTE.md).
- **Cursor pagination only.** The collections list and detail endpoints paginate
  with opaque cursors only; there is no offset/page-number variant.
- **Collection name uniqueness is case-sensitive.** `Reading` and `reading` are
  treated as different names because the unique constraint is case-sensitive.
- **No collection reordering or sharing.** Collections are strictly private and
  in insertion order; sharing and manual ordering were out of scope.
- **No OpenAPI/Swagger document.** The feature is documented in [API.md](API.md);
  generating a machine-readable spec is listed as future work.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [RealWorld](https://realworld.io/)
- [RealWorld (GitHub)](https://github.com/gothinkster/realworld)
- [CodebaseShow](https://codebase.show/)
- [How to write a Good readme](https://bulldogjob.com/news/449-how-to-write-a-good-readme-for-your-github-project)
