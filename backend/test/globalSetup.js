const fs = require("fs");
const path = require("path");

process.env.NODE_ENV = "test";
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

module.exports = async () => {
  const { Client } = require("pg");
  const Sequelize = require("sequelize");
  const config = require("../config/config.js").test;

  const admin = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: "postgres",
  });

  await admin.connect();
  const existing = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [config.database],
  );

  if (existing.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${config.database}"`);
  }

  await admin.end();

  const { sequelize } = require("../models");
  const queryInterface = sequelize.getQueryInterface();

  await sequelize.query("DROP SCHEMA public CASCADE");
  await sequelize.query("CREATE SCHEMA public");

  const migrationsDir = path.join(__dirname, "..", "migrations");
  const migrations = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".js"))
    .sort();

  for (const file of migrations) {
    const migration = require(path.join(migrationsDir, file));
    await migration.up(queryInterface, Sequelize);
  }

  await sequelize.close();
};
