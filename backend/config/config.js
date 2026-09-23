const parseLogging = (value) => {
  if (value === "false") return false;
  if (value === "true") return console.log;

  return undefined;
};

const databaseConfig = (prefix) => ({
  username: process.env[`${prefix}_DB_USERNAME`],
  password: process.env[`${prefix}_DB_PASSWORD`],
  database: process.env[`${prefix}_DB_NAME`],
  host: process.env[`${prefix}_DB_HOSTNAME`],
  dialect: process.env[`${prefix}_DB_DIALECT`],
  logging: parseLogging(process.env[`${prefix}_DB_LOGGING`]),
});

/** @type {import('sequelize').Options} */
module.exports = {
  development: databaseConfig("DEV"),
  test: databaseConfig("TEST"),
  production: databaseConfig("PROD"),
};
